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
    if (keysArr.indexOf(session.message.text) != -1 && session.message.text != '--help'){
      proceed(session);
    } else {
      var lowerCaseText = session.message.text.toLowerCase();
      if(lowerCaseText.indexOf('--help') != -1){
        var val = getHelpValue(lowerCaseText);
        if(!val.length && session.userData.stateObj['--help']){
          session.send('%s: %s', session.userData.state[session.userData.state.length - 1], session.userData.stateObj['--help']);
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
        var str = 'I\'m not sure I understand... pick one of these:\n\n +++++++++ \n\n' +
          getArrayString(keysArr) +
          '\n\n +++++++++ \n\nIf you\'re not sure what an item is, add  `--help` to your response for a description';
        session.send(str);
        return;
      }
      if(!session.userData.state.length){
        var str = 'Hello ' + session.userData.name + '!\n\n' +
          'What can I help you with?:\n\n +++++++++ \n\n' +
          getArrayString(keysArr);
        session.send(str);
        return;
      }else{
        var str = 'I\'m not sure I understand... pick one of these:\n\n +++++++++ \n\n' +
          getArrayString(keysArr) +
          '\n\n +++++++++ \n\nIf you\'re not sure what an item is, add  `--help` to your response for a description';
        session.send(str);
      }
    }
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

bot.dialog('/auth', [
  function (session) {
    builder.Prompts.text(session, 'What is the password?');
  },
  function (session, results) {
    session.userData.authed = results.response == process.env.BOT_PASSWORD;
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
    var str = 'Here you go!\n\n +++++++++ \n\n' + session.userData.stateObj[answer] +
      '\n\n +++++++++ \n\nLet me take you back to the main menu';
    session.send(str);
    session.userData.stateObj = nav;
    session.userData.state = [];
  }else{
    //prompt for more
    var str = 'Now pick from this list:\n\n +++++++++ \n\n' +
      getKeysString(session.userData.stateObj[answer]);
    session.send(str);
    session.userData.state.push(answer);
    session.userData.stateObj = session.userData.stateObj[answer];
  }
}

function getKeysString(hash) {
  return Object.keys(hash).filter(function(x){ return x != '--help' }).join('\n\n');
}

function getArrayString(arr) {
  return arr.filter(function(x){ return x != '--help' }).join('\n\n');
}

function getHelpValue(fullText) {
  var textArr = fullText.split(/\s+/);
  textArr = textArr.filter(function(text){ text !== '--help' });
  return textArr.join('');
}