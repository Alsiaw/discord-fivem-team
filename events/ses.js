const { Collection, Events , EmbedBuilder,  AuditLogEvent} = require("discord.js")
const ayarlar = require("../ayarlar.json");
const ms = require("ms")
const cooldown = new Collection()

const moment = require("moment")
moment.locale("tr")
require("moment-duration-format");

module.exports = {
	name: Events.VoiceStateUpdate,
	başlat: async( oldState, newState ) => {

        let logs = await oldState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
        let entry = logs.entries.first();
      
        const embeds = new EmbedBuilder()
        .setColor("#051b50")
        .setFooter({ text: `${moment(Date.now()).format("LLL")}`})
        
        const SesLOG = oldState.guild.channels.cache.get(ayarlar.LOG.sesLOG);
        if (!SesLOG) return;
        
        const sesExtraLOG = oldState.guild.channels.cache.get(ayarlar.LOG.sesExtraLOG);
        if (!sesExtraLOG) return;
        
        if (!oldState.channel && newState.channel) {
            if (!newState.member) return;
            return SesLOG.send({ 
                embeds: [embeds
                    .setAuthor({name: `${newState.member.displayName || newState.member.user.username} - GIRIS`, iconURL: newState.member.user.avatarURL({ dynamic: true })})
                    .setDescription(` <:8676gasp:1327585524231176192> ・ \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} - \`${newState.member.id}\` \n <:2124discordstagechannel:1327585187684417577> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ]
            }).catch(() => {});
        }
        
        if (oldState.channel && !newState.channel) {
            if (!oldState.member) return;
            return SesLOG.send({ 
                embeds: [embeds
                    .setAuthor({name: `${oldState.member.displayName || oldState.member.user.username} - CIKIS`, iconURL: oldState.member.user.avatarURL({ dynamic: true })})
                    .setDescription(` <:8676gasp:1327585524231176192> ・ \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${oldState.member} - \`${oldState.member.id}\` \n <:2124discordstagechannel:1327585187684417577> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${oldState.channel.id}>`)
                ] 
            }).catch(() => {});
        }
        
        if (oldState.channel && newState.channel && oldState.channel != newState.channel) {
            if (!newState.member) return;
            return SesLOG.send({ 
                embeds: [embeds
                    .setAuthor({name: `${newState.member.displayName || newState.member.user.username} - KANAL DEGISIKLIGI`, iconURL: newState.member.user.avatarURL({ dynamic: true })})
                    .setDescription(`
        
        <:8676gasp:1327585524231176192> ・ \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} - \`${newState.member.id}\`
        
        <:2124discordstagechannel:1327585187684417577> ・ \`ᴄɪᴋɪꜱ ʏᴀᴘɪʟᴀɴ ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${oldState.channel.id}>
        <:2124discordstagechannel:1327585187684417577> ・ \`ɢɪʀɪꜱ ʏᴀᴘɪʟᴀɴ ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ] 
            }).catch(() => {});
        }
        
        if (oldState.channel && !oldState.streaming && newState.channel && newState.streaming) {
            return sesExtraLOG.send({ 
                embeds: [embeds.setDescription(`<:8676gasp:1327585524231176192> ・ ${newState.member} - \`${newState.member.id}\` *kullanıcısı* <#${newState.channel.id}> *adlı sesli kanalda yayın açtı!*`)] 
            }).catch(() => {});
        }
        
        if (oldState.channel && oldState.streaming && newState.channel && !newState.streaming) {
            return sesExtraLOG.send({ 
                embeds: [embeds.setDescription(`<:8676gasp:1327585524231176192> ・ ${newState.member} - \`${newState.member.id}\` *kullanıcısı* <#${newState.channel.id}> *adlı sesli kanalda yayını kapattı!*`)] 
            }).catch(() => {});
        }
        
        if (oldState.serverDeaf && !newState.serverDeaf) {
            if (!newState.member) return;
            return sesExtraLOG.send({ 
                embeds: [new EmbedBuilder()
                    .setColor("#051b50")
                    .setAuthor({ name:`${newState.member.displayName || newState.member.user.username} - SAGIRLASTIRMASI KALDIRILDI`,iconURL: newState.member.user.avatarURL({dynamic:true})})
                    .setFooter({ text: `${moment(Date.now()).format("LLL")}`})
                    .setDescription(`
        
        <:8676gasp:1327585524231176192> ・ \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} (\`${newState.member.id}\`)
        <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${entry ? entry.executor : 'Bilinmiyor'} (\`${entry ? entry.executor.id : 'Bilinmiyor'}\`)
        <a:5961darkbluetea:1327585257578561548> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ]
            }).catch(() => {});
        }
        
        if (!oldState.serverDeaf && newState.serverDeaf) {
            if (!newState.member) return;
            return sesExtraLOG.send({ 
                embeds: [new EmbedBuilder()
                    .setColor("#051b50")
                    .setAuthor({ name:`${newState.member.displayName || newState.member.user.username} - SAGIRLARSTIRILDI`,iconURL: newState.member.user.avatarURL({dynamic:true})})
                    .setFooter({ text: `${moment(Date.now()).format("LLL")}`})
                    .setDescription(`
        
        <:8676gasp:1327585524231176192> ・  \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} (\`${newState.member.id}\`)
        <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${entry ? entry.executor : 'Bilinmiyor'} (\`${entry ? entry.executor.id : 'Bilinmiyor'}\`)
        <a:5961darkbluetea:1327585257578561548> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ]
            }).catch(() => {});
        }
        
        if (oldState.serverMute && !newState.serverMute) {
            if (!newState.member) return;
            return sesExtraLOG.send({ 
                embeds: [new EmbedBuilder()
                    .setColor("#051b50")
                    .setAuthor({ name:`${newState.member.displayName || newState.member.user.username} - SUSUTURULMASI KALDIRILDI`,iconURL: newState.member.user.avatarURL({dynamic:true})})
                    .setFooter({ text: `${moment(Date.now()).format("LLL")}`})
                    .setDescription(`
        
        <:8676gasp:1327585524231176192> ・  \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} (\`${newState.member.id}\`)
        <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${entry ? entry.executor : 'Bilinmiyor'} (\`${entry ? entry.executor.id : 'Bilinmiyor'}\`)
        <a:5961darkbluetea:1327585257578561548> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ]
            }).catch(() => {});
        }
        
        if (!oldState.serverMute && newState.serverMute) {
            if (!newState.member) return;
            return sesExtraLOG.send({ 
                embeds: [new EmbedBuilder()
                    .setColor("#051b50")
                    .setAuthor({ name:`${newState.member.displayName || newState.member.user.username} - SUSTURULDU`,iconURL: newState.member.user.avatarURL({dynamic:true})})
                    .setFooter({ text: `${moment(Date.now()).format("LLL")}`})
                    .setDescription(`
        
        <:8676gasp:1327585524231176192> ・  \`ᴋᴜʟʟᴀɴɪᴄɪ:\` ${newState.member} (\`${newState.member.id}\`)
        <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${entry ? entry.executor : 'Bilinmiyor'} (\`${entry ? entry.executor.id : 'Bilinmiyor'}\`)
        <a:5961darkbluetea:1327585257578561548> ・ \`ꜱᴇꜱ ᴋᴀɴᴀʟɪ:\` <#${newState.channel.id}>`)
                ]
            }).catch(() => {});
        }

    }
}
