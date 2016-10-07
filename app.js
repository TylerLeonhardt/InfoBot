var restify = require('restify');
var builder = require('botbuilder');
var nav = require('./nav');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
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

intents.onDefault([
  function (session, args, next) {
    if (!session.userData.authed) {
      session.beginDialog('/auth');
    } else {
      next();
    }
  },
  function (session, results, next) {
    if (!session.userData.name) {
      session.beginDialog('/profile');
    } else {
      next();
    }
  },
  function (session, results) {
    if (!session.userData.authed || !session.userData.name) {
      return;
    }
    if(session.userData.state == undefined){
      session.userData.state = [];
      session.userData.stateObj = nav;
    }

    var keysArr = Object.keys(session.userData.stateObj);
    if (keysArr.indexOf(session.message.text) != -1){
      proceed(session);
    } else {
      var lowerCaseText = session.message.text.toLowerCase();
      if(lowerCaseText.indexOf('--help')){
        var val = getHelpValue(lowerCaseText);
        if(!val.length && session.userData.stateObj['--help']){
          session.send('%s: %s', val, session.userData.stateObj['--help']);
          return;
        }
        if(session.userData.stateObj[val]
          && session.userData.stateObj[val]['--help']){
          session.send('%s: %s', val, session.userData.stateObj[val]['--help']);
          return;
        }
        if(session.userData.stateObj[val]){
          session.send('%s: %s', val, session.userData.stateObj[val]);
          return;
        }
        session.send('I\'m not sure I understand... pick one of these:');
        session.send(keysArr.join(', '));
        session.send('If you\'re not sure what an item is, add  `--help` to your response for a description');
        return;
      }
      if(!session.userData.state.length){
        session.send('Hello %s!', session.userData.name);
        session.send('What can I help you with?:');
        session.send(keysArr.join(', '));
        return;
      }else{
        session.send('I\'m not sure I understand... pick one of these:');
        session.send(keysArr.join(', '));
        session.send('If you\'re not sure what an item is, add  `--help` to your response for a description');
      }
    }
  }
]);

// intents.matches(/^list/i, [
//     session => {
//         var keysArr = Object.keys(session.userData.stateObj);
//         session.send(keys.Arr.join('\n'));
//     }
// ])

bot.dialog('/profile', [
  function (session) {
    builder.Prompts.text(session, 'Hi! What is your name?');
  },
  function (session, results) {
    session.userData.name = results.response;
    session.endDialog();
  }
]);

bot.dialog('/auth', [
  function (session) {
    builder.Prompts.text(session, 'What is the password?');
  },
  function (session, results) {
    session.userData.authed = results.response == 'pass';
    if(session.userData.authed){
      session.send('Success! You can now ask for options!');
    }else{
      session.send('Try again.');
    }
    session.endDialog();
  }
]);


// Helpers

function proceed(session) {
  var answer = session.message.text;
  session.send('ok so "%s". Let me get that for you...', answer);
  if(typeof session.userData.stateObj[answer] === 'string'){
    session.send('Here you go!');
    session.send(session.userData.stateObj[answer]);
    session.send('Let me take you back to the main menu');
    session.userData.stateObj = nav;
    session.userData.state = [];
  }else{
    //prompt for more
    session.send('Now pick from this list:');
    session.send(Object.keys(session.userData.stateObj[answer]).join(', '));
    session.userData.state.push(answer);
    session.userData.stateObj = session.userData.stateObj[answer];
  }
}



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


function getHelpValue(fullText) {
  var textArr = fullText.split('\\s+');
  textArr = textArr.filter(text => text !== '--help');
  return textArr.join(' ');
}