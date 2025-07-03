const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const ayarlar = require('../ayarlar.json');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ot-sil')
        .setDescription('Belirtilen ᴋᴜʟʟᴀɴıᴄıdan ot siler')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Ot silinecek ᴋᴜʟʟᴀɴıᴄı')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek ot miktarı')
                .setRequired(true)),

    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username , iconURL: interaction.member.user.avatarURL({dynamic: true})})
            .setColor("#490404")
            .setTimestamp()
            
        const roles = ayarlar.Yetkiler.Staff;
        
        if (!interaction.member.roles.cache.find(r => roles.includes(r.id))) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")] , ephemeral: false })

        const user = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');
        const otData = db.getOt(user.id);

        if (otData.miktar < miktar) {
            return interaction.reply({
                content: `ᴋᴜʟʟᴀɴıᴄının ʏᴇᴛᴇʀʟɪ ᴏᴛᴜ ʏᴏᴋ! ᴍᴇᴠᴄᴜᴛ ᴏᴛ: ${otData.miktar}`,
                ephemeral: true
            });
        }

        const yeniMiktar = db.addOt(user.id, -miktar);

        const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.logKanalId);
        const logEmbed = new EmbedBuilder()
            .setTitle('<a:right:1327586133411889237> ᴏᴛ ꜱɪʟᴍᴇ ɪ̇ꜱ̧ʟᴇᴍɪ')
            .setColor('#0f1148')
            .addFields(
                { name: 'ɪ̇ꜱ̧ʟᴇᴍ', value: 'ᴏᴛ ꜱɪʟᴍᴇ', inline: true },
                { name: 'ʏᴇᴛᴋɪʟɪ', value: `${interaction.user.tag}`, inline: true },
                { name: 'ʏᴇᴛᴋɪʟɪ ɪᴅ', value: `${interaction.user.id}`, inline: true },
                { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${user.id}>`, inline: true },
                { name: 'ᴋᴜʟʟᴀɴıᴄı ıᴅ', value: `${user.id}`, inline: true },
                { name: 'ꜱɪʟɪɴᴇɴ ᴍɪᴋᴛᴀʀ', value: `${miktar}`, inline: true },
                { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
                { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true }
            )
            .setTimestamp()

        await logChannel.send({ embeds: [logEmbed] });

        const replyEmbed = new EmbedBuilder()
            .setTitle('<a:right:1327586133411889237> ᴏᴛ ꜱɪʟᴍᴇ ʙᴀꜱ̧ᴀʀıʟı')
            .setColor('#0f1148')
            .setDescription(`${user.tag} ᴋᴜʟʟᴀɴıᴄısından ${miktar} ot silindi.`)
            .addFields(
                { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
                { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true }
            )
            .setTimestamp()

        await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
};
