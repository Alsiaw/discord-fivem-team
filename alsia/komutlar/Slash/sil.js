const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sil")
    .setDescription("Toplu Ve Hızlı Bir Şekilde Mesajları Silmeye İşe Yarar.")
    .addIntegerOption(option =>
        option.setName('miktar')
          .setDescription('Silinicek Mesaj Miktarını Giriniz: 100')
          .setRequired(true)
    ),

  alsia: async (client, interaction) => {
    const clear = interaction.options.getInteger('miktar');
    const guild = interaction.guild;
    const channel = interaction.channel;

    const Warn = new EmbedBuilder()
      .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({dynamic: true}) })
      .setColor("#490404")
      .setTimestamp();

    const roles = [ayarlar.Yetkiler.yetkiliRolId];

    if (!interaction.member.roles.cache.find(r => roles.includes(r.id))) 
      return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")] , ephemeral: true });
    if (!channel.manageable) 
      return interaction.reply({ embeds: [Warn.setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Botun yetkisi yetmemektedir.*`)] , ephemeral: true });

    if (clear > 100) 
      return interaction.reply({ content: "100 Mesajdan Fazlasını Silemezsin.", ephemeral: true });

    const id = Math.floor(Math.random() * 9999999999) + 10000000000;

    const embed = new EmbedBuilder()
      .setDescription(`<a:utility:1327600287367696515> ・ *Başarılı Bir Şekilde* \`${clear}\` *Adet Mesajı Sildin.*`)
      .setAuthor({
        name:`${interaction.member.user.username}`, 
        iconURL: interaction.member.user.avatarURL({dynamic: true})
      })
      .setFooter({ text: moment(Date.now()).format("LLL") })
      .setColor('#09437a');
    await interaction.reply({embeds: [embed]}).catch(() => {});

    let messageData = '';
    const fetchedMessages = await channel.messages.fetch({ limit: clear });

    fetchedMessages.forEach(msg => {
      let content = msg.content?.trim() || "❗ İçerik bulunamadı (muhtemelen embedli/bot mesajı)";
      
      if (msg.attachments.size > 0) {
        msg.attachments.forEach(att => {
          content += `\n📎 Ek: ${att.url}`;
        });
      }

      messageData += `🗑 Mesaj ID: ${msg.id}\n👤 Gönderen: ${msg.author.tag} (${msg.author.id})\n💬 İçerik: ${content}\n\n`;
    });

    const LogEmbeds = new EmbedBuilder()
      .setDescription(`<a:utility:1327600287367696515> ・ \`Yetkili:  ${interaction.member.displayName} | ${interaction.member.id}\`
        <a:tehlikesel:1327600281029967953> ・ \`ᴛᴀʀɪʜ:  ${moment(Date.now()).format("LLL")}\``)
      .setAuthor({
        name:`Mesaj Silme İşlemi`, 
        iconURL: interaction.guild.iconURL({dynamic: true})
      })
      .setColor('#0e2694')
      .setThumbnail(interaction.member.user.avatarURL({dynamic: true}));

    const logChannel = client.channels.cache.get(ayarlar.LOG.KomutLOG.SilmeLOG);
    const buffer = Buffer.from(messageData, "utf-8");
    const attachment = new AttachmentBuilder(buffer, { name: `silinen-mesajlar_${id}.txt` });

    if (logChannel) {
      await logChannel.send({
        content: `Silinen mesajların verileri:`,
        embeds: [LogEmbeds],
        files: [attachment]
      });
    }

    await channel.bulkDelete(clear).catch(() => {});
  }
};
