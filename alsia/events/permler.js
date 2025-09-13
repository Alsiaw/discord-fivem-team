const { Collection, Events, EmbedBuilder, AuditLogEvent } = require("discord.js");
const ayarlar = require("../../ayarlar.json");
const moment = require("moment");
moment.locale("tr");
require("moment-duration-format");

const cooldown = new Collection();

async function fetchAuditLogWithRetry(guild, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            const fetchedLogs = await guild.fetchAuditLogs({ 
                limit: 5, 
                type: AuditLogEvent.MemberRoleUpdate 
            });
            return fetchedLogs.entries.first();
        } catch (error) {
            console.log(`Audit log fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) return null;
        }
    }
    return null;
}

module.exports = {
    name: Events.GuildMemberUpdate,
    başlat: async (oldMember, newMember) => {
        try {
            if (!oldMember || !newMember) return;
            if (oldMember.user.bot || newMember.user.bot) return;

            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            if (oldRoles.size === newRoles.size) return;

            const cooldownKey = `${newMember.guild.id}-${newMember.user.id}`;
            if (cooldown.has(cooldownKey)) return;
            cooldown.set(cooldownKey, true);
            setTimeout(() => cooldown.delete(cooldownKey), 3000);

            let auditLog = null;
            let executor = null;

            try {
                auditLog = await fetchAuditLogWithRetry(newMember.guild);
                if (auditLog && auditLog.target && auditLog.target.id === newMember.user.id) {
                    executor = auditLog.executor;
                }
            } catch (error) {
                console.log('Audit log fetch error:', error.message);
            }

            if (!executor) {
                executor = { tag: 'Bilinmeyen', toString: () => 'Bilinmeyen' };
            }

            if (oldRoles.size > newRoles.size) {
                const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
                const removedRole = removedRoles.first();

                if (!removedRole) return;

                try {
                    const APermLOG = newMember.guild.channels.cache.get(ayarlar.LOG.PermAlmaLOG);
                    if (!APermLOG) return;

                    const embed = new EmbedBuilder()
                        .setColor('#051b50')
                        .setAuthor({ 
                            name: `${newMember.user.username} - ROL ALINDI`, 
                            iconURL: newMember.user.avatarURL({ dynamic: true }) 
                        })
                        .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir kullanıcının* | \`${removedRole.name}\` | *isimli rolü bir yetkili tarafından* *alınmıştır!* \n\n <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${executor} | \n  <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴜʟʟᴀɴıᴄı:\` | ${newMember} | \n\n  <a:utility:1327600287367696515> ・ \`ᴀʟıɴᴀɴ ʀᴏʟ:\` | ${removedRole} |`)
                        .setFooter({ text: moment(Date.now()).format("LLL") })
                        .setThumbnail(newMember.user.avatarURL({ dynamic: true }));

                    await APermLOG.send({ embeds: [embed] }).catch(console.error);
                } catch (error) {
                    console.error('Rol alma log hatası:', error);
                }
            }

            if (oldRoles.size < newRoles.size) {
                const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
                const addedRole = addedRoles.first();

                if (!addedRole) return;

                try {
                    const VPermLOG = newMember.guild.channels.cache.get(ayarlar.LOG.PermVermeLOG);
                    if (!VPermLOG) return;

                    const embed = new EmbedBuilder()
                        .setColor('#051b50')
                        .setAuthor({ 
                            name: `${newMember.user.username} - ROL VERILDI`, 
                            iconURL: newMember.user.avatarURL({ dynamic: true }) 
                        })
                        .setDescription(`<a:unlemsel:1327600285597569066> ・ *Bir kullanıcıya* | \`${addedRole.name}\` | *isimli rol bir yetkili tarafından* *verilmiştir!* \n\n <:king_crown:1327600238407450697> ・ \`ʏᴇᴛᴋɪʟɪ:\` | ${executor} | \n  <a:5961darkbluetea:1327585257578561548> ・ \`ᴋᴜʟʟᴀɴıᴄı:\` | ${newMember} | \n\n  <a:utility:1327600287367696515> ・ \`ᴠᴇʀɪʟᴇɴ ʀᴏʟ:\` | ${addedRole} |`)
                        .setFooter({ text: moment(Date.now()).format("LLL") })
                        .setThumbnail(newMember.user.avatarURL({ dynamic: true }));

                    await VPermLOG.send({ embeds: [embed] }).catch(console.error);
                } catch (error) {
                    console.error('Rol verme log hatası:', error);
                }
            }

        } catch (error) {
            console.error('Permler event genel hatası:', error);
        }
    }
};
