const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('envanter')
        .setDescription('Ot envanterinizi gösterir'),

    async execute(interaction) {
        const otData = db.getOt(interaction.user.id);

        if (!otData || otData.miktar === 0) {
            return interaction.reply({
                content: `${interaction.user.tag} ᴋᴜʟʟᴀɴıᴄısının ᴏᴛ ᴇɴᴠᴀɴᴛᴇʀɪ ᴇᴋsɪᴋ.`, 
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('<a:right:1327586133411889237> ᴏᴛ ᴇɴᴠᴀɴᴛᴇʀɪ')
            .setDescription(` ɪꜱᴛᴇ ᴏᴛ ᴇɴᴠᴀɴᴛᴇʀɪɴɪᴢ`) 
            .addFields({ name: 'ᴏᴛ ᴍɪᴋᴛᴀʀı', value: `${otData.miktar}`, inline: true })
            .setColor('#0f1148')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: false
        });
    }
};
