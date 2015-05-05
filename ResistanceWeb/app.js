"use strict";

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require('lodash');

var GameFlow = require('./gameflow.js');
var Rooms = require('./rooms.js');
var Users = require('./users.js');

app.listen(80);

function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
        
            res.writeHead(200, {
                'Content-Length': data.length,
                'Content-Type': 'text/html'
            });

            res.end(data);
        });
}


// game FSM has switched states, let clients know so they can update their UI
GameFlow.on("transition", function (data) {
    io.in(data.client.id).emit("transition", { from: data.fromState, to: data.toState });
    console.log("%s transitioned from %s to %s", data.client.id.substr(-8, 8), data.fromState, data.toState);
});

// the game FSM has sent an event that it has modified the game state that gets sent to clients
GameFlow.on("gameStateChanged", function (client) {
    var message = {};
    message.players = _.assign({}, client.players);
    message.spectators = _.assign({}, client.spectators);
    message.game = _.assign({}, client.game);
    message.settings = _.assign({}, client.settings);
    io.in(client.id).emit("gameStateChanged", message);
});

GameFlow.on("*", function (eventName, data) {
    //console.log("this thing happened:", eventName);
});

// authenticate the client (just check for unique username)
io.use(function (socket, next) {
    var userName = socket.request._query.name;
    if (!Users.isValidUser(userName)) {
        next(new Error('Name already in use.'));
        return;
    }
    next();
});

// user successfully connected
io.on('connection', function (socket) {
    var userName = socket.request._query.name;
    var userInfo = Users.createUser({ id: userName, name: userName, socket: socket });
    console.log("User connected: name: %s, socket id: %s", userName, socket.id);
    
    // send them the rooms list
    socket.emit("rooms", Rooms.getList());
    
    // disconnect handler (FIXME: needs to leave room to update state)
    socket.on('disconnect', function (err) {
        var userInfo = Users.bySocket.get(socket);
        Users.deleteUser(userInfo.name);
        if (userInfo.room) {
            Rooms.leaveRoom(userInfo, userInfo.room);
        }
    });
    
    // user wants to create a new room
    socket.on('create', function (room) {
        var userInfo = Users.bySocket.get(socket);
        var room = Rooms.createRoom({ owner: userInfo.id });
        Rooms.joinRoom(userInfo, room);
    });
    
    // user wants to join an existing room
    socket.on('join', function (room) {
        var room = Rooms.list[room];
        if (!room) {
            socket.emit("error", "No such room,");
            return;
        }

        Rooms.joinRoom(Users.bySocket.get(socket), room);
    });
    
    // user wants a list of rooms
    socket.on('list', function () {
        socket.emit("rooms", Rooms.getList());
    });

    socket.on('command', function (command, data) {
        var userInfo = Users.bySocket.get(socket);
        if (!userInfo.room) {
            socket.emit('error', 'Not in a room.');
        }
        
        var room = Rooms.list[userInfo.room];
        var gs = Rooms.gameState.get(room);
        
        GameFlow.handle(gs, 'userCommand', command, data);
    });
});
