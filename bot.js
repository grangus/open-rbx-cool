const Discord = require('discord.js');
const dotenv = require('dotenv').config();

const bot = new Discord.Client();

let copypastaCooldownEnabled = false;

bot.on('ready', () => {
    console.log('Bot ready!');
    bot.user.setActivity('you type OwO', { type: 'WATCHING' })
});

bot.on('message', (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase().includes('illegal')) {
        message.reply("**OwO!** I've been programmed to tell you the definition of illegal!");
        let embed = new Discord.RichEmbed()
            .setTitle('Word definition!')
            .addField('Illegal', 'adjective')
            .addField('Definitions', 'contrary to or forbidden by law, especially criminal law.\na person present in a country without official authorization.');

        message.channel.send({ embed: embed });
    }

    if (message.content.toLowerCase().includes('help')) {
        message.reply('Go away! **òwó**');
    }

    if (message.content.toLowerCase().includes('anime bad')) {
        if(copypastaCooldownEnabled) return;
        
        message.reply(`Nani the frick did u just fucking say about animu, u smol bean bitch? watashi wa'll have u know watashi wa graduated top 0f my clasies in the navy seals, aaaaand~ watashi wa've been involved in numerouies secret raidies 0n al~quaeda, aaaaand~ watashi wa have 0ver 300 confirmed killies. Watashi wa am trained in gorilla warfare aaaaand~ watashi wa'm the top sniper in the entire uies armed forcies. U are nothing to ore wa but just another target. Watashi wa will wipe u the frick 0ut with pwecision the likies 0f which haies never been seen before 0n thiies earth, mark my fucking wordies. U think u can get away with saying that shitake mushrooms~ to ore wa 0ver the internet? think again, fucker. Aies we speak watashi wa am contacting my secret network 0f spiies acrosies the usa aaaaand~ your ip is being traced right now x3 soo u better pwepare for the storm, maggot. The storm that wipies 0ut the pathetic smol bean thing u call your life. U're fucking dead, kid. Watashi wa can be anywhere, anytime, aaaaand~ watashi wa can omae wa mou shindeiru in 0ver seven hundred ways, aaaaand~ that'ies just with my bare handies. Not 0nly am watashi wa extensively trained in nonarmed combat, but watashi wa have accesies to the entire arsenal 0f the nonited staties marine corpies aaaaand~ watashi wa will use it to its full extent to wipe your miserable asies 0ff the face 0f the continent, u smol bean shitake mushrooms~. If 0nly u could have known nani nonholy retribution your smol bean "clever" comment waies about to bring down upon u, maybe u would have held your fucking tongue. But u couldn't, u didn't, aaaaand~ now u're paying the price, u goddamn idiot. Watashi wa will shitake mushrooms~ fury all 0ver u aaaaand~ u will drown in it. U're fucking dead, kiddo.`);

        copypastaCooldownEnabled = true;

        setTimeout(() => {
            copypastaCooldownEnabled = false;
        }, 10000);
    }

    if (message.channel.type == 'text') {
        let filtered = message.mentions.members.filter(m => m.hasPermission('BAN_MEMBERS'));

        if (filtered.size > 0 && !message.member.hasPermission('BAN_MEMBERS')) {
            message.reply('**Oi!** Why are you pinging the staff?!');
        }
    }
});

bot.login(process.env.BOT_TOKEN);

process.on('uncaughtException', (error) => {
    console.log(error);
});

process.on('unhandledRejection', (error) => {
    console.log(error);
});