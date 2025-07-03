const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { token, mongoURL } = require('./config.json');
const db = require('./db');
const mongoose = require('mongoose');
const ayarlar = require('./ayarlar.json');
const moment = require('moment');
const axios = require('axios');
moment.locale('tr');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.commands = new Collection();

console.log(`🪬 » Slash Komutlar Aktif Edildi.
----------------------`);

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    console.log(`🪬  » [${command.data.name}] İsimli Komut Aktif!`);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(ayarlar.Bot.clientId, ayarlar.Bot.guildId), { body: commands });
        console.log(`----------------------
🪬 » Slash komutları başarıyla yüklendi!
----------------------`);
    } catch (error) {
        console.error('Slash komut yükleme hatası:', error);
    }
})();

console.log(`📢 » Events Aktif Edildi.
----------------------`);

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.name && event.başlat) {
                client.on(event.name, (...args) => event.başlat(...args));
            }
        } catch (error) {
            console.error(`Event yüklenirken hata (${file}):`, error);
        }
    }
}

console.log(`----------------------
📢 » Tüm Events başarıyla yüklendi!
----------------------`);

mongoose.connect(mongoURL).then(() => {
    console.log(`💾 » MongoDB bağlantısı başarılı!
----------------------`);
}).catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    console.log(`⚠️ » MongoDB bağlantısı başarısız, bot CroxyDB ile çalışmaya devam ediyor.
----------------------`);
});

