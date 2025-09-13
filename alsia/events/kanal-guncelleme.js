const { Collection, Events , EmbedBuilder,  AuditLogEvent} = require("discord.js")
const ayarlar = require("../../ayarlar.json");
const ms = require("ms")
const cooldown = new Collection()

const moment = require("moment")
moment.locale("tr")
require("moment-duration-format");

module.exports = {
	name: Events.ChannelUpdate,
	başlat: async(oldChannel , newChannel) => {

        const fetchedLogs = await oldChannel.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.ChannelUpdate,
        });
      
        const kanalLOG = oldChannel.guild.channels.cache.get(ayarlar.LOG.KanalGuncellemeLOG);
        if (!kanalLOG) return;
      
        const kanallog = fetchedLogs.entries.first();
        if (!kanallog) return;
      
        const { executor, target } = kanallog;
      
        if (oldChannel.name !== newChannel.name) {
      
            const İsimGüncelleme = new EmbedBuilder()
            .setAuthor({
               name: executor.username,
              iconURL: executor.avatarURL({ dynamic: true })
            })
            .setThumbnail(executor.avatarURL({dynamic:true})) 
            .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili tarafından* | \`${oldChannel.name} | ${oldChannel.id}\` | *isimli kanalın ismi güncellendi.* 
           
           <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${executor}
           <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴀɴᴀʟ:\` ${oldChannel}
      
            ***Eski İsim:*** \n \`\`\`diff\n- ${oldChannel.name}\n\`\`\` \n ***Yeni İsim:*** \n   \`\`\`fix\n+ ${newChannel.name}\n\`\`\``)
            .setColor("#12073d")
            .setFooter({ text: moment(Date.now()).format("LLL") })
      
            oldChannel.guild.channels.cache.get(ayarlar.LOG.KanalGuncellemeLOG).send({ embeds: [İsimGüncelleme] })
        }
      
        if (oldChannel.parent !== newChannel.parent) {
      
            const KategoriGüncelleme = new EmbedBuilder()
            .setAuthor({
               name: executor.username,
              iconURL: executor.avatarURL({ dynamic: true })
            })
            .setThumbnail(executor.avatarURL({dynamic:true})) 
            .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili tarafından* | \`${oldChannel.name} | ${oldChannel.id}\` | *isimli kanalın kategorisi güncellendi.* 
             
             <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${executor}
             <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴀɴᴀʟ:\` ${oldChannel}
      
              ***Eski Kategorisi:*** \n \`\`\`diff\n- ${oldChannel.parent ? oldChannel.parent.name : 'Kategori Yok'}\n\`\`\` \n ***Yeni Kategorisi:*** \n   \`\`\`fix\n+ ${newChannel.parent ? newChannel.parent.name : 'Kategori Yok'}\n\`\`\``)
              .setColor("#12073d")
              .setFooter({ text: moment(Date.now()).format("LLL") })
      
            oldChannel.guild.channels.cache.get(ayarlar.LOG.KanalGuncellemeLOG).send({ embeds: [KategoriGüncelleme] })
        }
      
        let perms = {
            SendVoiceMessages: "Sesli Mesaj Gönderme",
            SendMessagesInThreads: "Foruma Mesaj Gönderme",
            UseExternalStickers: "Sunucu Dışı Sticker",
            CreateInstantInvite: "Özel Davet Linki",
            AddReactions: "Mesajlara Emoji Ekleme",
            ViewChannel: "Kanalı Görüntüleme",
            SendMessages: "Mesaj Gönderme",
            ManageMessages: "Mesajları Yönetme",
            EmbedLinks: "Bağlantı Yerleştirme",
            AttachFiles: "Dosya Yerleştirme",
            ReadMessageHistory: "Mesaj Geçmişini Görüntüleme",
            MentionEveryone: "Everyone Kullanabilme",
            ManageRoles: "Rolleri Yönetme",
            ManageChannels: "Kanalı Yönetme",
            ManageWebhooks: "Webhook Yönetme",
            UseApplicationCommands: "Slash Komutlarını Kullanma",
            PrioritySpeaker: "Öncelikli Konuşmacı",
            Stream: "Ekran Açma",
            Video: "Kamera Açma",
            Connect: "Sese Bağlanabilme",
            Speak: "Seste Konuşabilme",
            MuteMembers: "Kullanıcı Susturabilme",
            DeafenMembers: "Kullanıcı Sağırlaştırma",
            MoveMembers: "Kullanıcı Yer Değiştirme",
            UseSoundboard: "Soundboard Kullanabilme",
            UseExternalSounds: "Sunucu Dışı Soundboard",
            ManageEvents: "Etkinlik Yönetme",
            UseEmbeddedActivities: "Embed Aktivite Etme",
            UseVAD: "Vad Kullanma",
            SendTTSMessages: "Alt Başlık Gönderme",
            UseExternalEmojis: "Sunucu Dışı Emoji"
        };
      
        const oldPermissions = oldChannel.permissionOverwrites.cache
        const newPermissions = newChannel.permissionOverwrites.cache
      
        oldPermissions.map( ow => {
      
            const newOw = newPermissions.find( n => n.id == ow.id)
            if(!newOw || !newOw.deny.equals(ow.deny) || !newOw.allow.equals(ow.allow)){
      
                if(newOw && ow.allow.missing(newOw.allow).length > 0){
                    const permissionGiven = ow.allow.missing(newOw.allow)
      
                    let embed = new EmbedBuilder()
                    .setAuthor({
                      name: `${executor.username} - YETKİ VERILDI`,
                      iconURL: executor.avatarURL({ dynamic: true })
                    })
                    .setThumbnail(executor.avatarURL({dynamic:true})) 
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili tarafından* | \`${oldChannel.name} | ${oldChannel.id}\` | *isimli kanalın izinlerini güncelledi.*
                    
                    <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${executor}
                    <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴀɴᴀʟ:\` ${oldChannel}
            
                    <a:utility:1327600287367696515> ・ \`ɢᴜɴᴄᴇʟʟᴇɴᴇɴ ʀᴏʟ:\`<@&${newOw.id}>
                    
                     ***Eklenen İzinler:*** \n\`\`\`diff\n${
                      permissionGiven.map((perm) => `+ ${perms[perm] || perm}`).join("\n") ||
                     `Hiçbir izin eklenmemiş!`
                   }\n\`\`\`  `)
                   .setColor("#12073d")
                   .setFooter({ text: moment(Date.now()).format("LLL") })
            
                    oldChannel.guild.channels.cache.get(ayarlar.LOG.KanalGuncellemeLOG).send({ embeds: [embed] }).catch(() => {});
                }
      
                if(newOw && ow.deny.missing(newOw.deny).length > 0){
                    const permissionBanSet = ow.deny.missing(newOw.deny)
      
                    let embed = new EmbedBuilder()
                    .setAuthor({
                      name: `${executor.username} - YETKI YASAKLANDI`,
                      iconURL: executor.avatarURL({ dynamic: true })
                    })
                    .setThumbnail(executor.avatarURL({dynamic:true})) 
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili tarafından* | \`${oldChannel.name} | ${oldChannel.id}\` | *isimli kanalın izinlerini güncelledi.* 
                    
                    <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${executor}
                    <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴀɴᴀʟ:\` ${oldChannel}
            
                    <a:utility:1327600287367696515> ・ \`ɢᴜɴᴄᴇʟʟᴇɴᴇɴ ʀᴏʟ:\` <@&${newOw.id}>
            
                    ***Yasaklanan İzinler;*** \n\`\`\`diff\n${
                      permissionBanSet.map((perm) => `- ${perms[perm] || perm}`).join("\n") ||
                     `Hiçbir izin eklenmemiş!`
                   }\n\`\`\`  `)
                   .setColor("#12073d")
                   .setFooter({ text: moment(Date.now()).format("LLL") })
            
                    oldChannel.guild.channels.cache.get(ayarlar.LOG.KanalGuncellemeLOG).send({ embeds: [embed] }).catch(() => {});
                }
            }
        })

    }
}
