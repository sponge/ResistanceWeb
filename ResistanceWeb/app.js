"use strict";

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

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

GameFlow.on("transition", function (data) {
    io.in(data.client.id).emit("transition", { from: data.fromState, to: data.toState });
    console.log("%s just transitioned from %s to %s", data.client.id, data.fromState, data.toState);
});

GameFlow.on("gameStateChanged", function (client) {
    io.in(client.id).emit("gameStateChanged", client.game);
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
            Rooms.leaveRoom(userInfo.room);
        }
    });
    
    socket.on('create', function (room) {
        var userInfo = Users.bySocket.get(socket);
        var room = Rooms.createRoom({ owner: userInfo.id });
        Rooms.joinRoom(userInfo, room);
    });

    socket.on('join', function (room) {
        var room = Rooms.list[room];
        if (!room) {
            socket.emit("error", "No such room,");
            return;
        }

        Rooms.joinRoom(Users.bySocket.get(socket), room);
    });

    socket.on('list', function () {
        socket.emit("rooms", Rooms.getList());
    });

});
