const { Events, EmbedBuilder } = require("discord.js");
const ayarlar = require("../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
    name: Events.MessageUpdate,
    başlat: async(oldMessage, newMessage) => {
        if (!oldMessage.author || oldMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const MesajLOG = oldMessage.guild.channels.cache.get(ayarlar.LOG.mesajLOG);
        if (!MesajLOG) return;

        const Embed = new EmbedBuilder()
            .setColor('#051b50')
            .setThumbnail(oldMessage.author.avatarURL({dynamic: true}))
            .setAuthor({
                name: `${oldMessage.author.username} - MESAJ GUNCELLENDI`,
                iconURL: oldMessage.author.avatarURL({dynamic: true})
            })
            .setFooter({ text: moment(Date.now()).format("LLL") })
            .setDescription(`<:claim:1327586348244140082> ・ *Bir kullanıcı* | \`${oldMessage.channel.name}\` | *isimli kanalda kendi* *mesajını güncelledi!* \n \n <a:5961darkbluetea:1327585257578561548> ・ \`ᴍᴇꜱᴀᴊ ꜱᴀʜıʙı:\` | ${oldMessage.author} | \n \n ***Eski Mesaj:*** \n \`\`\`diff\n- ${oldMessage.content.slice(0, 500)}\`\`\` \n \n ***Yeni Mesaj:*** \n \`\`\`diff\n+ ${newMessage.content.slice(0, 500)}\`\`\``);

        MesajLOG.send({ embeds: [Embed] }).catch(() => {});
    }
}
