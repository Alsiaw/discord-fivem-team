const { Collection, Events , EmbedBuilder,  AuditLogEvent} = require("discord.js")
const ayarlar = require("../ayarlar.json");
const ms = require("ms")
const cooldown = new Collection()

const canvafy = require("canvafy")
const moment = require("moment")
moment.locale("tr")
require("moment-duration-format");

const platformTracker = new Map();

module.exports = {
	name: Events.GuildMemberAdd,
	başlat: async(member) => {

        const welcomeLOG = member.guild.channels.cache.get(ayarlar.LOG.welcomeLOG);
        if (!welcomeLOG) return;

        if (ayarlar.Permler && ayarlar.Permler.Giriş) {
            await member.roles.add(ayarlar.Permler.Giriş).catch(() => {});
        }

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

        platformTracker.set(member.id, {
            platform: cihaz,
            joinTime: Date.now()
        });

        let welcome, welcomelog;
        try {
            welcome = await new canvafy.WelcomeLeave()
            .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
            .setBackground("color", "#2f3136")
            .setTitle(member.user.username)
            .setDescription(`
Sunucumuza Hoşgeldin!.`)
            .setBorder("#ffffff")
            .setAvatarBorder("#ffffff")
            .setOverlayOpacity(0.5)
            .build();

            welcomelog = await new canvafy.WelcomeLeave()
            .setAvatar(member.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
            .setBackground("color", "#2f3136")
            .setTitle(member.user.username)
            .setDescription(`
Giriş Tarihi: ${moment(Date.now()).format("LLL")}`)
            .setBorder("#ffffff")
            .setAvatarBorder("#ffffff")
            .setOverlayOpacity(0.5)
            .build();
        } catch (error) {
            console.error('Canvafy resim oluşturma hatası:', error);
            member.guild.channels.cache.get(ayarlar.LOG.welcomeLOG).send({
                content: `<a:devil:1327600214617362463> ・ *Sunucuya Giriş Yaptı:* ${member}
<a:poofpinkheart:1327600266907750450>・ *Seninle Birlikte:* \`${(member.guild.members.cache.filter(a => a.joinedTimestamp <= member.joinedTimestamp).size).toLocaleString()}/${(member.guild.memberCount).toLocaleString()}\``
            });
            return;
        }

        member.guild.channels.cache.get(ayarlar.LOG.welcomeLOG).send({
            content: `<a:devil:1327600214617362463> ・ *Sunucuya Giriş Yaptı:* ${member}
<a:cute:1327586466498613279>・ *Platformu:* \`${cihaz}\`
<a:poofpinkheart:1327600266907750450>・ *Seninle Birlikte:* \`${(member.guild.members.cache.filter(a => a.joinedTimestamp <= member.joinedTimestamp).size).toLocaleString()}/${(member.guild.memberCount).toLocaleString()}\``,
            files: [{
              attachment: welcomelog,
              name: `alsia-hoşgeldin-${member.id}.png`
            }]
        });

        await member.send({ files: [{ attachment: welcome , name: `alsia-hoşgeldin-${member.id}.png` }] }).catch(() => {});

        try {
            const user = member.user;
            const kurulus = new Date().getTime() - user.createdAt.getTime();

            const security = await new canvafy.Security()
            .setAvatar(member.user.displayAvatarURL({extension:"png",forceStatic:true}))
            .setBackground("image", ayarlar.Resimler.şüpheliURL)
            .setCreatedTimestamp(user.createdAt.getTime())
            .setSuspectTimestamp(1296000000) 
            .setBorder("#f0f0f0")
            .setLocale("tr") 
            .setAvatarBorder("#f0f0f0")
            .setOverlayOpacity(0.9)
            .build();

            if (ayarlar.LOG.şüpheliLOG) {
                member.guild.channels.cache.get(ayarlar.LOG.şüpheliLOG).send({
                    content: `<a:poofpinkheart:1327600266907750450>・${member}`,
                    files: [{
                      attachment: security,
                      name: `alsia-security-${member.id}.png`
                    }]
                });
            }
        } catch (error) {
            console.error('Güvenlik kontrolü resim hatası:', error);
        }

        try {
        } catch (error) {
            console.error('Günlük DB güncelleme hatası:', error);
        }

    }
}

module.exports.platformTracker = platformTracker;
