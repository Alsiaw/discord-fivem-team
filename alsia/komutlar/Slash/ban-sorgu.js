const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban-sorgu")
        .setDescription("Bir oyuncunun sunucudan yasaklı olup olmadığını kontrol edersiniz.")
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('ID giriniz lütfen örnek: 278152550627409921')
                .setRequired(true)
        ),

    async execute(interaction) {
        const ID = interaction.options.getString('id');
        const guild = interaction.guild;

        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
            .setColor("#490404")
            .setTimestamp();

        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], ephemeral: true });
        if (interaction.member.id == ID) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinimi sorguluyorsun?*")], ephemeral: true });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("unban")
                    .setLabel("Yasaklanmasını Kaldır!")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("<:Ban_Hammer1:1145674366374387783>")
            );

        const uyarı = new EmbedBuilder()
            .setColor("#4f0006")
            .setAuthor({ name: `${ayarlar.Embed.authorembed} - ʙᴀɴ ꜱᴏʀɢᴜʟᴀᴍᴀ`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(`\`${ID}\` *ID'li Kullanıcı:*
            » *Sunucudan Yasaklı Değil!*`);

        try {
            const bans = await interaction.guild.bans.fetch();
            if (!bans.has(ID)) {
                return interaction.reply({ embeds: [uyarı] }).catch(() => {});
            }

            const banInfo = await interaction.guild.bans.fetch(ID);
            const ban = new EmbedBuilder()
                .setColor("#041f49")
                .setThumbnail(interaction.member.user.avatarURL({ dynamic: true }))
                .setFooter({ text: moment(Date.now()).format("LLL") })
                .setAuthor({ name: `${ayarlar.Embed.authorembed} - ʙᴀɴ ꜱᴏʀɢᴜʟᴀᴍᴀ`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(`<@${ID}> - \`${ID}\` *ID'li Kullanıcının Yasaklanma Bilgisi:*
                
                \`${banInfo.reason || 'Sebep belirtilmemiş'}\``);

            await interaction.reply({ embeds: [ban], components: [row] }).catch(() => {});

            const filter = (button) => button.user.id === interaction.member.id;
            const collector = interaction.channel.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                filter, 
                time: 60000 
            });

            collector.on("collect", async (button) => {
                if (button.customId === "unban") {
                    const Warn2 = new EmbedBuilder()
                        .setAuthor({ name: button.member.user.username, iconURL: button.member.user.avatarURL({ dynamic: true }) })
                        .setColor("#490404")
                        .setTimestamp();

                    if (!button.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
                        return button.reply({ embeds: [Warn2.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], ephemeral: true });
                    }

                    await button.reply({ content: "*- Başarılı bir şekilde yasaklanması kaldırıldı!*", ephemeral: true }).catch(() => {});

                    const embed = new EmbedBuilder()
                        .setColor('#041f49')
                        .setDescription(`<:bsanned:1327586232506515479> ・ <@${ID}> *isimli oyuncunun başarılı bir şekilde sunucudan yasaklanması kaldırıldı.*
                        
                        <a:5961darkbluetea:1327585257578561548> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${button.member}`)
                        .setAuthor({
                            name: `${button.member.displayName}`,
                            iconURL: button.member.user.avatarURL({ dynamic: true })
                        });

                    await button.message.edit({ embeds: [embed], components: [] }).catch(() => {});

                    const banInfo2 = await button.guild.bans.fetch(ID);
                    const embedss = new EmbedBuilder()
                        .setColor('#041f49')
                        .setAuthor({
                            name: `${ayarlar.Embed.authorembed} - ʏᴀꜱᴀᴋ ᴋᴀʟᴅıʀᴍᴀ`,
                            iconURL: button.member.user.avatarURL({ dynamic: true })
                        })
                        .setDescription(`<:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${button.member}
                        <a:5961darkbluetea:1327585257578561548> ・ \`ᴏʏᴜɴᴄᴜ:\` <@${ID}>`)
                        .setThumbnail(guild.iconURL({ dynamic: true }))
                        .addFields(
                            { name: "**TARIH:**", value: `\`\`\`fix\n${moment(Date.now()).format("LLL")} - CezaID: #${Math.floor(Math.random() * 9999) + 1}\`\`\``, inline: false },
                            { name: "**YASAK BILGI:**", value: `\`\`\`fix\n${banInfo2.reason || 'Sebep belirtilmemiş'}\`\`\``, inline: true }
                        );

                    await button.client.channels.cache.get(ayarlar.LOG.unbanLOG).send({ embeds: [embedss] });
                    await button.guild.members.unban(ID, { reason: `Yetkili: ( ${button.member.user.tag} )  |  Tarih: ( ${moment(Date.now()).format("LLL")} )` }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('Ban sorgu hatası:', error);
            return interaction.reply({ embeds: [uyarı] }).catch(() => {});
        }
    }
};
