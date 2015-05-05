"use strict";
var _ = require('lodash');
var uuid = require('uuid');
var GameFlow = require('./fsm/gameflow.js');
var Users = require('./users.js');

module.exports = {
    list: {}, // list of rooms by room id. not using a map since i don't think lodash and other stuff quite work with them yet
    // FIXME: if the only reference on a weakmap value is in a no longer valid key, do we leak memory?
    // also do we even need this separate weakmap, i think it can be inside this.list now
    gameState: new WeakMap(), // weakmap keyed on this.list, value is what we're going to pass into machina.js
    
    // default room properties, frozen for your convenience
    defaults: Object.freeze({
        id: undefined,
        name: undefined,
        owner: undefined,
        curPlayers: 1,
        maxPlayers: 10,
        public: true,
    }),
    
    // create a room with options passed in from the caller
    // options can be edited later while in lobby mode
    createRoom: function (options) {
        var id = uuid.v4();
        if (!options.owner) {
            return false;
        }
        
        // build roominfo
        var roomInfo = _.defaults(options, this.defaults);
        roomInfo.players = [];
        roomInfo.spectators = [];
        options.id = id;
        // defaults to user's name, can't set in _.defaults
        if (!options.name) {
            roomInfo.name = options.owner + "'s Room";
        }

        this.list[id] = roomInfo;

        // start the game fsm into lobby state, store it into our 
        var newGame = GameFlow.createGame(roomInfo);
        this.gameState.set(roomInfo, newGame);
        console.log("Room created:", roomInfo);
        return roomInfo;
    },
    
    // join a room, update the player object and game fsm
    joinRoom: function (player, room) {
        var gs = this.gameState.get(room);
        if (player.room) {
            this.leaveRoom(player, player.room);
        }
        player.room = room.id
        player.socket.join(room.id);
        // the game FSM doesn't care about all the player state, just pass in what it needs to operate.
        // no references, only serializable bits
        GameFlow.joinPlayer(gs, { id: player.id, name: player.name });
        player.socket.emit("transition", { from: room.__machina__.gameFlow.priorState, to: room.__machina__.gameFlow.state });
    },
    
    // leave a room, update player object and game fsm
    leaveRoom: function (player, room_id) {
        var room = this.list[room_id];
        // FIXME: sometimes this happens on leave, not sure why.
        if (!room) {
            console.warn("ALERT! somehow got a bad room on leave!");
            return;
        }

        var gs = this.gameState.get(room);
        if (!gs) {
            console.warn("ALERT! somehow got a bad gamestate on leave!");
            return;
        }
        
        player.socket.leave(room.id);
        GameFlow.leavePlayer(gs, player.id);
        // FIXME: send something to the parting user to confirm part
        
        // FIXME: this can maybe be handled through an event from the FSM?
        if (room.curPlayers <= 0) {
            delete this.list[room_id];
        }
    },
 
    // filter through the list to avoid large replies + a circular reference/callstack too deep error
    getList: function () {
        return _.map(this.list, function (room) {
            return _.pick(room, ['id', 'name', 'curPlayers', 'maxPlayers', 'public']);
        });
    },

};