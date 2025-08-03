const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');
const ayarlar = require('./ayarlar.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Slash komutları ve Context Menu komutları yükleniyor...');

        await rest.put(
            Routes.applicationGuildCommands(ayarlar.Bot.botID, ayarlar.Bot.guildId),
            { body: commands },
        );

        console.log('Tüm komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error(error);
    }
})();
