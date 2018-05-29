var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector);

bot
    .on('messageReaction', (session) => session.send("You said: %s", session.message.text))
    .on('conversationUpdate', (msg) => {
        var payload = {
            teamId: msg.channelData.team.id,
            members: []
        };

        msg.members.forEach(member => {
            payload.members.add(member);
        });

        var headers = {
            'Content-Type':'application/json'
        };

        var options = {
            url: '/api/trivia/register',
            method: 'POST',
            headers: headers,
            json: true,
            form: payload
        };

        request(options, function (error, response, body) {
            // do nothing.
        });
    });
