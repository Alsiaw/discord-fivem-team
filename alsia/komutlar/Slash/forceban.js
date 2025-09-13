const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const ayarlar = require("../../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("forceban")
        .setDescription("Sunucuda bulunmayan bir oyuncuyu zorla yasaklarsınız!")
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('ID giriniz lütfen örnek: 278152550627409921')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Sebep giriniz.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const oyuncu = interaction.options.getString('id');
        const sebep = interaction.options.getString('sebep');
        const guild = interaction.guild;
        const member = guild.members.cache.get(oyuncu);

        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
            .setColor("#490404")
            .setTimestamp();

        if (member) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Oyuncu sunucuda bulunuyor /ban kullanbilirsiniz.*")], ephemeral: true });
        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz veya geçersiz yetki.*")], ephemeral: true });
        if (interaction.member.id == oyuncu) return interaction.reply({ embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Kendinemi Ceza Vericeksin.*")], ephemeral: true });

        await interaction.deferReply().catch(() => {});

        const cezaId = Math.floor(Math.random() * 9999) + 1;

        const embed = new EmbedBuilder()
            .setColor('#041f49')
            .setDescription(`<:bsanned:1327586232506515479> ・ <@${oyuncu}> *isimli oyuncu sunucudan zorunlu bir şekilde* \`${sebep}\` *sebebi ile yasaklandı.*
            
            <:bugsal:1327586234876301332> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${interaction.member}
            <a:5961darkbluetea:1327585257578561548> ・ \`ᴄᴇᴢᴀ ɪᴅ: #${cezaId}\``)
            .setAuthor({
                name: `${interaction.member.displayName}`,
                iconURL: interaction.member.user.avatarURL({ dynamic: true })
            });

        await interaction.editReply({ embeds: [embed] }).catch(() => {});

        await interaction.guild.members.ban(oyuncu, { 
            reason: `» Yetkili: ${interaction.member.user.tag} \n » Sebep: ${sebep} \n » Tarih: ${moment(Date.now()).format("LLL")} \n » CezaID: #${cezaId}` 
        }).catch(() => {});

        const embedV2 = new EmbedBuilder()
            .setDescription(`<:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` ${interaction.member}
            <a:5961darkbluetea:1327585257578561548> ・ \`ᴏʏᴜɴᴄᴜ:\` <@${oyuncu}>`)
            .setColor('#040450')
            .setFooter({ text: `🌐 ᴅᴇᴠ. ʙʏ ᴀʟꜱɪᴀ` })
            .setThumbnail(interaction.member.user.avatarURL({ dynamic: true }))
            .setAuthor({
                name: `${ayarlar.Embed.authorembed} - ʏᴀꜱᴀᴋʟᴀᴍᴀ`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .addFields(
                { name: "**SEBEP:**", value: `\`\`\`fix\n${sebep}\`\`\``, inline: false },
                { name: "**TARIH:**", value: `\`\`\`fix\n${moment(Date.now()).format("LLL")} - CezaID: #${cezaId}\`\`\``, inline: true }
            );

        await guild.channels.cache.get(ayarlar.LOG.banLOG).send({ embeds: [embedV2] });
    }
};
