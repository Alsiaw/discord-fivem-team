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

client.setMaxListeners(20);

client.commands = new Collection();

console.log(`🪬 » Slash Komutlar Aktif Edildi.
----------------------`);

const commands = [];

const slashPath = path.join(__dirname, 'alsia', 'komutlar', 'Slash');
const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));

for (const file of slashFiles) {
    const filePath = path.join(slashPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

console.log(`🪬 » ${slashFiles.length} Slash Komut Aktif Edildi.`);

console.log(`----------------------
📢 » Sağ Tık Komutlar Aktif Edildi.
----------------------`);

const contextPath = path.join(__dirname, 'alsia', 'komutlar', 'SağTık');
const contextFiles = fs.readdirSync(contextPath).filter(file => file.endsWith('.js'));

for (const file of contextFiles) {
    const filePath = path.join(contextPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

console.log(`🖱️ » ${contextFiles.length} Context Menu Aktif Edildi.`);

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(ayarlar.Bot.botID, ayarlar.Bot.guildId), { body: commands });
        console.log(`----------------------
🪬 » Slash komutları başarıyla yüklendi!
----------------------`);
    } catch (error) {
        console.error('Slash komut yükleme hatası:', error);
    }
})();

console.log(`📢 » Events Aktif Edildi.
----------------------`);

