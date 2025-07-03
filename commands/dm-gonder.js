const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ayarlar = require('../ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm-gönder')
        .setDescription('Belirtilen roldeki tüm üyelere DM gönderir')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Mesaj gönderilecek rol')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('metin')
                .setDescription('Gönderilecek mesaj')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username , iconURL: interaction.member.user.avatarURL({dynamic: true})})
            .setColor("#490404")
            .setTimestamp()
            
        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.dmYetkiliRolId)) {
            return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")] , ephemeral: false })
        }

        const rol = interaction.options.getRole('rol');
        const mesaj = interaction.options.getString('metin');
        
        const guild = interaction.guild;
        const logChannel = guild.channels.cache.get(ayarlar.Kanallar.dmlogkanal);
        
        if (!logChannel) {
            console.log('DM Log kanalı bulunamadı:', ayarlar.Kanallar.dmlogkanal);
        } else {
            console.log('DM Log kanalı bulundu:', logChannel.name);
        }
        
        const dmHatalilar = [];
        let basariliGonderim = 0;

        await guild.members.fetch();
        const roleMembers = guild.members.cache.filter(member => member.roles.cache.has(rol.id));
        
        const baslatEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true }) })
            .setColor("#041f49")
            .setTimestamp()
            .setDescription(`<a:onay:1327600261698420767> ・ **${rol.name}** rolündeki **${roleMembers.size}** kişiye DM gönderiliyor...`);
        
        await interaction.reply({ embeds: [baslatEmbed] });
        
        for (const member of roleMembers.values()) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: ` ${guild.name}`, 
                        iconURL: guild.iconURL({ dynamic: true }) 
                    })
                    .setColor("#490404")
                    .setDescription(`<a:unlemsel:1327600285597569066> ・***Uyarı*** ${mesaj}`)
                    .setFooter({ 
                        text: `Gönderen: ${interaction.user.username}`, 
                        iconURL: interaction.user.avatarURL({ dynamic: true }) 
                    })
                    .setTimestamp();

                await member.send({ embeds: [dmEmbed] });
                basariliGonderim++;
            } catch (error) {
                dmHatalilar.push(`<@${member.id}>`);
            }
        }

        const sonucEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true }) })
            .setColor("#08235b")
            .setTimestamp()
            .addFields(
                { name: '<:claim:1327586348244140082>・\`ʜᴇᴅᴇꜰ ʀᴏʟ\`', value: rol.toString(), inline: true },
                { name: '<a:onay:1327600261698420767>・\`ʙᴀꜱᴀʀıʟı\`', value: basariliGonderim.toString(), inline: true },
                { name: '<a:red:1327600270032764928>・\`ʙᴀꜱᴀʀıꜱıᴢ\`', value: dmHatalilar.length.toString(), inline: true },
                { name: '<a:closex:1327586349963808769>・\`ɢᴏ̈ɴᴅᴇʀɪʟᴇɴ ᴍᴇꜱᴀᴊ\`', value: `\`\`\`${mesaj}\`\`\``, inline: false }
            )
            .setDescription(`<a:onay:1327600261698420767> ・ **ᴅᴍ ɢᴏ̈ɴᴅᴇʀɪᴍɪ ᴛᴀᴍᴀᴍʟᴀɴᴅı**`);

        await interaction.editReply({ embeds: [sonucEmbed] });

        if (dmHatalilar.length > 0 && logChannel) {
            try {
                const hataLogEmbed = new EmbedBuilder()
                    .setTitle('<a:unlemsel:1327600285597569066> ᴅᴍ ɢᴏ̈ɴᴅᴇʀɪʟᴇᴍᴇʏᴇɴʟᴇʀ')
                    .setColor("#490404")
                    .setTimestamp()
                    .addFields(
                        { name: '<a:5961darkbluetea:1327585257578561548>・\`ɢᴏ̈ɴᴅᴇʀᴇɴ\`', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '<a:utility:1327600287367696515>・\`ʀᴏʟ\`', value: rol.toString(), inline: true },
                        { name: '<:carpu:1327586342028316726>・\`ʙᴀꜱᴀʀıꜱıᴢ ꜱᴀʏı\`', value: dmHatalilar.length.toString(), inline: true },
                        { name: '<:claim:1327586348244140082>・\`ᴍᴇꜱᴀᴊ\`', value: `\`\`\`${mesaj}\`\`\``, inline: false },
                        { name: '<:8676gasp:1327585524231176192>・\`ᴅᴍ ᴋᴀᴘᴀʟı ᴏʟᴀɴʟᴀʀ\`', value: dmHatalilar.join(', '), inline: false }
                    )

                await logChannel.send({ embeds: [hataLogEmbed] });
                console.log('DM hata logu gönderildi');
            } catch (error) {
                console.error('DM hata logu gönderilemedi:', error);
            }
        }

        if (logChannel) {
            try {
                const genelLogEmbed = new EmbedBuilder()
                    .setTitle(' ᴅᴍ ɢᴏ̈ɴᴅᴇʀɪᴍ ʀᴀᴘᴏʀᴜ')
                    .setColor("#041f49")
                    .setTimestamp()
                    .addFields(
                        { name: '<a:5961darkbluetea:1327585257578561548>・\`ɢᴏ̈ɴᴅᴇʀᴇɴ\`', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '<a:utility:1327600287367696515>・\`ʀᴏʟ\`', value: rol.toString(), inline: true },
                        { name: '<:bugsal:1327586234876301332>・\`ᴛᴏᴘʟᴀᴍ ᴜ̈ʏᴇ\`', value: roleMembers.size.toString(), inline: true },
                        { name: '<a:onay:1327600261698420767>・\`ʙᴀꜱᴀʀıʟı\`', value: basariliGonderim.toString(), inline: true },
                        { name: '<a:red:1327600270032764928>・\`ʙᴀꜱᴀʀıꜱıᴢ\`', value: dmHatalilar.length.toString(), inline: true },
                        { name: '<:8676gasp:1327585524231176192>・\`ɢᴏ̈ɴᴅᴇʀɪʟᴇɴ ᴍᴇꜱᴀᴊ\`', value: `\`\`\`${mesaj}\`\`\``, inline: false }
                    )
                    .setDescription(`<a:onay:1327600261698420767>・\`${interaction.user.username}\` ᴛᴀʀᴀꜰıɴᴅᴀɴ ᴛᴀᴍᴀᴍʟᴀɴᴅı`);

                await logChannel.send({ embeds: [genelLogEmbed] });
                console.log('DM genel logu gönderildi');
            } catch (error) {
                console.error('DM genel logu gönderilemedi:', error);
            }
        } else {
            console.log('Log kanalı bulunamadığı için log atılamadı');
        }
    }
};
