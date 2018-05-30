var restify = require('restify');
var builder = require('botbuilder');
var teams = require("botbuilder-teams");
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new teams.TeamsChatConnector({
    appId: "73fb43b3-f5c2-4296-9f02-d7f8a2aa716d",
    appPassword: "jzxmjNZNT93941%arZWE(=-" 
    // appId: process.env.MICROSOFT_APP_ID, 
    // appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// QuestionEndpoint https://msopenhack.azurewebsites.net/api/trivia/question
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
});

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

bot.dialog('question', [function (session, args, next) {
    var msg = new builder.Message(session);
    var conversationId = session.message.address.conversation.id;
    connector.fetchMembers(session.message.address.serviceUrl, conversationId, (err, result) => {
        if (err) {
            session.endDialog('There is some error');
        }
        else {
            console.log(result[0]["objectId"]);
            var options = {
                uri: "https://msopenhack.azurewebsites.net/api/trivia/question",
                headers: {
                  "Content-type": "application/json",
                },
                json: {
                  "id": result[0]["objectId"],
                }
              };
            request.post(options, function(error, response, body) {
                if (error) {
                    session.endDialog("Failed");
                } else {
                    session.dialogData.body = body;
                    builder.Prompts.choice(session, JSON.stringify(body["text"]), body  ["questionOptions"][0]["text"] + "|" +  body["questionOptions"][1]["text"] + "|" +  body["questionOptions"][2]["text"] + "|" +  body["questionOptions"][3]["text"]);
                }
            });
        }
    });
}, function(session, results) {
    let aId = results.response["index"];
    let q = session.dialogData.body;
    // let userId = session.dialogData.userId;
    var conversationId = session.message.address.conversation.id;
    connector.fetchMembers(session.message.address.serviceUrl, conversationId, (err, result) => {
        if (err) {
            session.endDialog('There is some error');
        }
        else {
            console.log(result[0]["objectId"]);
            answer(session, result[0]["objectId"], q["id"], q["questionOptions"][aId]["id"]);
        }
    });
}]).triggerAction({ matches: /^(question)/i });

function answer(session, userId, questionId, answerId) {
    let headers = {
        'Content-Type':'application/json'
    };

    let payload = {
        userId: userId,
        questionId: questionId,
        answerId: answerId
    };

    let options = {
        url: 'https://msopenhack.azurewebsites.net/api/trivia/answer',
        method: 'POST',
        headers: headers,
        json: true,
        form: payload
    };

    request(options, (error, response, body) => {
        let answer = body["correct"];
        console.log(body["correct"]);
        session.endDialog(answer ?"正解" : "はずれ");
    });
}
