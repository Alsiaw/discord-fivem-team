const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const ayarlar = require('../ayarlar.json');

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
            option.setName('rol').setDescription('Hedef rol').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sure').setDescription('Süre: 10s, 5m, 2h, 1d').setRequired(true)
        ),
    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username , iconURL: interaction.member.user.avatarURL({dynamic: true})})
            .setColor("#490404")
            .setTimestamp()
            
        // Yetki kontrolü
        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkili)) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], 
                ephemeral: true 
            });
        }

        const rol = interaction.options.getRole('rol');
        const sureStr = interaction.options.getString('sure');
        const sure = parseSure(sureStr);
        if (!sure) return interaction.reply({ content: 'Geçersiz süre formatı! (örn: 10s, 5m, 2h, 1d)', ephemeral: true });
        const bitis = Math.floor((Date.now() + sure * 1000) / 1000);
        let katilanlar = [];
        const embed = new EmbedBuilder()
            .setTitle('Aktiflik Katılım')
            .setDescription(`*Katılım süresi:* <t:${bitis}:R>\n*Katılanlar:*`)
            .addFields({ name: '*Rol*', value: rol.toString(), inline: true }, { name: '*Bitiş*', value: `<t:${bitis}:F>`, inline: true })
            .setColor('#041f49');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('katil').setLabel('ᴀᴋᴛɪꜰʟɪɢ̆ᴇ ᴋᴀᴛıʟ').setStyle(ButtonStyle.Primary).setEmoji('<a:onay:1327600261698420767>'),
            new ButtonBuilder().setCustomId('ayril').setLabel('ᴀᴋᴛɪꜰʟɪᴋᴛᴇɴ ᴀʏʀıʟ').setStyle(ButtonStyle.Danger).setEmoji('<a:red:1327600270032764928>')
        );
        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const filter = i => ['katil', 'ayril'].includes(i.customId);
        const collector = msg.createMessageComponentCollector({ filter, time: sure * 1000 });
        collector.on('collect', async i => {
            if (i.customId === 'katil') {
                if (!katilanlar.includes(i.user.id)) katilanlar.push(i.user.id);
            } else {
                katilanlar = katilanlar.filter(id => id !== i.user.id);
            }
            const katilanEtiket = katilanlar.map(id => `<@${id}>`).join(', ') || 'Yok';
            const guncelEmbed = EmbedBuilder.from(embed)
                .setDescription(`*Katılım süresi:* <t:${bitis}:R>\n*Katılanlar:* ${katilanEtiket}`)
                .addFields({ name: '*Rol*', value: rol.toString(), inline: true }, { name: '*Bitiş*', value: `<t:${bitis}:F>`, inline: true });
            await msg.edit({ embeds: [guncelEmbed], components: [row] });
            await i.deferUpdate();
        });
        collector.on('end', async () => {
            const guild = interaction.guild;
            const logChannel = guild.channels.cache.get(ayarlar.Kanallar.logKanalId);
            const roleMembers = rol.members.filter(m => !katilanlar.includes(m.id));
            const dmHatalilar = [];
            for (const member of roleMembers.values()) {
                await member.roles.remove(ayarlar.Yetkiler.aktiflikCekilecekPerm).catch(() => {});
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('Aktiflik Katılım Sonucu')
                        .setDescription('Aktifliğe katılmadığın için ekipten atıldın.')
                        .setColor('#490404')
                        .setTimestamp();
                    await member.send({ embeds: [dmEmbed] });
                } catch (err) {
                    dmHatalilar.push(`<@${member.id}>`);
                }
            }
            if (dmHatalilar.length > 0 && logChannel) {
                const hataEmbed = new EmbedBuilder()
                    .setTitle('DM Gönderilemeyenler')
                    .setDescription(`Aşağıdaki üyelere DM gönderilemedi (DM kapalı veya hata):\n${dmHatalilar.join(', ')}`)
                    .setColor('#490404')
                    .setTimestamp();
                await logChannel.send({ embeds: [hataEmbed] });
            }
            const logEmbed = new EmbedBuilder()
                .setTitle('Aktiflik Sonuç')
                .setDescription(`*Katılmayanlardan perm çekildi.*\n*Çekilenler:* ${roleMembers.map(m => `<@${m.id}>`).join(', ') || 'Yok'}`)
                .setColor('#490404');
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });
            if (ayarlar.Ayarlar.aktiflikEveryoneDuyuru) await guild.channels.cache.get(ayarlar.Kanallar.aktiflikBildirimKanalId).send({ content: '@everyone *Aktiflik sistemi bitti, katılmayanların permi çekildi.*' });
            const finalEmbed = EmbedBuilder.from(embed)
                .setDescription(`*Aktiflik bitti.*\n*Katılanlar:* ${katilanlar.map(id => `<@${id}>`).join(', ') || 'Yok'}`)
                .addFields({ name: 'Rol', value: rol.toString(), inline: true }, { name: 'Bitiş', value: `<t:${bitis}:F>`, inline: true })
                .setColor('#00ff00');
            const downloadRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('katilim_indir')
                    .setLabel('ᴋᴀᴛıʟıᴍ ʟɪꜱᴛᴇꜱɪɴɪ ɪɴᴅɪʀ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<a:duyuru:1327600220879716396>')
            );
            await interaction.editReply({ embeds: [finalEmbed.setColor('#041f49')], components: [downloadRow] });
            const downloadCollector = (await interaction.fetchReply()).createMessageComponentCollector({ filter: i => i.customId === 'katilim_indir', time: 600_000 });
            downloadCollector.on('collect', async i => {
                const katilanlarTxt = `Katılanlar (ID):\n${katilanlar.map(id => `<@${id}>`).join('\n') || 'Yok'}\n\nKatılmayanlar (ID):\n${roleMembers.map(m => `<@${m.id}>`).join('\n') || 'Yok'}`;
                const buffer = Buffer.from(katilanlarTxt, 'utf-8');
                await i.reply({ files: [{ attachment: buffer, name: 'katilim_listesi.txt' }], ephemeral: true });
            });
        });
    }
};
