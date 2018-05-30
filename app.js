var restify = require('restify');
var builder = require('botbuilder');
var teams = require('botbuilder-teams');
const request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new teams.TeamsChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, (session) => session.send("You said: %s", session.message.text));

bot.on('conversationUpdate', (message) => {
        var conversationId = message.address.conversation.id;
        connector.fetchMembers(message.address.serviceUrl, conversationId, (err, result) => {
            if (err) {
                console.err("error");
            } else {
                let payload = {
                    "teamId": teams.TeamsMessage.getConversationUpdateData(message).team.id,
                    "members": result.map((m) => {
                        return {
                            "id": m.id,
                            "name": m.name,
                        };
                    }),
                };

                // オプションを定義
                let options = {
                    url: 'https://msopenhack.azurewebsites.net/api/trivia/register',
                    method: 'POST',
                    headers: {
                        'Content-Type':'application/json'
                    },
                    json: true,
                    form: payload,
                };

                // リクエスト送信
                request.post(options, (err, res, body) => {
                    if (err) {
                        console.log("error");
                    } else {
                        console.log(body);
                    }
                });
            }
        });
    });
