const { Collection, Events , EmbedBuilder,  AuditLogEvent} = require("discord.js")
const ayarlar = require("../../ayarlar.json");
const ms = require("ms")
const cooldown = new Collection()

const moment = require("moment")
moment.locale("tr")
require("moment-duration-format");

const IDB = require("../../database/ID")
const İsimDB = require("../../database/isimler2.js")

module.exports = {
	name: Events.GuildMemberUpdate,
	başlat: async(newMember, oldMember) => {

        if (oldMember.nickname != newMember.nickname) {
      
            const oldNickname = oldMember.nickname || `${newMember.user.username}`;
            const newNickname = newMember.nickname || `${newMember.user.username}`;
           
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
              limit: 1,
              type: AuditLogEvent.MemberUpdate,
            });
      
            const isimLOG = newMember.guild.channels.cache.get(ayarlar.LOG.isimLOG);
            if (!isimLOG) return;
      
            const isimlog = fetchedLogs.entries.first();
            if (!isimlog) return;
            const { executor, target } = isimlog;
      
            const Embed = new EmbedBuilder().setColor('#051b50').setFooter({ text: moment(Date.now()).format("LLL") })

            if(executor.id == ayarlar.Bot?.botID) {

                const messageUsersData = await IDB.find({ SunucuID: newMember.guild.id })
                const messageUsers = messageUsersData
                    .splice(0, 100)
                    .map((x, index) => `${x.ID}`)
                    .join("\n");
      
                isimLOG.send({embeds:[Embed
                    .setFooter({ text: `Ⓜ️ İsimID: #${messageUsers} ・ ${moment(Date.now()).format("LLL")}`})
                    .setAuthor({name:`${newMember.user.username} - ISIM GUNCELLENDI`,iconURL:newMember.user.avatarURL({dynamic:true})})
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir kullanıcının ismi bir yetkili tarafından* *başarılı bir şekilde güncellenmiştir!* 
                            
                    <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${executor} | 
                    <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴜʟʟᴀɴıᴄı:\` | ${newMember} |
                      
                    ***Eski İsim;***
                    \`\`\`diff\n- ${newNickname}\`\`\`
                    ***Yeni İsim;***
                    \`\`\`diff\n+ ${oldNickname}\`\`\`
                    `)
                    .setThumbnail(newMember.user.avatarURL({dynamic:true}))
                ]}).catch(() => {});
      
                return false;
            }
      
            if(executor.id !== ayarlar.Bot?.botID) {
      
                await IDB.findOneAndUpdate(
                  { SunucuID: newMember.guild.id },
                  { $inc: { ID: 1 } },
                  { upsert: true }
                );
      
                const messageUsersData = await IDB.find({ SunucuID: newMember.guild.id })
                const messageUsers = messageUsersData
                    .splice(0, 100)
                    .map((x, index) => `${x.ID}`)
                    .join("\n");
      
                isimLOG.send({embeds:[Embed
                    .setFooter({ text: `Ⓜ️ İsimID: #${messageUsers} ・ ${moment(Date.now()).format("LLL")}`})
                    .setAuthor({name:`${newMember.user.username} - ISIM GUNCELLENDI`,iconURL:newMember.user.avatarURL({dynamic:true})})
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir kullanıcının ismi bir yetkili tarafından* *başarılı bir şekilde güncellenmiştir!* 
                            
                    <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${executor} | 
                    <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴜʟʟᴀɴıᴄı:\` | ${newMember} |
                      
                    ***Eski İsim;***
                    \`\`\`diff\n- ${newNickname}\`\`\`
                    ***Yeni İsim;***
                    \`\`\`diff\n+ ${oldNickname}\`\`\`
                    `)
                    .setThumbnail(newMember.user.avatarURL({dynamic:true}))
                ]}).catch(() => {});
      
                await İsimDB.findOneAndUpdate(
                    { Sunucu: newMember.guild.id, Oyuncu: newMember.id },
                    { $push: { 
                        İsimler: { 
                            Yetkili: executor.id,
                            Tarih: moment(Date.now()).format("LLL"),
                            Yİsim: newNickname,
                            Eİsim: oldNickname,
                            ID: `#${messageUsers.length > 0 ? messageUsers : "Veri Bulunmuyor."}`,
                        } 
                    }}, 
                    { upsert: true }
                );
      
                return false;
            }
        }

    }
}
