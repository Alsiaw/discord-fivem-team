const { Events } = require("discord.js");
const ayarlar = require("../../ayarlar.json");
const canvafy = require("canvafy");
const moment = require("moment");
moment.locale("tr");

const platformTracker = new Map();

module.exports = {
    name: Events.GuildMemberAdd,
    başlat: async(member) => {
        const welcomeLOG = member.guild.channels.cache.get(ayarlar.LOG.welcomeLOG);
        if (!welcomeLOG) return;

        if (ayarlar.Permler && ayarlar.Permler.Giriş) {
            await member.roles.add(ayarlar.Permler.Giriş).catch(() => {});
        }

        let cihaz = "Çevrimdışı";
        const cihaz2 = member.presence?.clientStatus;
        
        if (cihaz2) {
            const platform = Object.keys(cihaz2)[0];
            if (platform === "desktop") cihaz = "Bilgisayar";
            else if (platform === "mobile") cihaz = "Telefon";
            else if (platform === "web") cihaz = "İnternet Sitesi";
        }

        platformTracker.set(member.id, {
            platform: cihaz,
            joinTime: Date.now()
        });

        try {
            const welcome = await new canvafy.WelcomeLeave()
                .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .setBackground("image", ayarlar.Resimler.welcomeURL)
                .setTitle(member.user.username)
                .setDescription("Sunucumuza Hoşgeldin!")
                .setBorder("#ffffff")
                .setAvatarBorder("#ffffff")
                .setOverlayOpacity(0.5)
                .build();

            const welcomelog = await new canvafy.WelcomeLeave()
                .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .setBackground("image", ayarlar.Resimler.welcomeURL)
                .setTitle(member.user.username)
                .setDescription(`Giriş Tarihi: ${moment(Date.now()).format("LLL")}`)
                .setBorder("#000000")
                .setAvatarBorder("#ffffff")
                .setOverlayOpacity(0.3)
                .build();

         
            welcomeLOG.send({
                content: `<a:devil:1327600214617362463> ・ *Sunucuya Giriş Yaptı:* ${member}
<a:cute:1327586466498613279>・ *Platformu:* \`${cihaz}\`
<a:poofpinkheart:1327600266907750450>・ *Seninle Birlikte:* \`${member.guild.members.cache.filter(a => a.joinedTimestamp <= member.joinedTimestamp).size.toLocaleString()}/${member.guild.memberCount.toLocaleString()}\``,
                files: [{
                    attachment: welcomelog,
                    name: `alsia-hoşgeldin-${member.id}.png`
                }]
            });

            await member.send({ 
                files: [{ 
                    attachment: welcome, 
                    name: `alsia-hoşgeldin-${member.id}.png` 
                }] 
            }).catch(() => {});

        } catch (error) {
            console.error('Canvafy resim oluşturma hatası:', error);
            welcomeLOG.send({
                content: `<a:devil:1327600214617362463> ・ *Sunucuya Giriş Yaptı:* ${member}
<a:poofpinkheart:1327600266907750450>・ *Seninle Birlikte:* \`${member.guild.members.cache.filter(a => a.joinedTimestamp <= member.joinedTimestamp).size.toLocaleString()}/${member.guild.memberCount.toLocaleString()}\``
            });
        }
    }
}

module.exports.platformTracker = platformTracker;
