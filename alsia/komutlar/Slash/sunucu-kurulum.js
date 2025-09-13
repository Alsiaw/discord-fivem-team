const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-kurulum')
        .setDescription('Sunucu log kanallarını otomatik olarak kurar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== "278152550627409921") {
            return interaction.reply({ 
                content: "Bu komutu kullanma yetkiniz yok!", 
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;
            const mevcutKanallar = guild.channels.cache;

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

            const kategori1Mevcut = mevcutKanallar.find(c => 
                c.name === 'BOT - ISLEMLER' && c.type === ChannelType.GuildCategory
            );
            const kategori2Mevcut = mevcutKanallar.find(c => 
                c.name === 'BOT LOG - SUNUCU' && c.type === ChannelType.GuildCategory
            );

            const mevcutLogKanallari = logKanallari.filter(kanal => 
                mevcutKanallar.find(k => k.name === kanal.name && k.type === ChannelType.GuildText)
            );

            if (kategori1Mevcut && kategori2Mevcut && mevcutLogKanallari.length === logKanallari.length) {
                return interaction.editReply({ 
                    content: "Loglar zaten kurulu, işlem yapılmadı.",
                    ephemeral: true 
                });
            }

            let olusturulanKanallar = 0;
            const kanalLogMap = {};

            let kategori1 = kategori1Mevcut;
            if (!kategori1) {
                kategori1 = await guild.channels.create({
                    name: 'BOT - ISLEMLER',
                    type: ChannelType.GuildCategory,
                    position: guild.channels.cache.size,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ]
                });
            }

            const kanalIsimleri1 = ['│💻│ꜰᴀʀᴍ', '│📧│ᴛıᴄᴋᴇᴛ'];
            for (const name of kanalIsimleri1) {
                const mevcutKanal = mevcutKanallar.find(k => k.name === name);
                if (!mevcutKanal) {
                    await guild.channels.create({
                        name,
                        type: ChannelType.GuildText,
                        parent: kategori1,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    olusturulanKanallar++;
                }
            }

            let kategori2 = kategori2Mevcut;
            if (!kategori2) {
                kategori2 = await guild.channels.create({
                    name: 'BOT LOG - SUNUCU',
                    type: ChannelType.GuildCategory,
                    position: guild.channels.cache.size,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ]
                });
            }

            for (const kanal of logKanallari) {
                const mevcutKanal = mevcutKanallar.find(k => k.name === kanal.name);
                
                if (!mevcutKanal) {
                    const yeniKanal = await guild.channels.create({
                        name: kanal.name,
                        type: ChannelType.GuildText,
                        parent: kategori2,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    
                    kanalLogMap[kanal.ayarKey] = yeniKanal.id;
                    olusturulanKanallar++;
                } else {
                    kanalLogMap[kanal.ayarKey] = mevcutKanal.id;
                }
            }

            const ayarlarPath = path.join(__dirname, '..', 'ayarlar.json');
            const ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf8'));

            for (const [key, value] of Object.entries(kanalLogMap)) {
                const keys = key.split('.');
                let current = ayarlar;
                
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                
                current[keys[keys.length - 1]] = value;
            }

            fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 4));

            if (olusturulanKanallar > 0) {
                await interaction.editReply({ 
                    content: `${olusturulanKanallar} yeni kanal kuruldu. Bot 3 saniye sonra yeniden başlatılacak...`,
                    ephemeral: true 
                });

                setTimeout(() => {
                    console.log('🔄 Sunucu kurulum sonrası otomatik restart...');
                    process.exit(0);
                }, 3000);
            } else {
                await interaction.editReply({ 
                    content: "Ayarlar güncellendi, yeniden başlatma gerekmiyor.",
                    ephemeral: true 
                });
            }

        } catch (error) {
            console.error('Sunucu kurulum hatası:', error);
            await interaction.editReply({
                content: `Kurulum sırasında bir hata oluştu: ${error.message}`,
            });
        }
    }
};