const eventsPath = path.join(__dirname, 'alsia', 'events');
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
    
    const statusList = [
        'ᴀʟꜱɪᴀ ❤️ ꜱʜᴀɴᴋ',
        'ᴀʟꜱɪᴀ 💜 ꜱʜᴀɴᴋ', 
        'ᴀʟꜱɪᴀ 💙 ꜱʜᴀɴᴋ'
    ];

    let currentIndex = 0;

    const updateStatus = () => {
        client.user.setPresence({
            activities: [{ 
                name: statusList[currentIndex], 
                type: ActivityType.Playing 
            }],
            status: 'idle'
        });
        currentIndex = (currentIndex + 1) % statusList.length;
    };

    updateStatus();
    setInterval(updateStatus, 3000);

    
    
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
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Komut çalıştırılırken bir hata oluştu!*`);
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('prev_') || interaction.customId.startsWith('next_') || 
                interaction.customId.startsWith('search_prev_') || interaction.customId.startsWith('search_next_')) {
                
                try {
                    const { paginationSessions } = require('./alsia/komutlar/Slash/server-list.js');
                    const { createSearchPaginationButtons, createSearchResultEmbed } = require('./alsia/komutlar/Slash/player.js');

                    const customIdParts = interaction.customId.split('_');
                    const action = customIdParts[0];
                    
                    let sessionId;
                    if (interaction.customId.includes('search_')) {
                        sessionId = customIdParts.slice(-3).join('_');
                    } else {
                        sessionId = customIdParts.slice(-2).join('_');
                    }
                    
                    let session = paginationSessions.get(sessionId);

                    if (!session) {
                        console.log('🔄 FiveM session bulunamadı, yeniden arama gerekiyor...');
                        
                        try {
                            if (!interaction.deferred) {
                                await interaction.deferUpdate();
                            }
                            
                            return await interaction.editReply({ 
                                content: '<a:unlemsel:1327600285597569066> Buton süresi doldu. Lütfen komutu tekrar kullanın.',
                                embeds: [],
                                components: []
                            });
                        } catch (error) {
                            console.log('FiveM Interaction reply hatası (session timeout):', error.message);
                            return;
                        }
                    }

                    let newPage = session.currentPage;
                    
                    if (interaction.customId.includes('search_')) {
                        if (action === 'search' && customIdParts[1] === 'prev' && session.currentPage > 0) {
                            newPage = session.currentPage - 1;
                        } else if (action === 'search' && customIdParts[1] === 'next' && session.currentPage < session.totalPages - 1) {
                            newPage = session.currentPage + 1;
                        }

                        if (newPage !== session.currentPage) {
                            session.currentPage = newPage;
                            
                            console.log(`FiveM Search Pagination - Sayfa: ${newPage}, SearchResults count: ${session.searchResults?.length || 0}`);
                            
                            if (!session.searchResults || !Array.isArray(session.searchResults)) {
                                console.error('FiveM Session searchResults missing:', session);
                                return interaction.update({ 
                                    content: '<a:unlemsel:1327600285597569066> Arama sonuçları kayboldu. Lütfen aramayı tekrar yapın.',
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                            const embed = createSearchResultEmbed(session.searchTerm, session.searchResults, session.serverData, newPage);
                            const buttons = createSearchPaginationButtons(newPage, session.totalPages, sessionId);

                            if (interaction.deferred) {
                                await interaction.editReply({ embeds: [embed], components: [buttons] });
                            } else {
                                await interaction.update({ embeds: [embed], components: [buttons] });
                            }
                        } else {
                            if (!interaction.deferred) {
                                await interaction.deferUpdate();
                            }
                        }
                    } else {
                        const { createMainEmbed, createPaginationButtons } = require('./alsia/komutlar/Slash/server-list.js');
                        
                        if (action === 'prev' && session.currentPage > 0) {
                            newPage = session.currentPage - 1;
                        } else if (action === 'next' && session.currentPage < session.totalPages - 1) {
                            newPage = session.currentPage + 1;
                        }

                        if (newPage !== session.currentPage) {
                            session.currentPage = newPage;
                            const embed = createMainEmbed(session.serverData, newPage);
                            const buttons = createPaginationButtons(newPage, session.totalPages, sessionId);

                            if (interaction.deferred) {
                                await interaction.editReply({ embeds: [embed], components: [buttons] });
                            } else {
                                await interaction.update({ embeds: [embed], components: [buttons] });
                            }
                        } else {
                            if (!interaction.deferred) {
                                await interaction.deferUpdate();
                            }
                        }
                    }
                } catch (error) {
                    console.error('FiveM Pagination Button Handler Error:', error);
                    try {
                        const errorMessage = '<a:unlemsel:1327600285597569066> Button işlemi sırasında hata oluştu.';
                        if (interaction.deferred) {
                            await interaction.editReply({ content: errorMessage, embeds: [], components: [] });
                        } else {
                            await interaction.reply({ content: errorMessage, ephemeral: true });
                        }
                    } catch (replyError) {
                        console.error('FiveM Error reply hatası:', replyError);
                    }
                }
                return;
            }

            if (interaction.customId.startsWith('ot_prev') || interaction.customId.startsWith('ot_next')) {
                return;
            }

            if (interaction.customId.startsWith('team_prev_') || interaction.customId.startsWith('team_next_')) {
                try {
                    const { paginationSessions } = require('./alsia/komutlar/Slash/server-list.js');
                    const { createTeamEmbed, createTeamPaginationButtons } = require('./alsia/komutlar/Slash/ekip-kontrol.js');

                    const sessionId = interaction.customId.split('_').slice(-3).join('_');
                    let session = paginationSessions.get(sessionId);

                    if (!session || session.type !== 'team') {
                        return interaction.update({
                            content: '<a:unlemsel:1327600285597569066> Buton süresi doldu.',
                            embeds: [], components: []
                        });
                    }

                    let newPage = session.currentPage;
                    if (interaction.customId.includes('team_prev_') && session.currentPage > 0) {
                        newPage = session.currentPage - 1;
                    } else if (interaction.customId.includes('team_next_') && session.currentPage < session.totalPages - 1) {
                        newPage = session.currentPage + 1;
                    }

                    if (newPage !== session.currentPage) {
                        session.currentPage = newPage;
                        const embed = createTeamEmbed(session.teamMembers, session.ekipIsmi, newPage, session.totalPages, interaction);
                        const buttons = createTeamPaginationButtons(newPage, session.totalPages, sessionId);

                        await interaction.update({ embeds: [embed], components: [buttons] });
                    } else {
                        await interaction.deferUpdate();
                    }
                } catch (error) {
                    console.error('Team pagination error:', error);
                }
                return;
            }

            if (interaction.customId === 'katil' || interaction.customId === 'ayril') {
                const messageEmbeds = interaction.message?.embeds;
                if (messageEmbeds && messageEmbeds.length > 0) {
                    const embedDesc = messageEmbeds[0].description;
                    if (!embedDesc || !embedDesc.includes('Aktiflik bitti')) {
                        return;
                    }
                }
                
                const expiredEmbed = new EmbedBuilder()
                    .setColor("#490404")
                    .setTimestamp()
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Aktiflik testi süresi doldu. Artık katılamazsınız.*`);
                
                return interaction.reply({ embeds: [expiredEmbed], ephemeral: true });
            }

            if (interaction.customId.startsWith('katil_') || interaction.customId.startsWith('ayril_') || interaction.customId.startsWith('sonlandir_')) {
                const CroxyDB = require('croxydb');
                const { createEtkinlikCard } = require('./alsia/komutlar/Slash/etkinlik-kur.js');
                
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

                        await interaction.deferUpdate();

                        CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').map(e => e.id === interactionId ? etkinlik : e));

                        const katilimEmbed = new EmbedBuilder()
                            .setAuthor({ 
                                name: interaction.guild.name, 
                                iconURL: interaction.guild.iconURL({ dynamic: true }) 
                            })
                            .setColor("#490404")
                            .setDescription(`<a:unlemsel:1327600285597569066>・*Başarılı bir şekilde etkinliğe* **${etkinlik.katılanlar.length}.** *sıradan katıldınız.*`)
                            .setTimestamp();

                        await interaction.followUp({ embeds: [katilimEmbed], ephemeral: true });

                        const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                        const oluşturanUser = await interaction.guild.members.fetch(etkinlik.oluşturulanKisi);
                        
                        const canvas = await createEtkinlikCard(
                            oluşturanUser.user, 
                            etkinlikIsmi, 
                            etkinlik.katılanlar.length, 
                            etkinlik.katılacakKisiSayısı, 
                            'Sınırsız'
                        );

                        if (!canvas) {
                            return interaction.reply({ content: "Canvas oluşturulamadı!", ephemeral: true });
                        }

                        let katilimListesi = '';
                        if (etkinlik.katılanlar.length > 0) {
                            const katilimcilar = await Promise.all(etkinlik.katılanlar.map(async (id, index) => {
                                try {
                                    const member = await interaction.guild.members.fetch(id);
                                    return `${index + 1}. ${member ? member.toString() : `<@${id}>`}`;
                                } catch (error) {
                                    return `${index + 1}. <@${id}>`;
                                }
                            }));
                            katilimListesi = `\n**Katılanlar:**\n${katilimcilar.join('\n')}`;
                        }

                        const katılButonu = new ButtonBuilder()
                            .setCustomId(`katil_${interactionId}`)
                            .setLabel("・ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                            .setEmoji("<a:grsaqw:1233294278881443861>")
                            .setStyle(ButtonStyle.Primary);

                        const ayrılButonu = new ButtonBuilder()
                            .setCustomId(`ayril_${interactionId}`)
                            .setLabel("・ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                            .setEmoji("<a:cikisaw:1233284107304439889>")
                            .setStyle(ButtonStyle.Danger);

                        const sonlandırButonu = new ButtonBuilder()
                            .setCustomId(`sonlandir_${interactionId}`)
                            .setLabel("・ꜱᴏɴʟᴀɴᴅıʀ")
                            .setEmoji("<a:closex:1327586349963808769>")
                            .setStyle(ButtonStyle.Secondary);

                        const row = new ActionRowBuilder()
                            .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

                        await interaction.editReply({
                            content: katilimListesi,
                            files: [{ 
                                attachment: canvas, 
                                name: `alsia-${interactionId}.png` 
                            }],
                            components: [row]
                        });
                    }

                    if (interaction.customId.startsWith('ayril_')) {
                        if (etkinlik.katılanlar.includes(interaction.user.id)) {
                            etkinlik.katılanlar = etkinlik.katılanlar.filter(id => id !== interaction.user.id);

                            await interaction.deferUpdate();

                            CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').map(e => e.id === interactionId ? etkinlik : e));

                            const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];
                            const oluşturanUser = await interaction.guild.members.fetch(etkinlik.oluşturulanKisi);
                            
                            const canvas = await createEtkinlikCard(
                                oluşturanUser.user, 
                                etkinlikIsmi, 
                                etkinlik.katılanlar.length, 
                                etkinlik.katılacakKisiSayısı, 
                                'Sınırsız'
                            );

                            if (!canvas) {
                                return interaction.reply({ content: "Canvas oluşturulamadı!", ephemeral: true });
                            }

                            let katilimListesi = '';
                            if (etkinlik.katılanlar.length > 0) {
                                const katilimcilar = await Promise.all(etkinlik.katılanlar.map(async (id, index) => {
                                    try {
                                        const member = await interaction.guild.members.fetch(id);
                                        return `${index + 1}. ${member ? member.toString() : `<@${id}>`}`;
                                    } catch (error) {
                                        return `${index + 1}. <@${id}>`;
                                    }
                                }));
                                katilimListesi = `\n**Katılanlar:**\n${katilimcilar.join('\n')}`;
                            }

                            const katılButonu = new ButtonBuilder()
                                .setCustomId(`katil_${interactionId}`)
                                .setLabel("・ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                                .setEmoji("<a:grsaqw:1233294278881443861>")
                                .setStyle(ButtonStyle.Primary);

                            const ayrılButonu = new ButtonBuilder()
                                .setCustomId(`ayril_${interactionId}`)
                                .setLabel("・ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                                .setEmoji("<a:cikisaw:1233284107304439889>")
                                .setStyle(ButtonStyle.Danger);

                            const sonlandırButonu = new ButtonBuilder()
                                .setCustomId(`sonlandir_${interactionId}`)
                                .setLabel("・ꜱᴏɴʟᴀɴᴅıʀ")
                                .setEmoji("<a:closex:1327586349963808769>")
                                .setStyle(ButtonStyle.Secondary);

                            const row = new ActionRowBuilder()
                                .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

                            await interaction.editReply({
                                content: katilimListesi,
                                files: [{ 
                                    attachment: canvas, 
                                    name: `alsia-${interactionId}.png` 
                                }],
                                components: [row]
                            });
                        } else {
                            await interaction.followUp({ content: "Etkinlikten ayrılmamışsınız!", ephemeral: true });
                        }
                    }

                    if (interaction.customId.startsWith('sonlandir_')) {
                        await interaction.deferUpdate();
                        
                        etkinlik.tamamlandı = true;

                        const katılanlar = (await Promise.all(etkinlik.katılanlar.map(async (id, index) => {
                            try {
                                const member = await interaction.guild.members.fetch(id);
                                return `${index + 1}. ${member ? member.toString() : `<@${id}>`}`;
                            } catch (error) {
                                return `${index + 1}. <@${id}>`;
                            }
                        }))).join('\n');

                        const etkinlikIsmi = etkinlik.etkinlikIsmi.split('_')[0];

                        const indirButonu2 = new ButtonBuilder()
                            .setCustomId(`katilim_indir_manuel_${interactionId}`)
                            .setLabel('・ᴋᴀᴛıʟıᴍ ʟɪꜱᴛᴇꜱɪɴɪ ɪɴᴅɪʀ')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('<a:duyuru:1327600220879716396>');

                        const indirmeRow2 = new ActionRowBuilder()
                            .addComponents(indirButonu2);

                        const tamamlanmisEtkinlikler = CroxyDB.get('tamamlanmisEtkinlikler') || [];
                        tamamlanmisEtkinlikler.push(etkinlik);
                        CroxyDB.set('tamamlanmisEtkinlikler', tamamlanmisEtkinlikler);

                        CroxyDB.set('etkinlikler', CroxyDB.get('etkinlikler').filter(e => e.id !== interactionId));

                        await interaction.editReply({
                            content: `**# ETKINLIK LISTE**\n${katılanlar || ''}`,
                            embeds: [],
                            components: [indirmeRow2]
                        });
                    }
                } catch (error) {
                    console.error('Etkinlik Button Handler Error:', error);
                    try {
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ content: "Bir hata oluştu. Lütfen tekrar deneyin.", ephemeral: true });
                        } else {
                            await interaction.followUp({ content: "Bir hata oluştu. Lütfen tekrar deneyin.", ephemeral: true });
                        }
                    } catch (replyError) {
                        console.error('Reply error:', replyError);
                    }
                }
                return;
            }

            if (interaction.customId === 'katilim_indir') {
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
                        files: [{ attachment: buffer, name: `${etkinlikIsmi}_katılım_listesi.txt` }], 
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

                let dmDurumu = '';
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
                    dmDurumu = '<a:onay:1327600261698420767>・`ʙᴀꜱᴀʀıʟı`';
                } catch (error) {
                    console.error('DM gönderilemedi, kullanıcının DM\'leri kapalı:', error.message);
                    dmDurumu = '<a:red:1327600270032764928>・`ʙᴀꜱᴀʀıꜱıᴢ`';
                }

                const logEmbed = new EmbedBuilder()
                    .setTitle('<a:right:1327586133411889237> ᴏᴛ ᴛᴀʟᴇʙɪ ᴏɴᴀʏʟᴀɴᴅı')
                    .setColor('#0f1148')
                    .addFields(
                        { name: 'ɪ̇şʟᴇᴍ', value: 'ᴛᴀʟᴇᴘ ᴏɴᴀʏʟᴀᴍᴀ', inline: true },
                        { name: 'ᴏɴᴀʏʟᴀʏᴀɴ ʏᴇᴛᴋɪʟɪ', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${user.id}>`, inline: true },
                        { name: 'ᴇᴋʟᴇɴᴇɴ ᴍɪᴋᴛᴀʀ', value: `${miktar}`, inline: true },
                        { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
                        { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true },
                        { name: 'ᴅᴍ ɢöɴᴅᴇʀɪᴍɪ', value: dmDurumu, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ot Sistemi - Talep Onaylama' });

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.otLogKanalId || ayarlar.Kanallar.logKanalId);
                await logChannel.send({ embeds: [logEmbed] });

                await interaction.update({
                    content: `<a:onay:1327600261698420767> ***Talep onaylandı***  <@${user.id}> ***kUllanıcısına ${miktar} ot eklendi.***`,
                    embeds: [],
                    components: []
                });
            }

            if (interaction.customId === 'ot-reddet') {
            if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
                return interaction.reply({ content: 'Bu işlemi yapmaya yetkiniz yok!', ephemeral: true });
            }

                const embed = interaction.message?.embeds?.[0];
                if (!embed || !embed.fields) {
                    return interaction.reply({ content: 'Geçersiz talep formatı!', ephemeral: true });
                }

                const userIdField = embed.fields.find(f => f.name === 'ᴋᴜʟʟᴀɴıᴄı ıᴅ');
                if (!userIdField) {
                    return interaction.reply({ content: 'Kullanıcı bilgisi bulunamadı!', ephemeral: true });
                }

                const userId = userIdField.value;
                const user = await client.users.fetch(userId);

                let dmDurumu = '';
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
                    dmDurumu = '<a:onay:1327600261698420767>・`ʙᴀꜱᴀʀıʟı`';
                } catch (error) {
                    console.error('DM gönderilemedi, kullanıcının DM\'leri kapalı:', error.message);
                    dmDurumu = '<a:red:1327600270032764928>・`ʙᴀꜱᴀʀıꜱıᴢ`';
                }

                const logEmbed = new EmbedBuilder()
                    .setTitle('<a:red:1327600270032764928> ᴏᴛ ᴛᴀʟᴇʙɪ ʀᴇᴅᴅᴇᴅɪʟᴅɪ')
                    .setColor('#0f1148')
                    .addFields(
                        { name: 'ɪ̇şʟᴇᴍ', value: 'ᴛᴀʟᴇᴘ ʀᴇᴅᴅᴇᴛᴍᴇ', inline: true },
                        { name: 'ʀᴇᴅᴅᴇᴅᴇɴ ʏᴇᴛᴋɪʟɪ', value: `${interaction.user.tag}`, inline: true },
                        { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${user.id}>`, inline: true },
                        { name: 'ᴅᴍ ɢöɴᴅᴇʀɪᴍɪ', value: dmDurumu, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ot Sistemi - Talep Reddetme' });

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.otLogKanalId);
                await logChannel.send({ embeds: [logEmbed] });

                await interaction.update({
                    content: `<a:red:1327600270032764928> Talep reddedildi!`,
                    embeds: [],
                    components: []
                });
            }

            if (interaction.customId === 'bildir') {
                await handleBildir(interaction);
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ot-talep-modal') {
                const miktar = parseInt(interaction.fields.getTextInputValue('miktar'));
                if (isNaN(miktar) || miktar <= 0) {
                    return interaction.reply({ content: 'Geçerli bir miktar giriniz.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('<a:onay:1327600261698420767> ᴏᴛ ᴛᴀʟᴇᴘ ʙᴀꜱᴠᴜʀᴜꜱᴜ')
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

                const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.otLogKanalId);
                await logChannel.send({ embeds: [embed], components: [row] });

                await interaction.reply({ content: 'Talebiniz başarıyla gönderildi!', ephemeral: true });
            }

            if (interaction.customId.startsWith('ban_modal_')) {
                const targetUserId = interaction.customId.split('_')[2];
                const sebep = interaction.fields.getTextInputValue('ban_sebep');
                
                try {
                    const targetMember = await interaction.guild.members.fetch(targetUserId);
                    const { executeBan } = require('./alsia/komutlar/SağTık/ban.js');
                    
                    await interaction.deferReply();
                    await executeBan(interaction, targetMember, sebep);
                } catch (error) {
                    console.error('Context ban hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Ban işlemi sırasında bir hata oluştu.*");
                    
                    if (interaction.deferred) {
                        await interaction.editReply({ embeds: [errorEmbed] });
                    } else {
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
            }

            if (interaction.customId.startsWith('ot_ekle_modal_')) {
                const targetUserId = interaction.customId.split('_')[3];
                const miktarText = interaction.fields.getTextInputValue('ot_ekle_miktar');
                const miktar = parseInt(miktarText);
                
                if (isNaN(miktar) || miktar <= 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir miktar giriniz.*");
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                
                try {
                    const targetUser = await interaction.guild.members.fetch(targetUserId);
                    const { executeOtEkle } = require('./alsia/komutlar/SağTık/ot-ekle.js');
                    
                    await interaction.deferReply({ ephemeral: true });
                    await executeOtEkle(interaction, targetUser.user, miktar);
                } catch (error) {
                    console.error('Context ot ekle hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Ot ekleme işlemi sırasında bir hata oluştu.*");
                    
                    if (interaction.deferred) {
                        await interaction.editReply({ embeds: [errorEmbed] });
                    } else {
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
            }

            if (interaction.customId.startsWith('ot_sil_modal_')) {
                const targetUserId = interaction.customId.split('_')[3];
                const miktarText = interaction.fields.getTextInputValue('ot_sil_miktar');
                const miktar = parseInt(miktarText);
                
                if (isNaN(miktar) || miktar <= 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir miktar giriniz.*");
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                
                try {
                    const targetUser = await interaction.guild.members.fetch(targetUserId);
                    const { executeOtSil } = require('./alsia/komutlar/SağTık/ot-sil.js');
                    
                    await interaction.deferReply({ ephemeral: true });
                    await executeOtSil(interaction, targetUser.user, miktar);
                } catch (error) {
                    console.error('Context ot sil hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Ot silme işlemi sırasında bir hata oluştu.*");
                    
                    if (interaction.deferred) {
                        await interaction.editReply({ embeds: [errorEmbed] });
                    } else {
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
            }
        }

    } catch (err) {
        console.error('interactionCreate error:', err);
    }
});

async function handleBildir(interaction) {
    const channel = interaction.channel;
    const channelId = channel.id;
    const guildId = interaction.guild.id;
    
    const CroxyDB = require('croxydb');
    const ticketData = CroxyDB.get(`ticketChannelUser_${guildId}_${channelId}`);
    
    if (!ticketData) {
        return interaction.reply({
            content: 'Bu kanal için ticket bilgisi bulunamadı.',
            ephemeral: true
        });
    }
    
    if (ticketData.user !== interaction.user.id) {
        const noPermEmbed = new EmbedBuilder()
            .setColor("#490404")
            .setTimestamp()
            .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yalnızca bu destek talebini açan kişi bildirim sistemini aktifleştirebilir.*`);
        return interaction.reply({ embeds: [noPermEmbed], ephemeral: false });
    }
    
    ticketData.notify = true;
    ticketData.notified = false;
    CroxyDB.set(`ticketChannelUser_${guildId}_${channelId}`, ticketData);
    
    const embed = new EmbedBuilder()
        .setColor('#490404')
        .setTitle(`${ayarlar.Embed.authorembed} - ʙıʟᴅıʀıᴍ ꜱıꜱᴛᴇᴍı`)
        .setDescription(' <a:1360toggleon:1327585184547213363> ・ *Sistem açıldı, mesaj yazılınca sizlere dm yolundan ileticektir.*\n\n**[DM KUTUNUZ AÇIK OLMASI GEREKMEKTEDİR AKSİ HALDE MESAJ GELMEZ]**')
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    activateMessageListener(client, channelId, ticketData.user);
}

function activateMessageListener(client, channelId, userId) {
    if (!client._activeTicketListeners || !client._activeTicketListeners.includes(channelId)) {
        if (!client._activeTicketListeners) {
            client._activeTicketListeners = [];
        }
        
        client._activeTicketListeners.push(channelId);
        
        client.on('messageCreate', async (message) => {
            if (message.channel.id !== channelId || message.author.bot || message.author.id === userId) return;
            
            const member = message.guild.members.cache.get(message.author.id);
            const isStaff = member && ayarlar.Yetkiler.Staff.some(rolID => member.roles.cache.has(rolID));
            if (!isStaff) return;
            
            const CroxyDB = require('croxydb');
            const ticketData = CroxyDB.get(`ticketChannelUser_${message.guild.id}_${channelId}`);
            if (!ticketData || !ticketData.notify || ticketData.notified) return;
            
            ticketData.notified = true;
            CroxyDB.set(`ticketChannelUser_${message.guild.id}_${channelId}`, ticketData);
            
            const ticketUser = await message.client.users.fetch(userId).catch(() => null);
            if (!ticketUser) return;
            
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#490404')
                    .setTitle(`${ayarlar.Embed.authorembed} - ʙıʟᴅıʀıᴍ ꜱıꜱᴛᴇᴍı`)
                    .setDescription(`<:onday:1327600263242059848> *・ <#${channelId}> kanalındaki destek talebinize yeni bir mesaj geldi.*`)
                    .setTimestamp();
                
                await ticketUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                const ticketChannel = message.guild.channels.cache.get(channelId);
                if (ticketChannel) {
                    const dmFailEmbed = new EmbedBuilder()
                        .setColor("#490404")
                        .setTimestamp()
                        .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Destek talebinize yanıt verildi ancak özel mesajlarınız kapalı olduğu için bildirim gönderilemedi.*`);
                    await ticketChannel.send({ content: `<@${userId}>`, embeds: [dmFailEmbed] });
                }
            }
        });
    }
}

client.login(token);
