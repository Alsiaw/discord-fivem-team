const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir oyuncuyu sunucudan yasaklarsınız!")
    .addUserOption(option =>
      option
        .setName('oyuncu')
        .setDescription('Oyuncu giriniz lütfen örnek: @alsia')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('sebep')
        .setDescription('Sebep giriniz.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getMember('oyuncu');
    const sebep = interaction.options.getString('sebep');
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

    if (!member) {
      return interaction.reply({ 
        embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir oyuncu seçiniz.*")], 
        ephemeral: true 
      });
    }

    if (interaction.member.id == member.id) {
      return interaction.reply({ 
        embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinemi Ceza Vericeksin.*")], 
        ephemeral: true 
      });
    }

    if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinden yüksek kişilere ceza veremessin.*")], 
        ephemeral: true
      });
    }

    if (!member.manageable) {
      return interaction.reply({ 
        embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Botun yetkisi yetmemektedir.*")], 
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    const banId = Math.floor(Math.random() * 10000);

    const embed = new EmbedBuilder()
      .setColor('#041f49')
      .setFooter({ text: moment(Date.now()).format("LLL") })
      .setDescription(`<:bsanned:1327586232506515479> ・ ${member} *isimli oyuncu sunucudan başarılı bir şekilde* \`${sebep}\` *sebebi ile yasaklandı.*
      
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
      <a:5961darkbluetea:1327585257578561548> ・ \`ᴏʏᴜɴᴄᴜ:\` ${member}`)
      .setFooter({ text: `Ⓜ️ CezaID: #${banId} ・ ${moment(Date.now()).format("LLL")}` })
      .setThumbnail(member.user.avatarURL({ dynamic: true }))
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
      await member.send({ embeds: [banMesaj] });
    } catch (error) {
      console.log("DM gönderilemedi:", error);
    }

    try {
      await guild.members.ban(member, { 
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
};
