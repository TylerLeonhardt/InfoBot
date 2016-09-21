var restify = require('restify');
var builder = require('botbuilder');
var data = require('./data');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

process.env.MICROSOFT_APP_ID = '94d53a41-1270-4300-a269-df272b6bee9e';
process.env.MICROSOFT_APP_PASSWORD = 'Qa1Bf0pgpJytd2AgtpsT0er';

// Create chat bot
var connector = new builder.ChatConnector({
    appId: '94d53a41-1270-4300-a269-df272b6bee9e',
    appPassword: 'Qa1Bf0pgpJytd2AgtpsT0er'
});

console.log(connector);

var bot = new builder.UniversalBot(connector);
var intents = new builder.IntentDialog();

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intents);

intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.matches(/^cmdlet/i, [
    function (session) {
        session.beginDialog('/cmdlet');
    },
    function (session) {
        session.send('What can I help you with, %s?', session.userData.name || 'stranger');
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
        session.send('What can I help you with?');
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/cmdlet', [
    function (session) {
        session.send('So you need a cmdlet, huh?');
        builder.Prompts.text(session, 'What kind of cmdlet?');
    },
    function (session, results) {
        session.send('ok so a %s cmdlet. Let me get that for you...', results.response);

        var hits = search(results.response);
        console.log(hits);
        hits.forEach(function (hit){
            var sendStr = "";
            hit.forEach(function (line){
                sendStr += line + '\n';
            });
            session.send(sendStr);
        });

        builder.Prompts.choice(session, 'Do you need another cmdlet?', ['yes', 'no']);
    },
    function (session, results) {
        console.log(results);
        if(results.response.entity === 'yes'){
            console.log('asdfasdf');
            session.beginDialog('/cmdlet');
        }
        else {
            session.endDialog();
        }
    }
]);

function search(value) {
    var hits = [];
    for (var key in data) {
        var regex = new RegExp(`^${key}`, 'i');
        if (regex.exec(value)) {

            hits.push(data[key]);
        }
    }
    return hits;
}