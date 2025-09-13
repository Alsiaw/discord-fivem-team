const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ot')
        .setDescription('Ot talep sistemini açar'),

    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username , iconURL: interaction.member.user.avatarURL({dynamic: true})})
            .setColor("#490404")
            .setTimestamp()
            
        const roles = [ayarlar.Yetkiler.yetkiliRolId];
        
        if (!interaction.member.roles.cache.find(r => roles.includes(r.id))) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")] , ephemeral: false })

        const embed = new EmbedBuilder()
            .setTitle('<a:right:1327586133411889237> ᴏᴛ ᴛᴀʟᴇᴘ ꜱɪꜱᴛᴇᴍɪ')
            .setDescription('ᴏᴛ ᴛᴀʟᴇʙɪɴᴅᴇ ʙᴜʟᴜɴᴍᴀᴋ ɪᴄ̧ɪɴ ᴀꜱᴀɢ̆ıᴅᴀᴋɪ ʙᴜᴛᴏɴᴀ ᴛıᴋʟᴀʏıɴ.')
            .setColor('#0f1148')

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ot-ekle-talep')
                    .setLabel('ᴏᴛ ᴛᴀʟᴇᴘ ᴇᴛ')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
