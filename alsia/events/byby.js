const { Events } = require("discord.js");
const ayarlar = require("../../ayarlar.json");
const canvafy = require("canvafy");
const moment = require("moment");
moment.locale("tr");

module.exports = {
    name: Events.GuildMemberRemove,
    başlat: async(member) => {
        let cihaz = "Çevrimdışı";
        const cihaz2 = member.presence?.clientStatus;
        
        if (cihaz2) {
            const platform = Object.keys(cihaz2)[0];
            if (platform === "desktop") cihaz = "Bilgisayar";
            else if (platform === "mobile") cihaz = "Telefon";
            else if (platform === "web") cihaz = "İnternet Sitesi";
        }

        const ByByLOG = member.guild.channels.cache.get(ayarlar.LOG.ByByLOG);
        if (!ByByLOG) return;

        try {
            const bybyCanvas = await new canvafy.WelcomeLeave()
                .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .setBackground("image", ayarlar.Resimler.welcomeURL)
                .setTitle(member.user.username)
                .setDescription(`Çıkış Tarihi: ${moment(Date.now()).format("LLL")}`)
                .setBorder("#000000")
                .setAvatarBorder("#ffffff")
                .setOverlayOpacity(0.3)
                .build();

            ByByLOG.send({
                content: `<a:devil:1327600214617362463> ・ *Sunucudan Çıkış Yaptı:* ${member}
<a:cute:1327586466498613279>・ *Platformu:* \`${cihaz}\`
<a:poofpinkheart:1327600266907750450>・ *Kalan Üye Sayısı:* \`${member.guild.memberCount}\``,
                files: [{
                    attachment: bybyCanvas,
                    name: `alsia-byby-${member.id}.png`
                }]
            });
        } catch (error) {
            console.error('ByBy Canvafy hatası:', error);
            ByByLOG.send({
                content: `<a:devil:1327600214617362463> ・ *Sunucudan Çıkış Yaptı:* ${member}
<a:cute:1327586466498613279>・ *Platformu:* \`${cihaz}\`
<a:poofpinkheart:1327600266907750450>・ *Kalan Üye Sayısı:* \`${member.guild.memberCount}\``
            });
        }
    }
}