client.once('ready', async () => {
    console.log(`✅ [${moment(Date.now()).format("LLL")}] » [${client.user.username}] İsimli Bot Aktif Edildi.
----------------------`);
    
    const durumTipi = ayarlar.Bot.durumTipi === 'PLAYING' ? ActivityType.Playing :
                     ayarlar.Bot.durumTipi === 'WATCHING' ? ActivityType.Watching :
                     ayarlar.Bot.durumTipi === 'LISTENING' ? ActivityType.Listening :
                     ayarlar.Bot.durumTipi === 'STREAMING' ? ActivityType.Streaming :
                     ActivityType.Playing;
    
    client.user.setActivity(ayarlar.Bot.durum, { type: durumTipi });
    console.log(`🎮 » Bot durumu ayarlandı: ${ayarlar.Bot.durum}
----------------------`);
    
    const connectToVoiceChannel = async () => {
        try {
            const channel = await client.channels.fetch(ayarlar.Kanallar.sesKanalId);
            if (channel) {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                console.log(`🔊 » Ses kanalına bağlanıldı!
----------------------`);
                return connection;
            }
        } catch (error) {
            console.error('Ses kanalına bağlanırken hata:', error);
        }
    };

    await connectToVoiceChannel();

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.member.id === client.user.id && oldState.channelId && !newState.channelId) {
            console.log('🔊 » Ses bağlantısı düştü, yeniden bağlanılıyor...');
            await connectToVoiceChannel();
        }
    });
});

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction) return;

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                if (command.alsia) {
                    await command.alsia(client, interaction);
                } else {
                    await command.execute(interaction);
                }
            } catch (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setColor("#490404")
                    .setTimestamp()
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Hata:*** *Komut çalıştırılırken bir hata oluştu!*`);
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('katil_') || interaction.customId.startsWith('ayril_') || interaction.customId.startsWith('sonlandir_')) {
                const CroxyDB = require('croxydb');
                
                try {
                    const interactionId = interaction.customId.split('_')[1];
                    const etkinlik = CroxyDB.get('etkinlikler')?.find(e => e.id === interactionId);
                    
                    if (!etkinlik || etkinlik.tamamlandı) {
                        return interaction.reply({ content: "Bu etkinlik artık mevcut değil veya tamamlanmış.", ephemeral: true });
                    }

                    const member = await interaction.guild.members.fetch(interaction.user.id);
                    
                    if (interaction.customId.startsWith('sonlandir_')) {
                        if (etkinlik.oluşturulanKisi !== interaction.user.id) {
                            return interaction.reply({ content: "Sadece etkinliği oluşturan kişi bu butonu kullanabilir.", ephemeral: true });
                        }
                    } else {
                        if (!member.roles.cache.has(ayarlar.Yetkiler.ekipRoleId)) {
                            return interaction.reply({ content: "Sadece Ekip rolüne sahip üyeler bu butonları kullanabilir.", ephemeral: true });
                        }
                    }

                    if (interaction.customId.startsWith('katil_')) {
                        if (etkinlik.katılanlar.includes(interaction.user.id)) {
                            return interaction.reply({ content: "Zaten katıldınız!", ephemeral: true });
                        }

                        etkinlik.katılanlar.push(interaction.user.id);

                        if (etkinlik.katılanlar.length >= etkinlik.katılacakKisiSayısı) {
                            etkinlik.tamamlandı = true;

                            const katılanlar = (await Promise.all(etkinlik.katılanlar.map(async (id) => {
                                try {
                                    const member = await interaction.guild.members.fetch(id);
                                    return `${member ? member.toString() : `<@${id}>`}`;
                                } catch (error) {
                                    return `<@${id}>`;
                                }
                            }))).join('\n');

                            const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                            const yeniEmbed = new EmbedBuilder()
                                .setTitle(`${etkinlikIsmi} SONLANDIRILDI`)
                                .setDescription(`ᴇᴛᴋɪɴʟɪᴋ ᴋᴀᴛıʟıᴍᴄıʟᴀʀı:\n${katılanlar}`)
                                .setColor(ayarlar.Renkler.primary)
                                .setImage(ayarlar.Resimler.banner)
                                .setFooter({ text: 'developed by alsia' });

                            const indirButonu = new ButtonBuilder()
                                .setCustomId(`katilim_indir_${interactionId}`)
                                .setLabel('ᴋᴀᴛıʟıᴍ ʟɪꜱᴛᴇꜱɪɴɪ ɪɴᴅɪʀ')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('<a:duyuru:1327600220879716396>');

                            const indirmeRow = new ActionRowBuilder()
                                .addComponents(indirButonu);

                            const tamamlanmisEtkinlikler = CroxyDB.get('tamamlanmisEtkinlikler') || [];
                            tamamlanmisEtkinlikler.push(etkinlik);
                            CroxyDB.set('tamamlanmisEtkinlikler', tamamlanmisEtkinlikler);

                            CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').filter(e => e.id !== interactionId));

                            await interaction.update({
                                content: `# <a:duyuru:1327600220879716396> ᴇᴛᴋɪɴʟɪᴋ ᴋᴀᴛıʟıᴍᴄıʟᴀʀı:\n${katılanlar}`,
                                embeds: [yeniEmbed],
                                components: [indirmeRow]
                            });
                        } else {
                            CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').map(e => e.id === interactionId ? etkinlik : e));

                            const katılanlar = (await Promise.all(etkinlik.katılanlar.map(async (id) => {
                                try {
                                    const member = await interaction.guild.members.fetch(id);
                                    return `${member ? member.toString() : `<@${id}>`}`;
                                } catch (error) {
                                    return `<@${id}>`;
                                }
                            }))).join('\n');

                            const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                            const yeniEmbed = new EmbedBuilder()
                                .setTitle(etkinlikIsmi)
                                .setDescription(`ᴋᴀᴛıʟᴀɴ: ${etkinlik.katılanlar.length}/${etkinlik.katılacakKisiSayısı} ᴋıꜱı ᴇᴛᴋɪɴʟɪɢ̆ᴇ ᴋᴀᴛıʟᴅı\nᴋᴀᴛıʟıᴍᴄıʟᴀʀ:\n${katılanlar}`)
                                .setColor(ayarlar.Renkler.primary)
                                .setImage(ayarlar.Resimler.banner)
                                .setFooter({ text: 'developed by alsia' });

                            const katılButonu = new ButtonBuilder()
                                .setCustomId(`katil_${interactionId}`)
                                .setLabel(" ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                                .setEmoji("<a:grsaqw:1233294278881443861>")
                                .setStyle(ButtonStyle.Primary);

                            const ayrılButonu = new ButtonBuilder()
                                .setCustomId(`ayril_${interactionId}`)
                                .setLabel(" ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                                .setEmoji("<a:cikisaw:1233284107304439889>")
                                .setStyle(ButtonStyle.Danger);

                            const sonlandırButonu = new ButtonBuilder()
                                .setCustomId(`sonlandir_${interactionId}`)
                                .setLabel(" ꜱᴏɴʟᴀɴᴅıʀ")
                                .setEmoji("<a:closex:1327586349963808769>")
                                .setStyle(ButtonStyle.Secondary);

                            const row = new ActionRowBuilder()
                                .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

                            await interaction.update({
                                embeds: [yeniEmbed],
                                content: `${etkinlik.katılanlar.length}/${etkinlik.katılacakKisiSayısı} ᴋıꜱı ᴇᴛᴋɪɴʟɪɢ̆ᴇ ᴋᴀᴛıʟᴅı`,
                                components: [row]
                            });
                        }
                    }

                    if (interaction.customId.startsWith('ayril_')) {
                        if (etkinlik.katılanlar.includes(interaction.user.id)) {
                            etkinlik.katılanlar = etkinlik.katılanlar.filter(id => id !== interaction.user.id);

                            CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').map(e => e.id === interactionId ? etkinlik : e));

                            const katılanlar = (await Promise.all(etkinlik.katılanlar.map(async (id) => {
                                try {
                                    const member = await interaction.guild.members.fetch(id);
                                    return `${member ? member.toString() : `<@${id}>`}`;
                                } catch (error) {
                                    return `<@${id}>`;
                                }
                            }))).join('\n');

                            const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                            const yeniEmbed = new EmbedBuilder()
                                .setTitle(etkinlikIsmi)
                                .setDescription(`ᴋᴀᴛıʟᴀɴ: ${etkinlik.katılanlar.length}/${etkinlik.katılacakKisiSayısı} ᴋıꜱı ᴇᴛᴋɪɴʟɪɢ̆ᴇ ᴋᴀᴛıʟᴅı\nᴋᴀᴛıʟıᴍᴄıʟᴀʀ:\n${katılanlar || 'Henüz kimse katılmadı'}`)
                                .setColor(ayarlar.Renkler.primary)
                                .setImage(ayarlar.Resimler.banner)
                                .setFooter({ text: 'developed by alsia' });

                            const katılButonu = new ButtonBuilder()
                                .setCustomId(`katil_${interactionId}`)
                                .setLabel(" ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                                .setEmoji("<a:grsaqw:1233294278881443861>")
                                .setStyle(ButtonStyle.Primary);

                            const ayrılButonu = new ButtonBuilder()
                                .setCustomId(`ayril_${interactionId}`)
                                .setLabel(" ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                                .setEmoji("<a:cikisaw:1233284107304439889>")
                                .setStyle(ButtonStyle.Danger);

                            const sonlandırButonu = new ButtonBuilder()
                                .setCustomId(`sonlandir_${interactionId}`)
                                .setLabel(" ꜱᴏɴʟᴀɴᴅıʀ")
                                .setEmoji("<a:closex:1327586349963808769>")
                                .setStyle(ButtonStyle.Secondary);

                            const row = new ActionRowBuilder()
                                .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

                            await interaction.update({
                                content: `${etkinlik.katılanlar.length}/${etkinlik.katılacakKisiSayısı} ᴋıꜱı ᴇᴛᴋɪɴʟɪɢ̆ᴇ ᴋᴀᴛıʟᴅı.`,
                                embeds: [yeniEmbed],
                                components: [row]
                            });
                        } else {
                            interaction.reply({ content: "Etkinlikten ayrılmamışsınız!", ephemeral: true });
                        }
                    }

                    if (interaction.customId.startsWith('sonlandir_')) {
                        etkinlik.tamamlandı = true;

                        const katılanlar = (await Promise.all(etkinlik.katılanlar.map(async (id) => {
                            try {
                                const member = await interaction.guild.members.fetch(id);
                                return `${member ? member.toString() : `<@${id}>`}`;
                            } catch (error) {
                                return `<@${id}>`;
                            }
                        }))).join('\n');

                        const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                        const sonlandırmaEmbed = new EmbedBuilder()
                            .setTitle(`${etkinlikIsmi} SONLANDIRILDI`)
                            .setDescription(`ᴇᴛᴋɪɴʟɪᴋ ᴋᴀᴛıʟıᴍᴄıʟᴀʀı:\n${katılanlar || 'Kimse katılmadı'}`)
                            .setColor(ayarlar.Renkler.primary)
                            .setImage(ayarlar.Resimler.banner)
                            .setFooter({ text: 'developed by alsia' });

                        const indirButonu2 = new ButtonBuilder()
                            .setCustomId(`katilim_indir_manuel_${interactionId}`)
                            .setLabel('ᴋᴀᴛıʟıᴍ ʟɪꜱᴛᴇꜱɪɴɪ ɪɴᴅɪʀ')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('<a:duyuru:1327600220879716396>');

                        const indirmeRow2 = new ActionRowBuilder()
                            .addComponents(indirButonu2);

                        const tamamlanmisEtkinlikler = CroxyDB.get('tamamlanmisEtkinlikler') || [];
                        tamamlanmisEtkinlikler.push(etkinlik);
                        CroxyDB.set('tamamlanmisEtkinlikler', tamamlanmisEtkinlikler);

                        CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').filter(e => e.id !== interactionId));

                        await interaction.update({
                            content: `# <a:duyuru:1327600220879716396> ᴇᴛᴋɪɴʟɪᴋ ᴋᴀᴛıʟıᴍᴄıʟᴀʀı:\n${katılanlar || 'Kimse katılmadı'}`,
                            embeds: [sonlandırmaEmbed],
                            components: [indirmeRow2]
                        });
                    }
                } catch (error) {
                    console.error('Etkinlik Button Handler Error:', error);
                    interaction.reply({ content: "Bir hata oluştu. Lütfen tekrar deneyin.", ephemeral: true });
                }
                return;
            }

            if (interaction.customId.startsWith('katilim_indir_')) {
                const CroxyDB = require('croxydb');
                
                try {
                    const interactionId = interaction.customId.includes('manuel') ? 
                        interaction.customId.split('_')[3] : 
                        interaction.customId.split('_')[2];
                    
                    const tamamlanmisEtkinlikler = CroxyDB.get('tamamlanmisEtkinlikler') || [];
                    const etkinlik = tamamlanmisEtkinlikler.find(e => e.id === interactionId);
                    
                    if (!etkinlik) {
                        return interaction.reply({ content: "Etkinlik bilgileri bulunamadı.", ephemeral: true });
                    }

                    const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                    const katilimcilar = etkinlik.katılanlar.map((id) => `<@${id}>`).join('\n');
                    const katilanlarTxt = `Etkinlik: ${etkinlikIsmi}\nKatılan Kişi Sayısı: ${etkinlik.katılanlar.length}\n\nKatılanlar:\n${katilimcilar || 'Kimse katılmadı'}`;
                    const buffer = Buffer.from(katilanlarTxt, 'utf-8');
                    
                    await interaction.reply({ 
                        files: [{ attachment: buffer, name: `${etkinlikIsmi}_katilim_listesi.txt` }], 
                        ephemeral: true 
                    });
                } catch (error) {
                    console.error('Katılım İndirme Error:', error);
                    await interaction.reply({ content: "Dosya indirilemedi, lütfen tekrar deneyin.", ephemeral: true });
                }
                return;
            }

            if (interaction.customId === 'ot-ekle-talep') {
                const modal = new ModalBuilder()
                    .setCustomId('ot-talep-modal')
                    .setTitle('Ot Talep Formu');
                const miktarInput = new TextInputBuilder()
                    .setCustomId('miktar')
                    .setLabel('Talep edilecek ot miktarı')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(5)
                    .setPlaceholder('Miktar giriniz (örn: 100)')
                    .setRequired(true);
                const actionRow = new ActionRowBuilder().addComponents(miktarInput);
                modal.addComponents(actionRow);
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'ot-onayla') {
                if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
                    return interaction.reply({ content: 'Bu işlemi yapmaya yetkiniz yok!', ephemeral: true });
                }

                const embed = interaction.message?.embeds?.[0];
                if (!embed || !embed.fields) {
                    return interaction.reply({ content: 'Geçersiz talep formatı!', ephemeral: true });
                }

                const userIdField = embed.fields.find(f => f.name === 'ᴋᴜʟʟᴀɴıᴄı ɪᴅ');
                const miktarField = embed.fields.find(f => f.name === 'ᴛᴀʟᴇᴘ ᴍɪᴋᴛᴀʀı');

                if (!userIdField || !miktarField) {
                    return interaction.reply({ content: 'Talep bilgileri eksik!', ephemeral: true });
                }

                const userId = userIdField.value;
                const miktar = parseInt(miktarField.value);
                const user = await client.users.fetch(userId);
                const otData = db.getOt(userId);
                const yeniMiktar = db.addOt(userId, miktar);

                const logEmbed = new EmbedBuilder()
                    .setTitle('<a:right:1327586133411889237> ᴏᴛ ᴛᴀʟᴇʙɪ ᴏɴᴀʏʟᴀɴᴅı')
                    .setColor('#0f1148')
                    .addFields(
                        { name: 'ɪ̇şʟᴇᴍ', value: 'ᴛᴀʟᴇᴘ ᴏɴᴀʏʟᴀᴍᴀ', inline: true },
                        { name: 'ᴏɴᴀʏʟᴀʏᴀɴ ʏᴇᴛᴋɪʟɪ', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'ʏᴇᴛᴋɪʟɪ ɪᴅ', value: `${interaction.user.id}`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${user.id}>`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıᴄı ıᴅ', value: userId, inline: true },
                        { name: 'ᴇᴋʟᴇɴᴇɴ ᴍɪᴋᴛᴀʀ', value: `${miktar}`, inline: true },
                        { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
                        { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true },
                        { name: 'ᴛᴀʀɪʜ', value: `${new Date().toLocaleString()}`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ot Sistemi - Talep Onaylama' });

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.logKanalId);
                await logChannel.send({ embeds: [logEmbed] });

                await interaction.update({
                    content: `<a:onay:1327600261698420767> Talep onaylandı! ${user.tag} ᴋᴜʟʟᴀɴıᴄısına ${miktar} ot eklendi.`,
                    embeds: [],
                    components: []
                });

                try {
                    await user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('<a:right:1327586133411889237> Ot talebiniz onaylandı')
                                .setColor('#0f1148')
                                .setDescription(`Talebiniz yetkili tarafından onaylandı!`)
                                .addFields(
                                    { name: 'Eklenen Miktar', value: `${miktar}`, inline: true },
                                    { name: 'Yeni Toplam', value: `${yeniMiktar}`, inline: true }
                                )
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('DM gönderilemedi, kullanıcının DM\'leri kapalı:', error.message);
                    
                    const dmErrorEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('📨 DM Bildirimi')
                        .setDescription(`<@${userId}> Ot talebiniz onaylandı! DM'leriniz kapalı olduğu için buradan bildirildi.`)
                        .addFields(
                            { name: 'Eklenen Miktar', value: `${miktar}`, inline: true },
                            { name: 'Yeni Toplam', value: `${yeniMiktar}`, inline: true }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [dmErrorEmbed] });
                }
            }

            if (interaction.customId === 'ot-reddet') {
                if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
                    return interaction.reply({ content: 'Bu işlemi yapmaya yetkiniz yok!', ephemeral: true });
                }

                const embed = interaction.message.embeds[0];
                const userId = embed.fields.find(f => f.name === 'ᴋᴜʟʟᴀɴıᴄı ıᴅ').value;
                const user = await client.users.fetch(userId);

                const logEmbed = new EmbedBuilder()
                    .setTitle('<a:red:1327600270032764928> ᴏᴛ ᴛᴀʟᴇʙɪ ʀᴇᴅᴅᴇᴅɪʟᴅɪ')
                    .setColor('#0f1148')
                    .addFields(
                        { name: 'ɪ̇şʟᴇᴍ', value: 'ᴛᴀʟᴇᴘ ʀᴇᴅᴅᴇᴛᴍᴇ', inline: true },
                        { name: 'ʀᴇᴅᴅᴇᴅᴇɴ ʏᴇᴛᴋɪʟɪ', value: `${interaction.user.tag}`, inline: true },
                        { name: 'ʏᴇᴛᴋɪʟɪ ɪᴅ', value: `${interaction.user.id}`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${user.id}>`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıᴄı ıᴅ', value: userId, inline: true },
                        { name: 'ᴛᴀʀɪʜ', value: `${new Date().toLocaleString()}`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ot Sistemi - Talep Reddetme' });

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.logKanalId);
                await logChannel.send({ embeds: [logEmbed] });

                await interaction.update({
                    content: `<a:red:1327600270032764928> Talep reddedildi!`,
                    embeds: [],
                    components: []
                });

                try {
                    await user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('<a:red:1327600270032764928> Ot talebiniz reddedildi')
                                .setColor('#0f1148')
                                .setDescription(`Talebiniz yetkili tarafından reddedildi.`)
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('DM gönderilemedi, kullanıcının DM\'leri kapalı:', error.message);
                    
                    const dmErrorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('📨 DM Bildirimi')
                        .setDescription(`<@${userId}> Ot talebiniz reddedildi. DM'leriniz kapalı olduğu için buradan bildirildi.`)
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [dmErrorEmbed] });
                }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ot-talep-modal') {
                const miktar = parseInt(interaction.fields.getTextInputValue('miktar'));
                if (isNaN(miktar) || miktar <= 0) {
                    return interaction.reply({ content: 'Geçerli bir miktar giriniz.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('<a:onay:1327600261698420767> ᴏᴛ ᴛᴀʟᴇᴘ ʙᴀꜱ̧ᴠᴜʀᴜꜱᴜ')
                    .setColor('#0f1148')
                    .addFields(
                        { name: 'ᴋᴜʟʟᴀɴıᴄı', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıᴄı ɪᴅ', value: interaction.user.id, inline: true },
                        { name: 'ᴛᴀʟᴇᴘ ᴍɪᴋᴛᴀʀı', value: `${miktar}`, inline: true },
                        { name: 'ᴛᴀʀɪʜ', value: new Date().toLocaleString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ot Sistemi - Talep Formu' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ot-onayla').setLabel('Onayla').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('ot-reddet').setLabel('Reddet').setStyle(ButtonStyle.Danger)
                );

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.logKanalId);
                await logChannel.send({ embeds: [embed], components: [row] });

                await interaction.reply({ content: 'Talebiniz başarıyla gönderildi!', ephemeral: true });
            }
        }

    } catch (err) {
        console.error('interactionCreate error:', err);
    }
});

client.login(token);
