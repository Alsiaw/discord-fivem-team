const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const CroxyDB = require('croxydb');
const ayarlar = require('../../../ayarlar.json');
const canvafy = require('canvafy');

async function createEtkinlikCard(user, etkinlikIsmi, katılanSayısı, toplamSayı, durum = 'Sınırsız') {
    try {
        const card = await new canvafy.WelcomeLeave()
            .setAvatar(user.displayAvatarURL({ forceStatic: true, extension: "png" }))
            .setBackground("image", ayarlar.Resimler.EtkinlikResimURL)
            .setTitle(etkinlikIsmi)
            .setDescription(`Katılım Sınırı: ${toplamSayı}\nKatılım: ${katılanSayısı}`)
            .setBorder("#000000")
            .setAvatarBorder("#ffffff")
            .setOverlayOpacity(0.3)
            .build();
        
        return card;
    } catch (error) {
        console.error('Canvas oluşturma hatası:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('etkinlik-kur')
        .setDescription('Etkinlik Kurmanıza İçe Yarar')
        .addStringOption(option =>
            option.setName('başlık')
                .setDescription('Etkinlik Adı Giriniz.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sayı')
                .setDescription('Sayı giriniz.')
                .setRequired(true)
        ),
    createEtkinlikCard,
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

        const etkinlikIsmi = interaction.options.getString('başlık');
        const katılacakKisiSayısı = parseInt(interaction.options.getString('sayı'));

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

            const canvas = await createEtkinlikCard(interaction.user, etkinlikIsmi, 0, katılacakKisiSayısı, 'Sınırsız');
            
            if (!canvas) {
                return interaction.editReply({ content: "Canvas oluşturulamadı, lütfen tekrar deneyin!" });
            }

            const katılButonu = new ButtonBuilder()
                .setCustomId(`katil_${interaction.id}`)
                .setLabel("・ᴇᴛᴋıɴʟıɢᴇ ᴋᴀᴛıʟ")
                .setEmoji("<a:grsaqw:1233294278881443861>")
                .setStyle(ButtonStyle.Primary);

            const ayrılButonu = new ButtonBuilder()
                .setCustomId(`ayril_${interaction.id}`)
                .setLabel("・ᴇᴛᴋıɴʟıɢᴛᴇɴ ᴀʏʀıʟ")
                .setEmoji("<a:cikisaw:1233284107304439889>")
                .setStyle(ButtonStyle.Danger);

            const sonlandırButonu = new ButtonBuilder()
                .setCustomId(`sonlandir_${interaction.id}`)
                .setLabel("・ꜱᴏɴʟᴀɴᴅıʀ")
                .setEmoji("<a:closex:1327586349963808769>")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(katılButonu, ayrılButonu, sonlandırButonu);

            await interaction.followUp({ 
                files: [{ 
                    attachment: canvas, 
                    name: `etkinlik-${interaction.id}.png` 
                }], 
                components: [row] 
            });


        } catch (error) {
            console.error('Error creating event:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: "Bir hata oluştu, lütfen tekrar deneyin." });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: "Bir hata oluştu, lütfen tekrar deneyin.", ephemeral: true });
                }
            } catch (replyError) {
                console.error('Error replying to interaction:', replyError);
            }
        }
    }
};
