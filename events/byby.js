const { Collection, Events , EmbedBuilder,  AuditLogEvent} = require("discord.js")
const ayarlar = require("../ayarlar.json");
const ms = require("ms")
const cooldown = new Collection()
const canvafy = require("canvafy")

const moment = require("moment")
moment.locale("tr")
require("moment-duration-format");

module.exports = {
	name: Events.GuildMemberRemove,
	başlat: async(member) => {

        let cihaz;

        let cihaz2 = member.presence?.clientStatus
        if (cihaz2 == undefined) {
            cihaz = "Çevrimdışı"
        }
        if (cihaz2 != undefined) {
            if (Object.keys(member.presence?.clientStatus)[0] == "desktop") {
                cihaz = "Bilgisayar"
            }
            if (Object.keys(member.presence?.clientStatus)[0] == "mobile") {
                cihaz = "Telefon"
            }
            if (Object.keys(member.presence?.clientStatus)[0] == "web") {
                cihaz = "İnternet Sitesi"
            }
        }

        const welcomelog = await new canvafy.WelcomeLeave()
        .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
        .setBackground("image", ayarlar.Resimler.welcomeURL)
        .setTitle(member.user.username)
        .setDescription(`
Çıkış Tarihi: ${moment(Date.now()).format("LLL")}`)
        .setBorder("#ffffff")
        .setAvatarBorder("#ffffff")
        .setOverlayOpacity(0.5)
        .build();

        member.guild.channels.cache.get(ayarlar.LOG.ByByLOG).send({
            content: `<a:devil:1327600214617362463> ・ *Sunucudan Çıkış Yaptı:* ${member}`,
            files: [{
                attachment: welcomelog,
                name: `alsia-byby-${member.id}.png`
            }]
        });

        if(member.roles.cache.get(ayarlar.Permler.Yetkili)) {
            YetkiliDB.deleteOne({ Yetkili: member.user.id })
            HaftalıKayıtDB.deleteOne({ Yetkili: member.user.id })
        }

    }
}
