"use strict";
var _ = require('lodash');
var uuid = require('uuid');
var GameFlow = require('./gameflow.js');
var Users = require('./users.js');

module.exports = {
    list: {},
    gameState: new WeakMap(),
    
    defaults: {
        id: undefined,
        name: undefined,
        owner: undefined,
        curPlayers: 1,
        maxPlayers: 10,
        public: true,
    },
    
    createRoom: function (options) {
        var id = uuid.v4();
        if (!options.owner) {
            return false;
        }

        var roomInfo = _.defaults(options, this.defaults);
        roomInfo.players = [];
        roomInfo.spectators = [];
        options.id = id;
        if (!options.name) {
            roomInfo.name = options.owner + "'s Room";
        }

        this.list[id] = roomInfo;
        var newGame = GameFlow.createGame(roomInfo);
        this.gameState.set(roomInfo, newGame);
        console.log("Room created:", roomInfo);
        return roomInfo;
    },
    
    joinRoom: function (player, room) {
        var gs = this.gameState.get(room);
        if (player.room) {
            this.leaveRoom(player, player.room);
        }
        player.room = room.id
        player.socket.join(room.id);
        // the FSM doesn't care about all the player state, just pass in what it needs to operate.
        // no references, only serializable bits
        GameFlow.joinPlayer(gs, { id: player.id, name: player.name });
    },

    leaveRoom: function (player, room_id) {
        var room = this.list[room_id];
        var gs = this.gameState.get(room);

        if (!room || !gs) {
            return;
        }
        
        player.socket.leave(room.id);
        GameFlow.leavePlayer(gs, player.id);
        // FIXME: send something to the parting user to confirm part

        room.curPlayers--;
        if (room.curPlayers <= 0) {
            GameFlow.endGame(gs);
            delete this.list[room_id];
        }
    },
 

    getList: function () {
        return _.map(this.list, function (room) {
            return _.pick(room, ['id', 'name', 'curPlayers', 'maxPlayers', 'public']);
        });
    },

};