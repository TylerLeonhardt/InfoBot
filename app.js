const restify = require('restify');
const builder = require('botbuilder');
const chokidar = require('chokidar');
let nav = require('./nav');

// Initialize watcher.
const watcher = chokidar.watch('nav.json', {
  persistent: true,
});

watcher.on('change', () => {
  delete require.cache[require.resolve('./nav')];
  /* eslint-disable */
  nav = require('./nav');
  console.log('Nav reloaded.');
  /* eslint-enable */
});

//= ========================================================
// Bot Setup
//= ========================================================

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {});

// Create chat bot
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

const bot = new builder.UniversalBot(connector);
const intents = new builder.IntentDialog();

server.post('/api/messages', connector.listen());

// eslint-disable-next-line
console.log('InfoBot started.');

//= ========================================================
// Helpers
//= ========================================================

function getArrayString(arr) {
  return '*' + arr.filter((x) => x !== '--help').join('\n\n*');
}

function getHelpValue(fullText) {
  let textArr = fullText.split(/[ \t\n\x0B\f\r]/);
  textArr = textArr.filter((text) => text !== '--help' && text !== '');
  return textArr.join('');
}

function reset(session) {
  session.userData.stateObj = nav;
  session.userData.state = [];
  const str = 'Taking you back to the main menu... pick one of these:\n\n +++++++++ \n\n' +
    getArrayString(Object.keys(session.userData.stateObj)) +
    '\n\n +++++++++ \n\nIf you\'re not sure what an item is, ' +
    'add  `--help` to your response for a description\n\n' +
    'If you ever need to start over, just say "start over" or "reset"';
  session.send(str);
}

function proceed(session) {
  const answer = session.message.text;
  session.send('ok so "%s". Let me get that for you...', answer);
  if (typeof session.userData.stateObj[answer] === 'string') {
    const str = 'Here you go!\n\n +++++++++ \n\n' + session.userData.stateObj[answer] +
      '\n\n +++++++++';
    session.send(str);
    reset(session);
  } else if (Array.isArray(session.userData.stateObj[answer])) {
    const str = 'Here you go!\n\n ```\n\n' + session.userData.stateObj[answer].join('\n\n') +
      '\n\n```';
    session.send(str);
    reset(session);
  } else {
    // prompt for more
    const str = 'Now pick from this list:\n\n +++++++++ \n\n' +
      getArrayString(Object.keys(session.userData.stateObj[answer]));
    session.send(str);
    session.userData.state.push(answer);
    session.userData.stateObj = session.userData.stateObj[answer];
  }
}

//= ========================================================
// Bots Dialogs
//= ========================================================

bot.dialog('/', intents);

intents.matches(/^change name/i, [
  (session) => {
    session.beginDialog('/profile');
  },
  (session) => {
    session.send('Ok... Changed your name to %s', session.userData.name);
  },
]);

intents.matches(/(start over|reset|quit)/ig, [
  (session) => {
    reset(session)
  }
]);

intents.onDefault([
  (session, args, next) => {
    if (!session.userData.authed) {
      session.beginDialog('/auth');
    } else {
      next();
    }
  },
  (session, results, next) => {
    if (!session.userData.name) {
      session.beginDialog('/profile');
    } else {
      next();
    }
  },
  (session) => {
    if (!session.userData.authed || !session.userData.name) {
      return;
    }
    if (session.userData.state === undefined) {
      session.userData.state = [];
      session.userData.stateObj = nav;
    }

    const keysArr = Object.keys(session.userData.stateObj);
    if (keysArr.indexOf(session.message.text) !== -1 && session.message.text !== '--help') {
      proceed(session);
    } else {
      const lowerCaseText = session.message.text.toLowerCase();
      if (lowerCaseText.indexOf('--help') !== -1) {
        const val = getHelpValue(lowerCaseText);
        if (!val.length && session.userData.stateObj['--help']) {
          session.send('%s: %s', session.userData.state[session.userData.state.length - 1],
            session.userData.stateObj['--help']);
          return;
        }
        if (session.userData.stateObj[val]
          && session.userData.stateObj[val]['--help']) {
          session.send('%s: %s', val, session.userData.stateObj[val]['--help']);
          return;
        }
        if (session.userData.stateObj[val]) {
          session.send('%s: %s', val, session.userData.stateObj[val]);
          return;
        }
        const str = 'I\'m not sure I understand... pick one of these:\n\n +++++++++ \n\n' +
          getArrayString(keysArr) +
          '\n\n +++++++++ \n\nIf you\'re not sure what an item is, ' +
          'add  `--help` to your response for a description';
        session.send(str);
        return;
      }
      if (!session.userData.state.length) {
        const str = 'Hello ' + session.userData.name + '!\n\n' +
          'What can I help you with?:\n\n +++++++++ \n\n' +
          getArrayString(keysArr);
        session.send(str);
        return;
      }
      const str = 'I\'m not sure I understand... pick one of these:\n\n +++++++++ \n\n' +
        getArrayString(keysArr) +
        '\n\n +++++++++ \n\nIf you\'re not sure what an item is, ' +
        'add  `--help` to your response for a description';
      session.send(str);
    }
  },
]);

bot.dialog('/profile', [
  (session) => {
    builder.Prompts.text(session, 'Hi! What is your name?');
  },
  (session, results) => {
    session.userData.name = results.response;
    session.endDialog();
  },
]);

bot.dialog('/auth', [
  (session) => {
    builder.Prompts.text(session, 'What is the password?');
  },
  (session, results) => {
    session.userData.authed = results.response === process.env.BOT_PASSWORD;
    if (session.userData.authed) {
      session.send('Success! You can now ask for options!');
    } else {
      session.send('Try again.');
    }
    session.endDialog();
  },
]);
