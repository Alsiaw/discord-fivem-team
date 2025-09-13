const { EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Yasakla')
        .setType(ApplicationCommandType.User),

    async execute(interaction) {
        const targetUser = interaction.targetUser;
        const targetMember = interaction.targetMember;
        const guild = interaction.guild;

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

        if (interaction.member.id === targetMember.id) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinemi Ceza Vericeksin.*")], 
                ephemeral: true 
            });
        }

        if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinden yüksek kişilere ceza veremessin.*")], 
                ephemeral: true
            });
        }

        if (!targetMember.manageable) {
            return interaction.reply({ 
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Botun yetkisi yetmemektedir.*")], 
                ephemeral: true 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`ban_modal_${targetUser.id}`)
            .setTitle('Kullanıcıyı Yasakla');

        const sebepInput = new TextInputBuilder()
            .setCustomId('ban_sebep')
            .setLabel('Yasaklama Sebebi')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Yasaklama sebebini giriniz...')
            .setRequired(true)
            .setMaxLength(500);

        const actionRow = new ActionRowBuilder().addComponents(sebepInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};

async function executeBan(interaction, targetMember, sebep) {
    const guild = interaction.guild;
    const banId = Math.floor(Math.random() * 10000);

    const embed = new EmbedBuilder()
        .setColor('#041f49')
        .setFooter({ text: moment(Date.now()).format("LLL") })
        .setDescription(`<:bsanned:1327586232506515479> ・ ${targetMember} *isimli oyuncu sunucudan başarılı bir şekilde* \`${sebep}\` *sebebi ile yasaklandı.*
        
        <:bugsal:1327586234876301332> ・ \`ʏᴇᴛᴋıʟı:\` ${interaction.member}
        <a:5961darkbluetea:1327585257578561548> ・ \`ᴄᴇᴢᴀ ıᴅ: #${banId}\``)
        .setAuthor({
            name: `${interaction.member.displayName}`, 
            iconURL: interaction.member.user.avatarURL({ dynamic: true })
        });

    await interaction.editReply({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
        .setColor('#041f49')
        .setAuthor({
            name: `${ayarlar.Embed.authorembed} - ʏᴀꜱᴀᴋʟᴀᴍᴀ`, 
            iconURL: guild.iconURL({ dynamic: true })
        })
        .setDescription(`<:8676gasp:1327585524231176192> ・ \`ʏᴇᴛᴋıʟı:\` ${interaction.member}
        <a:5961darkbluetea:1327585257578561548> ・ \`ᴏʏᴜɴᴄᴜ:\` ${targetMember}`)
        .setFooter({ text: `Ⓜ️ CezaID: #${banId} ・ ${moment(Date.now()).format("LLL")}` })
        .setThumbnail(targetMember.user.avatarURL({ dynamic: true }))
        .addFields(
            { name: "**SEBEP:**", value: `\`\`\`fix\n» ${sebep}\`\`\``, inline: true }
        );

    const banMesaj = new EmbedBuilder()
        .setAuthor({
            name: `${ayarlar.Embed.SunucuAD} - SUNUCUDAN YASAKLANDINIZ!`, 
            iconURL: guild.iconURL({ dynamic: true })
        })
        .setDescription(`<:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${interaction.member} 
        <a:5961darkbluetea:1327585257578561548> ・ \`ꜱᴇʙᴇᴘ: ${sebep}\`
        <a:tehlikesel:1327600281029967953> ・ \`ᴄᴇᴢᴀ ıᴅ: #${banId}\` 
        <a:utility:1327600287367696515> ・ \`ᴛᴀʀɪʜ: ${moment(Date.now()).format("LLL")}\`
        
        \`🌐 ${ayarlar.Embed.authorembed} ・ ${moment(Date.now()).format("LLL")}\``)
        .setColor('#200527')
        .setThumbnail(guild.iconURL({ dynamic: true }));

    try {
        await targetMember.send({ embeds: [banMesaj] });
    } catch (error) {
        console.log("DM gönderilemedi:", error);
    }

    try {
        await guild.members.ban(targetMember, { 
            reason: `» Yetkili: ${interaction.member.user.username} \n » Sebep: ${sebep} \n » Tarih: ${moment(Date.now()).format("LLL")} \n » CezaID: #${banId}` 
        });
    } catch (error) {
        console.log("Ban hatası:", error);
    }

    if (ayarlar.LOG.banLOG) {
        try {
            const logChannel = guild.channels.cache.get(ayarlar.LOG.banLOG);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.log("Log kanalına gönderilemedi:", error);
        }
    }
}

module.exports.executeBan = executeBan;
