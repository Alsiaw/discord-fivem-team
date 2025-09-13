const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');
const { fetchServerData, extractDiscordId, paginationSessions } = require('./server-list.js');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ekip-kontrol')
        .setDescription('Ekip üyelerini gösterir')
        .addStringOption(option =>
            option.setName('ekip-ismi')
                .setDescription('Kontrol edilecek ekip ismi')
                .setRequired(true)
        ),

    async execute(interaction) {
        const Warn = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
            .setColor("#041f49")
            .setTimestamp();

        if (!interaction.member.roles.cache.has(ayarlar.Yetkiler.yetkiliRolId)) {
            return interaction.reply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Bu komutu kullanma yetkiniz bulunmamaktadır.*")],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const ekipIsmi = interaction.options.getString('ekip-ismi');
            const serverData = await fetchServerData();
            
            if (!serverData || !serverData.Data) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Sunucu verilerine ulaşılamıyor.*")]
                });
            }

            const players = serverData.Data.players || [];
            const teamMembers = players.filter(player =>
                player.name && player.name.toLowerCase().includes(ekipIsmi.toLowerCase())
            ).map(player => ({
                name: player.name,
                gameId: player.id?.toString() || 'Bilinmiyor',
                steamId: player.identifiers?.find(id => id.startsWith('steam:')) || 'Bilinmiyor',
                discord: extractDiscordId(player.identifiers?.find(id => id.startsWith('discord:')))
            }));

            if (teamMembers.length === 0) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Sonuç:*** *Bu ekip isminde oyuncu bulunamadı.*")]
                });
            }

            const totalPages = Math.ceil(teamMembers.length / 10);
            const sessionId = `team_${interaction.user.id}_${Date.now()}`;

            paginationSessions.set(sessionId, {
                teamMembers,
                ekipIsmi,
                currentPage: 0,
                totalPages,
                type: 'team'
            });

            setTimeout(() => {
                paginationSessions.delete(sessionId);
            }, 900000);

            const embed = createTeamEmbed(teamMembers, ekipIsmi, 0, totalPages, interaction);
            const buttons = totalPages > 1 ? createTeamPaginationButtons(0, totalPages, sessionId) : null;

            const replyOptions = { embeds: [embed] };
            if (buttons) replyOptions.components = [buttons];

            await interaction.editReply(replyOptions);

        } catch (error) {
            console.error('Ekip kontrol hatası:', error);
            await interaction.editReply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Komut işlenirken bir hata oluştu.*")]
            });
        }
    }
};

function createTeamEmbed(teamMembers, ekipIsmi, page, totalPages, interaction) {
    const startIdx = page * 10;
    const endIdx = Math.min(startIdx + 10, teamMembers.length);
    const currentMembers = teamMembers.slice(startIdx, endIdx);

    const embed = new EmbedBuilder()
        .setColor("#041f49")
        .setTitle(`${ekipIsmi.toUpperCase()} (${teamMembers.length} Üye)`)
        .setTimestamp()
        .setThumbnail(ayarlar.Embed.iconURL)
        .setFooter({
            text: `ꜱᴀʏꜰᴀ・ #${page + 1}/${totalPages}`,
            iconURL: ayarlar.FiveM.avatarUrl
        });

    currentMembers.forEach((member, index) => {
        embed.addFields({
            name: `${startIdx + index + 1}. ᴏʏᴜɴᴄᴜ ᴀᴅɪ: \`${member.name}\``,
            value: [
                `<:fivem:1327600224419577886> ・ ᴏʏᴜɴᴄᴜ ɪᴅ'ꜱɪ: \`${member.gameId}\``,
                `<a:utility:1327600287367696515>・ ꜱᴛᴇᴀᴍ ʜᴇx: \`${member.steamId}\``,
                `<a:discorsel:1327600219017187380>・ ᴅɪꜱᴄᴏʀᴅ: <@${member.discord}>`
            ].join('\n'),
            inline: false
        });
    });

    return embed;
}

function createTeamPaginationButtons(currentPage, totalPages, sessionId) {
    const row = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`team_prev_${sessionId}`)
            .setLabel('◀️ ᴏɴᴄᴇᴋɪ ꜱᴀʏꜰᴀ')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0)
    );

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`team_next_${sessionId}`)
            .setLabel('ꜱᴏɴʀᴀᴋɪ ꜱᴀʏꜰᴀ ▶️')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentPage >= totalPages - 1)
    );

    return row;
}

module.exports.createTeamEmbed = createTeamEmbed;
module.exports.createTeamPaginationButtons = createTeamPaginationButtons;
