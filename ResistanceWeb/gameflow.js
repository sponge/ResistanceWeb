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
    
    checkEndGame: function (client) {
        if (client.players.length == 0) {
            this.transition(client, "end-game");
        }
    },
    
    defaultGameState: {
        round: 0,
        resistanceScore: 0,
        spyScore: 0,
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
            client.players.push(player);
        } else {
            client.spectators.push(player);
        }
        this.emit("playerJoined", player);
        this.emit("gameStateChanged", client);
    },

    leavePlayer: function (client, user_id) {
        client.players = _.reject(client.players, { 'id': user_id });
        client.spectators = _.reject(client.spectators, { 'id': user_id });
        this.emit("gameStateChanged", client);
    }
});