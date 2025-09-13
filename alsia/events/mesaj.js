const { Events, EmbedBuilder, AuditLogEvent } = require("discord.js");
const ayarlar = require("../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

const snipek = require("../../database/snipe-channel.js");
const snipe = require("../../database/snipe-user.js");

module.exports = {
	name: Events.MessageDelete,
	başlat: async(message) => {

        if (!message.author) return;
        
        let logs = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
        let entry = logs.entries.first();
      
       const MesajLOG = message.guild.channels.cache.get(ayarlar.LOG.mesajLOG);
        if (!MesajLOG) return;
      
        const Embed = new EmbedBuilder().setColor('#051b50');
      
        let messageContent = "";
        
        if (message.author.bot) {
            if (message.content && message.content.trim()) {
                messageContent = message.content;
            } else if (message.embeds && message.embeds.length > 0) {
                const embed = message.embeds[0];
                if (embed.title) messageContent += `**${embed.title}**\n`;
                if (embed.description) messageContent += embed.description;
                if (!messageContent.trim()) messageContent = "[Bot Embed Mesajı]";
            } else {
                messageContent = "[Bot Mesajı - İçerik Tespit Edilemedi]";
            }
        } else {
            messageContent = message.content || "[Boş Mesaj]";
        }
        
        if (!messageContent.trim() && message.attachments.size > 0) {
            messageContent = "[Sadece dosya/resim içeren mesaj]";
        }
        
        var messageHadAttachment = message.attachments.map(x => x.proxyURL)[0];
        
        if (messageHadAttachment) {
            try {
                await snipe.findOneAndUpdate(
                    { guildID: message.guild.id, channelID: message.channelId }, 
                    { $set: { messageContent: messageContent, userID: message.author.id, image: messageHadAttachment, createdDate: message.createdTimestamp, deletedDate: Date.now() } }, 
                    { upsert: true }
                );
                
                await snipek.findOneAndUpdate(
                    { guildID: message.guild.id, userID: message.author.id }, 
                    { $set: { messageContent: messageContent, channelID: message.channelId, image: messageHadAttachment, createdDate: message.createdTimestamp, deletedDate: Date.now() } }, 
                    { upsert: true }
                );
            } catch (error) {
                console.error('MongoDB snipe güncelleme hatası:', error);
            }
      
            MesajLOG.send({embeds:[Embed
                .setAuthor({name:`${message.author.username} - DOSYA SILINDI`,iconURL:message.guild.iconURL({dynamic:true})})
                .setThumbnail(message.author.avatarURL({dynamic:true}))
                .setFooter({ text: moment(Date.now()).format("LLL") })
                .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili veya kullanıcı tarafından* | \`${message.channel.name}\` | *isimli kanalda* *mesaj silindi!* \n \n <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${entry ? entry.executor : 'Bilinmiyor'} | \n  <a:5961darkbluetea:1327585257578561548> ・ \`ᴍᴇꜱᴀᴊ ꜱᴀʜıʙı:\` | ${message.author} |  \n\n ***Silinen Mesaj:*** \n \`\`\`${messageContent}\`\`\` \n\n ***Silinen Dosya:*** \n ${messageHadAttachment}`)
                .setImage(messageHadAttachment)
            ]}).catch(() => {});
      
        } else {
            try {
                await snipe.findOneAndUpdate(
                    { guildID: message.guild.id, channelID: message.channelId }, 
                    { $set: { messageContent: messageContent, userID: message.author.id, image: null, createdDate: message.createdTimestamp, deletedDate: Date.now() } }, 
                    { upsert: true }
                );
                
                await snipek.findOneAndUpdate(
                    { guildID: message.guild.id, userID: message.author.id }, 
                    { $set: { messageContent: messageContent, channelID: message.channelId, image: null, createdDate: message.createdTimestamp, deletedDate: Date.now() } }, 
                    { upsert: true }
                );
            } catch (error) {
                console.error('MongoDB snipe güncelleme hatası:', error);
            }
      
            const isBot = message.author.bot ? " (BOT)" : "";
            
            MesajLOG.send({embeds:[Embed
                .setAuthor({name:`${message.author.username}${isBot} - MESAJ SILINDI`,iconURL:message.guild.iconURL({dynamic:true})})
                .setThumbnail(message.author.avatarURL({dynamic:true}))
                .setFooter({ text: moment(Date.now()).format("LLL") })
                .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir yetkili veya kullanıcı tarafından* | \`${message.channel.name}\` | *isimli kanalda* *mesaj silindi!* \n \n <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${entry ? entry.executor : 'Bilinmiyor'} | \n  <a:5961darkbluetea:1327585257578561548> ・ \`ᴍᴇꜱᴀᴊ ꜱᴀʜıʙı:\` | ${message.author} |  \n\n ***Silinen Mesaj:*** \n \`\`\`${messageContent}\`\`\``)
            ]}).catch(() => {});
        }

    }
}
