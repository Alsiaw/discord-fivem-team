const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const ayarlar = require('../../ayarlar.json');
const moment = require("moment");
const fs = require('fs');
const db = require("croxydb");
require("moment-duration-format");
moment.locale("tr");

const categoryNames = {
    'genel': 'ɢᴇɴᴇʟ ᴅᴇꜱᴛᴇᴋ',
    'mulakat': 'ᴍᴜʟᴀᴋᴀᴀᴛ ᴅᴇꜱᴛᴇᴋ',
    'sikayet': 'ꜱɪᴋᴀʏᴇᴛ ᴅᴇꜱᴛᴇᴋ'
};

let ticketCounter = 0;

if (fs.existsSync('./ticketCounter.json')) {
    const data = fs.readFileSync('./ticketCounter.json', 'utf8');
    ticketCounter = parseInt(data, 10);
}

module.exports = {
    name: Events.InteractionCreate,
    başlat: async(interaction) => {
        if (interaction.isButton()) {
            const selectedCategory = interaction.customId;
            
            if (!['genel', 'mulakat', 'sikayet'].includes(selectedCategory)) {
                return;
            }
            
            const categoryName = categoryNames[selectedCategory];

            if (!interaction.guild) {
                return interaction.reply({
                    content: ' ***Sunucu bilgisi bulunamadı!***',
                    ephemeral: true,
                });
            }

            const guild = interaction.guild;

            if (!categoryName) {
                return interaction.reply({
                    content: ' ***Geçersiz kategori seçimi!***',
                    ephemeral: true,
                });
            }

            const existingTicket = guild.channels.cache.find(channel => {
                return (
                    channel.type === ChannelType.GuildText &&
                    channel.parentId === ayarlar.Ticket.parentCategory &&
                    channel.permissionOverwrites.cache.has(interaction.user.id)
                );
            });

            if (existingTicket) {
                const zatenVar = new EmbedBuilder()
                    .setColor('000080')
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription('<a:unlemsel:1327600285597569066>・ Zaten bu kategoride açık bir talebiniz bulunmaktadır.')
                    .setTimestamp();
            
                return interaction.reply({
                    embeds: [zatenVar],
                    ephemeral: true,
                });
            }

            ticketCounter++;
            fs.writeFileSync('./ticketCounter.json', ticketCounter.toString());

            const channelName = `${ticketCounter}・${interaction.user.username}`;

            const supportChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: ayarlar.Ticket.parentCategory,
                topic: categoryName,
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.ViewChannel, 
                            PermissionsBitField.Flags.AttachFiles
                        ],
                    },
                    {
                        id: ayarlar.Yetkiler.yetkiliRolId,
                        allow: [
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.ViewChannel, 
                            PermissionsBitField.Flags.AttachFiles
                        ],
                    },
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });

            db.set(`ticketChannelUser_${interaction.guild.id}_${supportChannel.id}`, { user: interaction.user.id });

            const embed = new EmbedBuilder()
                .setColor('#141212')
                .setAuthor({
                    name: `${ayarlar.Embed.authorembed} - ᴅᴇsᴛᴇᴋ sɪsᴛᴇᴍɪ`,
                    iconURL: ayarlar.Resimler.moderasyonURL,
                })
                .setDescription(`<:claim:1327586348244140082>  ・ *Lütfen yetkililerimizin mesaj yazmasını beklemeden sorununuzu anlatınız.*
                                 
                <:8676gasp:1327585524231176192>    ・\`ᴅᴇsᴛᴇᴋ ᴀᴄᴀɴ:\` ${interaction.user.toString()}
                <a:utility:1327600287367696515>   ・\`ᴅᴇsᴛᴇᴋ ᴋᴀᴛᴇɢᴏʀɪsɪ: ${categoryName}\`
            `)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setImage(ayarlar.Resimler.moderasyonURL)

            const kapat = new ButtonBuilder()
                .setCustomId('kapat')
                .setLabel('・ᴋᴀᴘᴀᴛ')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<a:closex:1327586349963808769>');

            const bildir = new ButtonBuilder()
                .setCustomId('bildir')
                .setLabel('・ʙɪʟᴅɪʀ')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:onday:1327600263242059848>');

            const actionRow = new ActionRowBuilder()
                .addComponents(kapat, bildir);
            
            await supportChannel.send({ content: `${interaction.user.toString()} | <@&${ayarlar.Yetkiler.yetkiliRolId}>`, embeds: [embed], components: [actionRow] });
            
            if (selectedCategory === 'mulakat') {
                const mulakatForm = `**YAŞINIZ :**
**FİVEM SAATİ:**
**MD BANLI MISIN:**
**ORTALAMA KAÇ FPS ALIYORSUN :**
**MD KİLL POV ZORUNLU 5-10 TANE:**
**KEFİLİNİZ VARMI VARSA ETİKETLEYİN:**
**DAHA ÖNCE HANGİ EKİPLERDE OYNADIN:**`;
                
                await supportChannel.send({ content: mulakatForm });
            }
            
            const ticketaçıldı = new EmbedBuilder()
                .setColor('#141212')
                .setAuthor({
                    name: `${ayarlar.Embed.authorembed} - ᴅᴇsᴛᴇᴋ sɪsᴛᴇᴍɪ`,
                    iconURL: ayarlar.Resimler.moderasyonURL,
                })
                .setDescription(`
                    <:8676gasp:1327585524231176192>  ・ \`ᴏʏᴜɴᴄᴜ:\` ${interaction.user.toString()}
                    <a:utility:1327600287367696515>  ・ \`ᴅᴇsᴛᴇᴋ ᴋᴀɴᴀʟɪ:\` <#${supportChannel.id}>
                    <a:animated_clock29:1327586135039410223>  ・ \`ᴛᴀʀɪʜ: ${moment(Date.now()).format("LLL")}\`
                `);
        
            await interaction.reply({
                embeds: [ticketaçıldı],
                ephemeral: true
            });
        } 
    }
};
