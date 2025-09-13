const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');

function parseSure(sureStr) {
    const match = sureStr.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 60 * 60;
    if (unit === 'd') return value * 24 * 60 * 60;
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aktiflik-baslat')
        .setDescription('Aktiflik sistemi başlatır. Örnek: Süre: 10s (saniye), 5m (dakika), 2h (saat), 1d (gün)')
        .addRoleOption(option =>
            option.setName('rol').setDescription('Aktiflik Testi Yapılacak Rol').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sure').setDescription('Örnek: Süre: 10s (saniye), 5m (dakika), 2h (saat), 1d (gün)').setRequired(true)
        ),
    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username , iconURL: interaction.member.user.avatarURL({dynamic: true})})
            .setColor("#490404")
            .setTimestamp()
            
        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], 
                ephemeral: true 
            });
        }

        const rol = interaction.options.getRole('rol');
        const sureStr = interaction.options.getString('sure');
        const sure = parseSure(sureStr);
        if (!sure) return interaction.reply({ content: 'Geçersiz süre formatı! saniye için (s) örn. 10s, dakika için (m) örn. 5m, saat için (h) örn. 2h, gün için (d) örn. 1d', ephemeral: true });
        const bitis = Math.floor((Date.now() + sure * 1000) / 1000);
        let katilanlar = [];
        const embed = new EmbedBuilder()
            .setTitle('Aktiflik Testi')
            .setDescription(`*Rol:* ${rol.toString()}\n*Bitiş:* <t:${bitis}:F>\n*Sona Erme Tarihi:* <t:${bitis}:R>\n*Katılanlar:*`)
            .setColor('#041f49');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('katil').setLabel('・ᴀᴋᴛɪꜰʟɪɢ̆ᴇ ᴋᴀᴛıʟ').setStyle(ButtonStyle.Primary).setEmoji('<a:onay:1327600261698420767>'),
            new ButtonBuilder().setCustomId('ayril').setLabel('・ᴀᴋᴛɪꜰʟɪᴋᴛᴇɴ ᴀʏʀıʟ').setStyle(ButtonStyle.Danger).setEmoji('<a:red:1327600270032764928>')
        );
        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const filter = i => ['katil', 'ayril'].includes(i.customId);
        const collector = msg.createMessageComponentCollector({ filter, time: sure * 1000 });
        collector.on('collect', async i => {
            if (i.customId === 'katil') {
                if (katilanlar.includes(i.user.id)) {
                    const alreadyJoinedEmbed = new EmbedBuilder()
                        .setAuthor({ 
                            name: interaction.guild.name, 
                            iconURL: interaction.guild.iconURL({ dynamic: true }) 
                        })
                        .setColor("#490404")
                        .setDescription(`<a:unlemsel:1327600285597569066>・*Aktiflik testinde zaten varsın.*`)
                        .setTimestamp();
                    await i.reply({ embeds: [alreadyJoinedEmbed], ephemeral: true });
                    return;
                }
                katilanlar.push(i.user.id);
                const katilimEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: interaction.guild.name, 
                        iconURL: interaction.guild.iconURL({ dynamic: true }) 
                    })
                    .setColor("#490404")
                    .setDescription(`<a:onay:1327600261698420767>・*Başarılı bir şekilde aktiflik testine* **${katilanlar.length}.** *sıradan katıldınız.*`)
                    .setTimestamp();
                await i.reply({ embeds: [katilimEmbed], ephemeral: true });
            } else {
                if (!katilanlar.includes(i.user.id)) {
                    const notJoinedEmbed = new EmbedBuilder()
                        .setAuthor({ 
                            name: interaction.guild.name, 
                            iconURL: interaction.guild.iconURL({ dynamic: true }) 
                        })
                        .setColor("#490404")
                        .setDescription(`<a:unlemsel:1327600285597569066>・*Aktiflik testine katılmadın.*`)
                        .setTimestamp();
                    await i.reply({ embeds: [notJoinedEmbed], ephemeral: true });
                    return;
                }
                katilanlar = katilanlar.filter(id => id !== i.user.id);
                const ayrilimEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: interaction.guild.name, 
                        iconURL: interaction.guild.iconURL({ dynamic: true }) 
                    })
                    .setColor("#490404")
                    .setDescription(`<a:onay:1327600261698420767>・*Başarılı bir şekilde ayrıldınız.*`)
                    .setTimestamp();
                await i.reply({ embeds: [ayrilimEmbed], ephemeral: true });
            }
            const katilanEtiket = katilanlar.map(id => `<@${id}>`).join(', ') || 'Yok';
            const guncelEmbed = EmbedBuilder.from(embed)
                .setDescription(`*Rol:* ${rol.toString()}\n*Bitiş:* <t:${bitis}:F>\n*Sona Erme Tarihi:* <t:${bitis}:R>\n*Katılanlar:* ${katilanEtiket}`);
            await msg.edit({ embeds: [guncelEmbed], components: [row] });
        });
        collector.on('end', async () => {
            const guild = interaction.guild;
            const logChannel = guild.channels.cache.get(ayarlar.Kanallar.aktiflikBildirimKanalId);
            const roleMembers = rol.members.filter(m => !katilanlar.includes(m.id));
            const dmHatalilar = [];
            
            for (const member of roleMembers.values()) {
                await member.roles.remove(rol.id).catch(() => {});
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('<a:duyuru:1327600220879716396>・ Aktiflik Testi')
                        .setDescription('<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Aktiflik testine katılım göstermediğin için rolün çıkarıldı.*')
                        .setColor('#490404')
                        .setTimestamp();
                    await member.send({ embeds: [dmEmbed] });
                } catch (err) {
                    dmHatalilar.push(`<@${member.id}>`);
                }
            }
            
            if (ayarlar.Ayarlar.aktiflikEveryoneDuyuru) {
                const cekilenlerText = roleMembers.size > 0 ? `\n\n***Katılmayanlardan perm çekildi.***\n*Çekilenler:* ${roleMembers.map(m => `<@${m.id}>`).join(', ')}` : '';
                const dmHataliText = dmHatalilar.length > 0 ? `\n\n***DM Gönderilemeyenler:***\n*Dm gönderilmeyen ekip üyeleri:*${dmHatalilar.join(' ')}` : '';
                const aktiflikSonucEmbed = new EmbedBuilder()
                    .setTitle('<a:duyuru:1327600220879716396>・ Aktiflik Testi Sonuçlandı')
                    .setDescription(`*Aktiflik testi başarıyla sona erdi. Katılım sağlamayan üyelerin rolleri* **başarılı** *bir şekilde* **alınmıştır**.${cekilenlerText}${dmHataliText}`)
                    .addFields(
                        { name: '<a:onay:1327600261698420767>・\`ᴋᴀᴛıʟᴀɴ ᴇᴋɪᴘ ᴜ̈ʏᴇ ꜱᴀʏıꜱı:\`', value: `\`${katilanlar.length} ᴋɪꜱɪ\``, inline: true },
                        { name: '<a:red:1327600270032764928>・\`ᴋᴀᴛıʟᴍᴀʏᴀɴ ᴇᴋɪᴘ ᴜ̈ʏᴇ ꜱᴀʏıꜱı:\`', value: `\`${roleMembers.size} ᴋɪꜱɪ\``, inline: true },
                        { name: '\u200b', value: '\u200b', inline: false },
                        { name: '<a:onay:1327600261698420767>・\`ʙᴀꜱᴀʀıʟı ᴅᴍ ɢöɴᴅᴇʀɪᴍ ꜱᴀʏıꜱı:\`', value: `\`${roleMembers.size - dmHatalilar.length} ᴋɪꜱɪ\``, inline: true },
                        { name: '<a:red:1327600270032764928>・\`ʙᴀꜱᴀʀıꜱız ᴅᴍ ɢöɴᴅᴇʀɪᴍ ꜱᴀʏıꜱı:\`', value: `\`${dmHatalilar.length} ᴋɪꜱɪ\``, inline: true }
                    )
                    .setColor('#490404')
                    .setTimestamp()
                    .setFooter({ text: 'Ⓜ️ ᴅᴇᴠ ʙʏ ᴀʟꜱɪᴀ' });
                await guild.channels.cache.get(ayarlar.Kanallar.aktiflikBildirimKanalId).send({ embeds: [aktiflikSonucEmbed] });
            }
            
            const downloadEmbed = EmbedBuilder.from(embed)
                .setDescription(`*Rol:* ${rol.toString()}\n*Bitiş:* <t:${bitis}:F>\n*Katılanlar:* ${katilanlar.map(id => `<@${id}>`).join(', ') || 'Yok'}`)
                .setColor('#041f49');
            
            const downloadRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('katilim_indir')
                    .setLabel('・ᴋᴀᴛıʟıᴍ ʟɪꜱᴛᴇꜱɪɴɪ ɪɴᴅɪʀ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<a:duyuru:1327600220879716396>')
            );
            
            try {
                await interaction.editReply({ embeds: [downloadEmbed], components: [downloadRow] });
            } catch (error) {
                if (error.code === 50027) {
                    const channel = interaction.channel;
                    const fallbackEmbed = new EmbedBuilder()
                        .setTitle('<a:duyuru:1327600220879716396>・ Aktiflik Testi Tamamlandı')
                        .setDescription(`*Rol:* ${rol.toString()}\n*Bitiş:* <t:${bitis}:F>\n*Katılanlar:* ${katilanlar.map(id => `<@${id}>`).join(', ') || 'Yok'}`)
                        .setColor('#041f49')
                        .setFooter({ text: 'Token süresi dolduğu için yeni mesaj olarak gönderildi.' });
                    
                    await channel.send({ embeds: [fallbackEmbed], components: [downloadRow] });
                } else {
                    console.error('Aktiflik testi embed güncelleme hatası:', error);
                }
            }
            
            try {
                const downloadCollector = (await interaction.fetchReply()).createMessageComponentCollector({ filter: i => i.customId === 'katilim_indir', time: 600_000 });
                downloadCollector.on('collect', async i => {
                    const katilanlarTxt = `Katılanlar (ID):\n${katilanlar.map(id => `<@${id}>`).join('\n') || 'Yok'}\n\nKatılmayanlar (ID):\n${roleMembers.map(m => `<@${m.id}>`).join('\n') || 'Yok'}`;
                    const buffer = Buffer.from(katilanlarTxt, 'utf-8');
                    await i.reply({ files: [{ attachment: buffer, name: 'katilim_listesi.txt' }], ephemeral: true });
                });
            } catch (error) {
                console.error('Download collector oluşturulurken hata:', error);
                
            }
        });
    }
};
