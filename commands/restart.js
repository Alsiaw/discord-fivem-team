const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Botu yeniden başlatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Yönetici izni kontrolü
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: "❌ Bu komutu kullanmak için Yönetici iznine sahip olmanız gerekir.", 
                    ephemeral: true 
                });
            }

            await interaction.reply({ 
                content: "🔄 Bot yeniden başlatılıyor...", 
                ephemeral: false 
            });

            console.log(`🔄 Bot ${interaction.user.tag} tarafından yeniden başlatıldı.`);
            
            // 2 saniye bekle, sonra botu kapat (pm2 otomatik restart yapacak)
            setTimeout(() => {
                process.exit(0);
            }, 2000);

        } catch (error) {
            console.error('Restart komutu hatası:', error);
            await interaction.reply({ 
                content: "❌ Bot yeniden başlatılırken bir hata oluştu.", 
                ephemeral: true 
            });
        }
    }
};
