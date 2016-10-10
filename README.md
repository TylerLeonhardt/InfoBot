# Info Bot

Turn any information into a chatbot!

Info Bot is a dead-simple way to turn any sort of information into an interactive chat bot. The premise is simple... turn information into a step-by-step conversation in which you drill down to the information you need.

#### Example

Inside of your nav.json is all the logic you would need for your personalized Info Bot!
##### nav.json
```json
{
    "programming languages": {
        "--help":"different types of programming languages",
        "object oriented":{
            "--help":"A language where the objects are the first class citizens",
            "Java":"lorem ipson salt",
            "C#":"lorem ipson salt"
        },
        "functional":{
            "Haskell":"lorem ipson salt",
            "Elixer":"lorem ipson salt"
        }
    },
    "memes":{
        "--help":"you already know what these are",
        "Harambe":"lorem ipson salt",
        "Pepe":"lorem ipson salt",
        "dat boi":"lorem ipson salt"
    }
}
```

When you start a conversation with your bot, it will take you through the options until you reach your answer! There's even support for adding a `--help` flag so that your users can understand the choices.

## Getting Started

They're a bit lengthy but the majority of it is just getting set up with the Bot Framework. It's not too difficult :)

1. Clone this repo
2. create a nav.json in the style shown above or rename the example.json to nav.json
3. `npm install`
4. Go to the [Bot Framework website](dev.botframework.com/) and create a new bot to grab your MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD (don't be afraid to put dummy data in for some of the fields)
5. Either put those in the app.js in place of `process.env.MICROSOFT_APP_ID` & `process.env.MICROSOFT_APP_PASSWORD` or set them as environment variables
6. run `npm start`
7. Using [ngrok](https://ngrok.com/), in another terminal, run `ngrok http 3978`
8. Find your ngrok https url (ex. `https://3ea1bed2.ngrok.io`)
9. Edit the details of your bot on the bot framework site and put that url in the messaging endpoint bot with `/api/messages` like so: `https://3ea1bed2.ngrok.io/api/messages`
10. Find your bot on Skype, or activate another channel like Telegram at chat with it!