const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');
const axios = require('axios');
const puppeteer = require('puppeteer');
const moment = require('moment');
moment.locale('tr');

let cachedServerData = null;
let lastUpdateTime = 0;
let isUpdating = false;
const CACHE_DURATION = 900000;
const RETRY_DELAY = 2000; 
let updateInterval = null;

const paginationSessions = new Collection();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-list')
        .setDescription('FiveM sunucusundaki aktif oyuncuların listesini gösterir'),

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
            const serverData = await fetchServerData();
            
            if (!serverData || !serverData.Data) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Sunucu verilerine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.*")]
                });
            }

            const players = serverData.Data.players || [];
            const totalPages = Math.ceil(players.length / ayarlar.FiveM.playersPerPage);
            const sessionId = `${interaction.user.id}_${Date.now()}`;

            paginationSessions.set(sessionId, {
                serverData,
                currentPage: 0,
                totalPages,
                type: 'playerlist'
            });

            setTimeout(() => {
                paginationSessions.delete(sessionId);
            }, 900000);

            const embed = createMainEmbed(serverData, 0);
            const buttons = totalPages > 1 ? createPaginationButtons(0, totalPages, sessionId) : null;

            const replyOptions = { embeds: [embed] };
            if (buttons) replyOptions.components = [buttons];

            await interaction.editReply(replyOptions);

        } catch (error) {
            console.error('Server list hatası:', error);
            await interaction.editReply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Komut işlenirken bir hata oluştu.*")]
            });
        }
    }
};

async function fetchServerData() {
    if (cachedServerData && (Date.now() - lastUpdateTime) < CACHE_DURATION) {
        return cachedServerData;
    }

    if (isUpdating) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return cachedServerData || getLastKnownData();
    }

    return await updateCacheInBackground();
}

async function updateCacheInBackground() {
    if (isUpdating) return cachedServerData;
    isUpdating = true;

    let browser = null;
    
        try {
            browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://servers.fivem.net/',
            'Origin': 'https://servers.fivem.net'
        });

        await page.goto(ayarlar.FiveM.apiUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const content = await page.content();
        if (content.includes('cf_chl_opt') || content.includes('Just a moment') || content.includes('ray_id')) {
            await page.waitForTimeout(15000);
            await page.reload({ waitUntil: 'networkidle2' });
        }

        const jsonData = await page.evaluate(() => {
            try {
                const bodyText = document.body.innerText || document.body.textContent;
                return JSON.parse(bodyText);
            } catch (e) {
                return null;
            }
        });

        if (jsonData && jsonData.Data && jsonData.Data.players) {
            cachedServerData = jsonData;
            lastUpdateTime = Date.now();
        } else {
            cachedServerData = getLastKnownData();
        }

        await browser.close();

    } catch (error) {
        console.log(`⚠️ API hatası: ${error.message}`);
        
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.log('Browser kapatma hatası:', closeError.message);
            }
        }
        
        if (!cachedServerData) {
            cachedServerData = getLastKnownData();
        }
    } finally {
        isUpdating = false;
    }

    return cachedServerData;
}

function getLastKnownData() {
    return {
        "EndPoint": ayarlar.FiveM.serverId,
        "Data": {
            "clients": 0,
            "gametype": "Roleplay",
            "hostname": `^1 ${ayarlar.FiveM.serverName} ^0`,
            "mapname": "fivem-map-hipster",
            "sv_maxclients": 1000,
            "players": []
        }
    };
}

function createMainEmbed(serverData, page = 0) {
    const players = serverData.Data.players || [];
    const totalPages = Math.ceil(players.length / ayarlar.FiveM.playersPerPage);
    const startIndex = page * ayarlar.FiveM.playersPerPage;
    const endIndex = startIndex + ayarlar.FiveM.playersPerPage;
    const currentPlayers = players.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
        .setTitle('Sunucu Durumu')
        .setColor("#041f49")
        .setTimestamp()
        .setThumbnail(ayarlar.Embed.iconURL)
        .setFooter({ 
            text: `ꜱᴀʏꜰᴀ・ #${page + 1}/${totalPages}`,
            iconURL: ayarlar.FiveM.avatarUrl 
        });

    if (currentPlayers.length > 0) {
        currentPlayers.forEach((player, index) => {
            const discordId = extractDiscordId(player.identifiers.find(id => id.startsWith('discord:')));
            const steamId = formatSteamId(player.identifiers.find(id => id.startsWith('steam:')));
            
            embed.addFields({
                name: `${startIndex + index + 1}. ᴏʏᴜɴᴄᴜ ᴀᴅɪ: \`${player.name}\``,
                value: [
                    `<:fivem:1327600224419577886> ・ ᴏʏᴜɴᴄᴜ ɪᴅ'ꜱɪ: \`${player.id}\``,
                    `<a:utility:1327600287367696515>・ ꜱᴛᴇᴀᴍ ʜᴇx: \`${steamId}\``,
                    `<a:discorsel:1327600219017187380>・ ᴅɪꜱᴄᴏʀᴅ: <@${discordId}>`
                ].join('\n'),
                inline: false
            });
        });
    } else {
        embed.setDescription('Hiç oyuncu çevrimiçi değil.');
    }

    return embed;
}

function formatSteamId(steamId) {
    if (steamId && steamId.startsWith('steam:')) {
        return steamId;
    }
    return steamId || 'Bilinmiyor';
}

function createPaginationButtons(currentPage, totalPages, sessionId) {
    const row = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`prev_${sessionId}`)
            .setLabel('◀️ ᴏɴᴄᴇᴋɪ ꜱᴀʏꜰᴀ')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0)
    );

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`next_${sessionId}`)
            .setLabel('ꜱᴏɴʀᴀᴋɪ ꜱᴀʏꜰᴀ ▶️')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentPage >= totalPages - 1)
    );

    return row;
}

function extractDiscordId(discordId) {
    if (discordId && discordId.startsWith('discord:')) {
        return discordId.replace('discord:', '');
    }
    return discordId || 'Bilinmiyor';
}

module.exports.paginationSessions = paginationSessions;
module.exports.createPaginationButtons = createPaginationButtons;
module.exports.createMainEmbed = createMainEmbed;
module.exports.fetchServerData = fetchServerData;
module.exports.extractDiscordId = extractDiscordId;
