# Info Bot

Turn any information into a chatbot!

Info Bot is a dead-simple way to turn any sort of information into an interactive chat bot. The premise is simple... turn information into a step-by-step conversation in which you drill down to the information you need.

#### Example

Inside of your nav.json is all the logic you would need for your personalized Info Bot! 
##### nav.json
```json
{
    "option1": {
        "option3":{
            "option7":"wow1",
            "option8":"wow2"
        },
        "option4":{
            "option9":"wow3",
            "option10":"wow4",
            "option11":"wow7"  
        }
    },
    "option2":{
        "option5":"wow5",
        "option6":"wow6"
    }
}
```

When you start a conversation with your bot, it will take you through the options until you reach your answer!