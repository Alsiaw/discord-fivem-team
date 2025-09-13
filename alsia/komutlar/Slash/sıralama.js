const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const canvafy = require('canvafy');
const ayarlar = require('../../../ayarlar.json');
const db = require('../../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sıralama')
        .setDescription('Ot miktarına göre sıralama gösterir'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const Warn = new EmbedBuilder()
                .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
                .setColor("#490404")
                .setTimestamp();

            const roles = [ayarlar.Yetkiler.yetkiliRolId];

            if (!interaction.member.roles.cache.find(r => roles.includes(r.id))) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor("#490404")
                    .setTimestamp()
                    .setDescription(`<a:unlemsel:1327600285597569066> ・ ***Uyarı:*** *Yetersiz Veya Geçersiz Yetki.*`);
                return interaction.editReply({ embeds: [noPermEmbed] });
            }

            const allData = await db.getAllOt();
            const sortedData = allData.sort((a, b) => b.miktar - a.miktar).filter(data => data.miktar > 0);

            if (sortedData.length === 0) {
                return interaction.editReply({
                    content: 'Henüz hiç ot verisi bulunmuyor!',
                    ephemeral: true
                });
            }

            const itemsPerPage = 5;
            const totalPages = Math.ceil(sortedData.length / itemsPerPage);
            let currentPage = 0;

            const showPage = async (page) => {
                const start = page * itemsPerPage;
                const end = Math.min(start + itemsPerPage, sortedData.length);
                const pageData = sortedData.slice(start, end);

                const usersData = [];

                for (let i = 0; i < pageData.length; i++) {
                    const userData = pageData[i];
                    try {
                        const user = await interaction.client.users.fetch(userData.userId);
                        usersData.push({
                            top: start + i + 1,
                            avatar: user.displayAvatarURL({ extension: 'png', size: 512 }),
                            tag: user.tag,
                            score: userData.miktar
                        });
                    } catch (error) {
                        console.error(`Kullanıcı bilgisi alınamadı: ${userData.userId}`, error);
                        usersData.push({
                            top: start + i + 1,
                            avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
                            tag: "Bilinmeyen Kullanıcı",
                            score: userData.miktar
                        });
                    }
                }

                for (let i = usersData.length; i < 5; i++) {
                    usersData.push({
                        top: start + i + 1,
                        avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
                        tag: "",
                        score: 0
                    });
                }

                const top = await new canvafy.Top()
                    .setOpacity(0.6)
                    .setScoreMessage("Ot Miktarı:")
                    .setabbreviateNumber(false)
                    .setBackground("image", ayarlar.Resimler.moderasyonURL)
                    .setColors({
                        box: '#212121',
                        username: '#ffffff',
                        score: '#ffffff',
                        firstRank: '#f7c716',
                        secondRank: '#9e9e9e',
                        thirdRank: '#94610f'
                    })
                    .setUsersData(usersData)
                    .build();

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ot_prev')
                            .setLabel('Önceki Sayfa')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⬅️')
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('ot_next')
                            .setLabel('Sonraki Sayfa')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➡️')
                            .setDisabled(page === totalPages - 1 || totalPages === 1)
                    );

                return {
                    files: [{
                        attachment: top,
                        name: `alsia-ot-siralama-${interaction.user.id}-${page}.png`
                    }],
                    components: totalPages > 1 ? [buttons] : []
                };
            };

            const response = await interaction.editReply(await showPage(currentPage));

            if (totalPages <= 1) return;

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: 'Bu butonları yalnızca komutu kullanan kişi kullanabilir.',
                        ephemeral: true
                    });
                }

                await i.deferUpdate();

                if (i.customId === 'ot_prev') {
                    currentPage--;
                } else if (i.customId === 'ot_next') {
                    currentPage++;
                }

                await interaction.editReply(await showPage(currentPage));
            });

            collector.on('end', async () => {
                const disabledButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ot_prev')
                            .setLabel('Önceki Sayfa')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⬅️')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('ot_next')
                            .setLabel('Sonraki Sayfa')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➡️')
                            .setDisabled(true)
                    );

                await interaction.editReply({ components: [disabledButtons] }).catch(() => {});
            });

        } catch (error) {
            console.error('Ot sıralaması oluşturulurken hata:', error);
            await interaction.editReply('Sıralama oluşturulurken bir hata oluştu.');
        }
    }
};
