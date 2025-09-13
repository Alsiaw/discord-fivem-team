const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ayarlar = require('../../ayarlar.json');

const logKanallari = [
    { name: 'ᴡᴇʟᴄᴏᴍᴇ', ayarKey: 'LOG.welcomeLOG' },
    { name: 'ʙʏ-ʙʏ', ayarKey: 'LOG.ByByLOG' },
    { name: 'ʏᴀꜱᴀᴋʟᴀᴍᴀ', ayarKey: 'LOG.banLOG' },
    { name: 'ᴜɴʙᴀɴ', ayarKey: 'LOG.unbanLOG' },
    { name: 'ıꜱıᴍʟᴇʀ', ayarKey: 'LOG.isimLOG' },
    { name: 'ꜱᴇꜱ', ayarKey: 'LOG.sesLOG' },
    { name: 'ꜱᴇꜱ-ᴇxᴛʀᴀ', ayarKey: 'LOG.sesExtraLOG' },
    { name: 'ᴍᴇꜱᴀᴊʟᴀʀ', ayarKey: 'Kanallar.mesajLogKanalId' },
    { name: 'ᴍᴇꜱᴀᴊ-ꜱɪʟᴍᴇ', ayarKey: 'LOG.mesajLOG' },
    { name: 'ᴘᴇʀᴍ-ᴠᴇʀᴍᴇ', ayarKey: 'LOG.PermVermeLOG' },
    { name: 'ᴘᴇʀᴍ-ᴀʟᴍᴀ', ayarKey: 'LOG.PermAlmaLOG' },
    { name: 'ʀᴏʟ-ᴀᴄᴍᴀ', ayarKey: 'LOG.RolAcmaLOG' },
    { name: 'ʀᴏʟ-ᴜᴘᴅᴀᴛᴇ', ayarKey: 'LOG.RolGuncellemeLOG' },
    { name: 'ʀᴏʟ-ꜱıʟᴍᴇ', ayarKey: 'LOG.RolSilmeLOG' },
    { name: 'ᴋᴀɴᴀʟ-ᴀᴄᴍᴀ', ayarKey: 'LOG.KanalAcmaLOG' },
    { name: 'ᴋᴀɴᴀʟ-ᴜᴘᴅᴀᴛᴇ', ayarKey: 'LOG.KanalGuncellemeLOG' },
    { name: 'ᴋᴀɴᴀʟ-ꜱıʟᴍᴇ', ayarKey: 'LOG.KanalSilmeLOG' },
    { name: 'ꜰᴀʀᴍ-ʟᴏɢ', ayarKey: 'Kanallar.otLogKanalId' },
    { name: 'ᴛɪᴄᴋᴇᴛ', ayarKey: 'Ticket.ticketLog' },
    { name: 'ᴛɪᴄᴋᴇᴛ-ɪꜱʟᴇᴍʟᴇʀ', ayarKey: 'Ticket.ticketLog2' },
    { name: 'ᴅᴍ', ayarKey: 'Kanallar.dmlogkanal' },
    { name: 'ᴀᴋᴛɪꜰʟɪᴋ-ᴛᴇꜱᴛɪ', ayarKey: 'Kanallar.aktiflikBildirimKanalId' },
    { name: 'ᴋᴏᴍᴜᴛ-ꜱɪʟᴍᴇ', ayarKey: 'LOG.KomutLOG.SilmeLOG' }
];

module.exports = {
    name: Events.ChannelDelete,
    başlat: async(channel) => {
        try {
            if (channel.type !== ChannelType.GuildText) return;

            const silinenKanal = logKanallari.find(kanal => kanal.name === channel.name);
            if (!silinenKanal) return;

            const silinenPozisyon = channel.position;

            const guild = channel.guild;
            const logKategori = guild.channels.cache.find(c => 
                c.type === ChannelType.GuildCategory && 
                c.name === 'BOT LOG - SUNUCU'
            );

            if (!logKategori) {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            const yeniKanal = await guild.channels.create({
                name: silinenKanal.name,
                type: ChannelType.GuildText,
                parent: logKategori,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: "278152550627409921",
                        allow: [PermissionFlagsBits.ViewChannel],
                    }
                ]
            });

            await yeniKanal.setPosition(silinenPozisyon);

            const ayarlarPath = path.join(__dirname, '..', 'ayarlar.json');
            const guncelAyarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf8'));

            const keys = silinenKanal.ayarKey.split('.');
            let current = guncelAyarlar;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = yeniKanal.id;

            fs.writeFileSync(ayarlarPath, JSON.stringify(guncelAyarlar, null, 4));

            await yeniKanal.send({
                content: `🔄 **Otomatik Kanal Restore**`
            });
            
            process.exit(0);

        } catch (error) {
            console.error('Kanal restore hatası:', error);
        }
    }
};
