const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const CroxyDB = require('croxydb');
const ayarlar = require('../ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('etkinlik-oluştur')
        .setDescription('Etkinlik oluşturmak için komutu kullanın.')
        .addStringOption(option =>
            option.setName('etkinlik-ismi')
                .setDescription('Etkinliğin adını yazınız!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('katılacak-üye-sayısı')
                .setDescription('Etkinliğe kaç kişi katılacağını yazınız!')
                .setRequired(true)
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

        const etkinlikIsmi = interaction.options.getString('etkinlik-ismi');
        const katılacakKisiSayısı = parseInt(interaction.options.getString('katılacak-üye-sayısı'));

        if (!etkinlikIsmi || isNaN(katılacakKisiSayısı)) {
            return interaction.reply({ content: "Geçersiz etkinlik ismi veya üye sayısı!", ephemeral: true });
        }

        try {
            const aktifEtkinlik = CroxyDB.get('aktifEtkinlik');
            const uniqueEtkinlikIsmi = `${etkinlikIsmi}_${uuidv4()}`;

            const mevcutEtkinlik = CroxyDB.get('etkinlikler')?.find(etkinlik => etkinlik.etkinlikIsmi === uniqueEtkinlikIsmi);

            const etkinlik = {
                etkinlikIsmi: uniqueEtkinlikIsmi,
                katılacakKisiSayısı,
                id: interaction.id,
                oluşturulanKisi: interaction.user.id,
                katılanlar: [],
                tamamlandı: false
            };

            const etkinlikler = CroxyDB.get('etkinlikler') || [];
            etkinlikler.push(etkinlik);
            CroxyDB.set('etkinlikler', etkinlikler);

            CroxyDB.set('aktifEtkinlik', uniqueEtkinlikIsmi);

            await interaction.deferReply({ ephemeral: false });

            const embed = new EmbedBuilder()
                .setTitle(`ᴇᴛᴋɪɴʟɪᴋ: ${etkinlikIsmi}`)
                .setDescription(`ᴏʟᴜꜱ̧ᴛᴜʀᴀɴ: <@${interaction.user.id}>\nᴋᴀᴛıʟᴀɴ: 0/${katılacakKisiSayısı}`)
                .setColor(ayarlar.Renkler.primary)
                .setImage(ayarlar.Resimler.banner)
                .setFooter({ text: 'developed by alsianumberone' });

            const katılButonu = new ButtonBuilder()
                .setCustomId(`katil_${interaction.id}`)
                .setLabel(" ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                .setEmoji("<a:grsaqw:1233294278881443861>")
                .setStyle(ButtonStyle.Primary);

            const ayrılButonu = new ButtonBuilder()
                .setCustomId(`ayril_${interaction.id}`)
                .setLabel(" ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                .setEmoji("<a:cikisaw:1233284107304439889>")
                .setStyle(ButtonStyle.Danger);

            const sonlandırButonu = new ButtonBuilder()
                .setCustomId(`sonlandir_${interaction.id}`)
                .setLabel(" ꜱᴏɴʟᴀɴᴅıʀ")
                .setEmoji("<a:closex:1327586349963808769>")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

            await interaction.followUp({ embeds: [embed], components: [row] });

            console.log(`✅ Etkinlik oluşturuldu: ${etkinlikIsmi} (ID: ${interaction.id})`);

        } catch (error) {
            console.error('Error creating event:', error);
            interaction.reply({ content: "Bir hata oluştu, lütfen tekrar deneyin.", ephemeral: true });
        }
    }
};
