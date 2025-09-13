const { EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const ayarlar = require("../../../ayarlar.json");
const db = require("../../../db");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Ot Sil')
        .setType(ApplicationCommandType.User),

    async execute(interaction) {
        const targetUser = interaction.targetUser;
        const targetMember = interaction.targetMember;

        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
            .setColor("#490404")
            .setTimestamp();

        const roles = [ayarlar.Yetkiler.yetkiliRolId];

        if (!interaction.member.roles.cache.find(r => roles.includes(r.id))) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], 
                ephemeral: true 
            });
        }

        if (!targetMember) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir oyuncu seçiniz.*")], 
                ephemeral: true 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`ot_sil_modal_${targetUser.id}`)
            .setTitle('Kullanıcıdan Ot Sil');

        const miktarInput = new TextInputBuilder()
            .setCustomId('ot_sil_miktar')
            .setLabel('Silinecek Ot Miktarı')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Miktar giriniz (örn: 50)')
            .setRequired(true)
            .setMaxLength(10);

        const actionRow = new ActionRowBuilder().addComponents(miktarInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};

async function executeOtSil(interaction, targetUser, miktar) {
    const otData = db.getOt(targetUser.id);

    if (otData.miktar < miktar) {
        const errorEmbed = new EmbedBuilder()
            .setColor("#490404")
            .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *ᴋᴜʟʟᴀɴıᴄının ʏᴇᴛᴇʀʟɪ ᴏᴛᴜ ʏᴏᴋ! ᴍᴇᴠᴄᴜᴛ ᴏᴛ: ${otData.miktar}*`);
        
        return interaction.editReply({ embeds: [errorEmbed] });
    }

    const yeniMiktar = db.addOt(targetUser.id, -miktar);

    const logChannel = interaction.guild.channels.cache.get(ayarlar.Kanallar.otLogKanalId);
    const logEmbed = new EmbedBuilder()
        .setTitle('<a:right:1327586133411889237> ᴏᴛ ꜱɪʟᴍᴇ ɪꜱʟᴇᴍɪ')
        .setColor('#0f1148')
        .addFields(
            { name: 'ɪꜱʟᴇᴍ', value: 'ᴏᴛ ꜱɪʟᴍᴇ', inline: true },
            { name: 'ʏᴇᴛᴋɪʟɪ', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'ᴋᴜʟʟᴀɴıcı', value: `<@${targetUser.id}>`, inline: true },
            { name: 'ꜱɪʟɪɴᴇɴ ᴍɪᴋᴛᴀʀ', value: `${miktar}`, inline: true },
            { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
            { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });

    const replyEmbed = new EmbedBuilder()
        .setTitle('<a:right:1327586133411889237> ᴏᴛ ꜱɪʟᴍᴇ ʙᴀꜱᴀʀıʟı')
        .setColor('#0f1148')
        .setDescription(`<@${targetUser.id}> ***ᴋᴜʟʟᴀɴıᴄıꜱıɴᴅᴀɴ ${miktar} ᴏᴛ ꜱɪʟɪɴᴅɪ.***`)
        .addFields(
            { name: 'ᴇꜱᴋɪ ᴍɪᴋᴛᴀʀ', value: `${otData.miktar}`, inline: true },
            { name: 'ʏᴇɴɪ ᴍɪᴋᴛᴀʀ', value: `${yeniMiktar}`, inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [replyEmbed] });
}

module.exports.executeOtSil = executeOtSil;
