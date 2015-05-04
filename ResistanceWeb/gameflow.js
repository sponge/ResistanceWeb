"use strict";
var machina = require('machina');
var _ = require('lodash');

module.exports = new machina.BehavioralFsm({
    namespace: "game-flow",
    initialState: "lobby",
    
    states: {
        'uninitialized': {
            "*": function (client) {
                this.deferUntilTransition(client);
                this.transition(client, "lobby");
            },
            'joinPlayer': function (client) {
                console.log('joined player');
            },
        },
        
        'lobby': require('./lobby.js'),
        'select-characters': require('./selectcharacters.js'),
        'reveal': require('./reveal.js'),
        'nominate': require('./nominate.js'),
        'vote': require('./vote.js'),
        'mission': require('./mission.js'),
        'results': require('./results.js'),
        'end-game': require('./endgame.js'),
    },
    
    reset: function (client) {
        this.handle(client, "_reset");
    },
    
    defaultGameState: {
        round: 0,
        resistanceScore: 0,
        spyScore: 0,
        players: [],
        spectators: []
    },
    
    defaultPlayerState: {
        name: undefined,
        team: null,
        currentVote: 0,
    },
    
    createGame: function (roomInfo) {
        roomInfo.game = _.assign({}, this.defaultGameState);
        this.transition(roomInfo, "lobby");
        return roomInfo;
    },

    joinPlayer: function (client, user) {
        var player = _.defaults(user, this.defaultPlayerState);
        if (this.handle(client, 'playerCanJoin')) {
            client.game.players.push(player);
        } else {
            client.game.spectators.push(player);
        }
        this.emit("playerJoined", player);
        this.emit("gameStateChanged", client);
    }
});