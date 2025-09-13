const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');
const { fetchServerData, extractDiscordId, paginationSessions } = require('./server-list.js');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('player')
        .setDescription('Oyuncu adı ile FiveM sunucusunda gelişmiş arama yapar')
        .addStringOption(option =>
            option.setName('oyuncu-adi')
                .setDescription('Aranacak oyuncu adı (kısmi isim de kabul edilir)')
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(50)
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
            const playerNameInput = interaction.options.getString('oyuncu-adi');
            
            if (!playerNameInput || playerNameInput.trim() === '') {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir oyuncu adı belirtiniz. Örnek: `glush` veya `lunatic`*")]
                });
            }
            
            const searchTerm = playerNameInput.trim().toLowerCase();

            const serverData = await fetchServerData();
            
            if (!serverData || !serverData.Data) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Sunucu verilerine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.*")]
                });
            }

            const players = serverData.Data.players || [];
            const searchResults = performAdvancedPlayerSearch(searchTerm, players);

            if (searchResults.allMatches.length === 1) {
                const embed = createDetailedPlayerEmbed(searchResults.allMatches[0], serverData);
                await interaction.editReply({ embeds: [embed] });
                
            } else if (searchResults.allMatches.length > 1) {
                const playersPerPage = 15;
                const totalPages = Math.ceil(searchResults.allMatches.length / playersPerPage);

                if (searchResults.allMatches.length <= playersPerPage) {
                    const embed = createSearchResultEmbed(playerNameInput, searchResults.allMatches, serverData, 0);
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    const sessionId = `search_${interaction.user.id}_${Date.now()}`;
                    
                    const searchSession = {
                        searchResults: searchResults.allMatches,
                        searchTerm: playerNameInput,
                        serverData: serverData,
                        currentPage: 0,
                        totalPages: totalPages,
                        type: 'search',
                        createdAt: Date.now(),
                        userId: interaction.user.id
                    };
                    
                    paginationSessions.set(sessionId, searchSession);
                    
                    setTimeout(() => {
                        paginationSessions.delete(sessionId);
                    }, 900000);
                    
                    const embed = createSearchResultEmbed(playerNameInput, searchResults.allMatches, serverData, 0);
                    const buttons = createSearchPaginationButtons(0, totalPages, sessionId);
                    await interaction.editReply({ embeds: [embed], components: [buttons] });
                }
                
            } else {
                const notFoundEmbed = new EmbedBuilder()
                    .setTitle('OYUNCU BİLGİSİ')
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Sonuç:*** *"**${playerNameInput}**" isimli oyuncu sunucuda bulunamadı.*`)
                    .setColor("#041f49")
                    .setTimestamp()
                    .setThumbnail(ayarlar.Embed.iconURL);

                await interaction.editReply({ embeds: [notFoundEmbed] });
            }

        } catch (error) {
            console.error('Oyuncu arama hatası:', error);
            await interaction.editReply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Komut işlenirken bir hata oluştu.*")]
            });
        }
    }
};

function performAdvancedPlayerSearch(searchTerm, players) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const exactMatches = [];
    const startsWithMatches = [];
    const containsMatches = [];
    const partialMatches = [];
    
    players.forEach(player => {
        if (!player.name) return;
        
        const playerNameLower = player.name.toLowerCase();
        
        if (playerNameLower === lowerSearchTerm) {
            exactMatches.push(player);
        } else if (playerNameLower.startsWith(lowerSearchTerm)) {
            startsWithMatches.push(player);
        } else if (playerNameLower.includes(lowerSearchTerm)) {
            containsMatches.push(player);
        } else {
            const searchWords = lowerSearchTerm.split(' ');
            const playerWords = playerNameLower.split(' ');
            
            let hasMatch = false;
            for (const searchWord of searchWords) {
                for (const playerWord of playerWords) {
                    if (playerWord.includes(searchWord) || searchWord.includes(playerWord)) {
                        hasMatch = true;
                        break;
                    }
                }
                if (hasMatch) break;
            }
            
            if (hasMatch) {
                partialMatches.push(player);
            }
        }
    });
    
    const allMatches = [...exactMatches, ...startsWithMatches, ...containsMatches, ...partialMatches];
    
    return {
        exactMatches,
        startsWithMatches,
        containsMatches,
        partialMatches,
        allMatches
    };
}

function createSearchResultEmbed(searchTerm, searchResults, serverData, page = 0) {
    const playersPerPage = 15;
    const startIndex = page * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    const currentResults = searchResults.slice(startIndex, endIndex);
    const totalPages = Math.ceil(searchResults.length / playersPerPage);

    let playerList = '';
    currentResults.forEach((player, index) => {
        playerList += `**${startIndex + index + 1}.** <:fivem:1327600224419577886>・\`${player.name}\` - ID:\`${player.id}\`\n`;
    });

    const embed = new EmbedBuilder()
        .setTitle('OYUNCU ARAMA SONUÇLARI')
        .setDescription(playerList || 'Sonuç bulunamadı.')
        .setColor("#041f49")
        .setTimestamp()
        .setThumbnail(ayarlar.Embed.iconURL)
        .setFooter({ 
            text: `ꜱᴀʏꜰᴀ・ #${page + 1}/${totalPages}`,
            iconURL: ayarlar.FiveM.avatarUrl 
        });

    return embed;
}

function createSearchPaginationButtons(currentPage, totalPages, sessionId) {
    const row = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`search_prev_${sessionId}`)
            .setLabel('◀️ Önceki Sayfa')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0)
    );

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`search_next_${sessionId}`)
            .setLabel('Sonraki Sayfa ▶️')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentPage >= totalPages - 1)
    );

    return row;
}

function createDetailedPlayerEmbed(player, serverData) {
    const discordId = extractDiscordId(player.identifiers.find(id => id.startsWith('discord:')));
    const steamId = formatSteamId(player.identifiers.find(id => id.startsWith('steam:')));

    const embed = new EmbedBuilder()
        .setTitle('OYUNCU BİLGİSİ')
        .setDescription([
            `<:fivem:1327600224419577886>・ᴏʏᴜɴᴄᴜ ᴀᴅɪ: \`${player.name}\``,
            `<a:utility:1327600287367696515>・ᴏʏᴜɴᴄᴜ ɪᴅ: \`${player.id}\``,
            `<:claim:1327586348244140082>・ꜱᴛᴇᴀᴍ ʜᴇx: \`${steamId}\``,
            `<a:discorsel:1327600219017187380>・ᴅɪꜱᴄᴏʀᴅ: <@${discordId}>`
        ].join('\n'))
        .setColor("#041f49")
        .setTimestamp()
        .setThumbnail(ayarlar.Embed.iconURL);

    return embed;
}

function formatSteamId(steamId) {
    if (steamId && steamId.startsWith('steam:')) {
        return steamId.replace('steam:', '');
    }
    return steamId || 'Bilinmiyor';
}

module.exports.createSearchPaginationButtons = createSearchPaginationButtons;
module.exports.createSearchResultEmbed = createSearchResultEmbed;
