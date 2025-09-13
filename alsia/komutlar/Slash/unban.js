const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Bir oyuncunun sunucudan yasağını kaldırırsınız.")
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID giriniz lütfen örnek: 278152550627409921')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('sebep')
        .setDescription('Sebep giriniz lütfen örnek: bla bla bla')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ID = interaction.options.getString('id');
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

    if (interaction.member.id == ID) {
      return interaction.reply({ 
        embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendin yasağınımı kaldırıcaksın :)*")], 
        ephemeral: true 
      });
    }

    const uyarı = new EmbedBuilder()
      .setColor("#4f0006")
      .setAuthor({ name: `${ayarlar.Embed.authorembed} - ʙᴀɴ ꜱᴏʀɢᴜʟᴀᴍᴀ`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setDescription(`\`${ID}\` *ID'li Kullanıcı:*\n» *Sunucudan Yasaklı Değil!*`);

    try {
      await interaction.guild.bans.fetch(ID);
    } catch (e) {
      await interaction.reply({ embeds: [uyarı] });
      return;
    }

    await interaction.guild.bans.fetch(ID).then(async ({ user, reason }) => {
      const embed = new EmbedBuilder()
        .setColor('#041f49')
        .setDescription(`<:bsanned:1327586232506515479> ・ <@${ID}> *isimli oyuncunun başarılı bir şekilde sunucudan yasaklanması* \`${sebep}\` *sebebi ile kaldırıldı.*
        
        <a:5961darkbluetea:1327585257578561548> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${interaction.member}`)
        .setAuthor({
          name: `${interaction.member.displayName}`, 
          iconURL: interaction.member.user.avatarURL({ dynamic: true })
        });

      await interaction.reply({ embeds: [embed] });

      const embedss = new EmbedBuilder()
        .setColor('#041f49')
        .setAuthor({
          name: `${ayarlar.Embed.authorembed} - ʏᴀꜱᴀᴋ ᴋᴀʟᴅıʀᴍᴀ`, 
          iconURL: interaction.member.user.avatarURL({ dynamic: true })
        })
        .setDescription(`<:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${interaction.member}
        <a:5961darkbluetea:1327585257578561548> ・ \`ᴏʏᴜɴᴄᴜ:\` <@${ID}>`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "**TARIH:**", value: `\`\`\`fix\n${moment(Date.now()).format("LLL")}\`\`\``, inline: false },
          { name: "**YASAK BILGI:**", value: `\`\`\`fix\n${reason || 'Sebep belirtilmemiş'}\`\`\``, inline: true }
        );


      if (ayarlar.LOG.unbanLOG) {
        try {
          const logChannel = guild.channels.cache.get(ayarlar.LOG.unbanLOG);
          if (logChannel) {
            await logChannel.send({ embeds: [embedss] });
          }
        } catch (error) {
          console.log("Log kanalına gönderilemedi:", error);
        }
      }

      try {
        await interaction.guild.members.unban(ID, { 
          reason: `Yetkili: ( ${interaction.member.user.username} )  |  Tarih: ( ${moment(Date.now()).format("LLL")} )` 
        });
      } catch (error) {
        console.log("Unban hatası:", error);
      }
    });
  }
};
