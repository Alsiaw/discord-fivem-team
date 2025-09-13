const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const ayarlar = require('../../../ayarlar.json');
const { fetchServerData, extractDiscordId } = require('./server-list.js');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('id')
        .setDescription('Player ID ile FiveM sunucusunda oyuncu arar')
        .addIntegerOption(option =>
            option.setName('oyuncu-id')
                .setDescription('Aranacak Player ID (sayı)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(9999)
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
            const playerId = interaction.options.getInteger('oyuncu-id');
            
            if (!playerId || playerId < 1) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Geçerli bir Player ID (sayı) belirtiniz. Örnek: `3453`*")]
                });
            }

            const serverData = await fetchServerData();
            
            if (!serverData || !serverData.Data) {
                return interaction.editReply({
                    embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Sunucu verilerine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.*")]
                });
            }

            const players = serverData.Data.players || [];
            const player = players.find(p => p.id === playerId);

            if (player) {
                const embed = createPlayerEmbed(player, serverData);
                await interaction.editReply({ embeds: [embed] });
            } else {
                const notFoundEmbed = new EmbedBuilder()
                    .setTitle('OYUNCU BİLGİSİ')
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Sonuç:*** *\`${playerId}\` ID'sine sahip oyuncu sunucuda bulunamadı.*`)
                    .setColor("#041f49")
                    .setTimestamp();

                await interaction.editReply({ embeds: [notFoundEmbed] });
            }

        } catch (error) {
            console.error('Player ID arama hatası:', error);
            await interaction.editReply({
                embeds: [Warn.setDescription("<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Komut işlenirken bir hata oluştu.*")]
            });
        }
    }
};

function createPlayerEmbed(player, serverData) {
    const discordId = extractDiscordId(player.identifiers.find(id => id.startsWith('discord:')));
    const steamId = formatSteamId(player.identifiers.find(id => id.startsWith('steam:')));

    const embed = new EmbedBuilder()
        .setTitle('OYUNCU BİLGİSİ')
        .setDescription([
            `<:fivem:1327600224419577886>・ᴏʏᴜɴᴄᴜ ᴀᴅɪ: \`${player.name}\``,
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
