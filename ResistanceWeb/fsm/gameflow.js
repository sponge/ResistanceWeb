"use strict";
var machina = require('machina');
var _ = require('lodash');

var defaultTeamSizes = Object.freeze({
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
    11: [3, 4, 4, 5, 5],
    12: [4, 5, 5, 6, 6],
});

module.exports = new machina.BehavioralFsm({
    namespace: "gameFlow",
    initialState: "lobby",
    
    states: {        
        'lobby': require('./lobby.js'),
        'select-characters': require('./selectcharacters.js'),
        'reveal': require('./reveal.js'),
        'nominate': require('./nominate.js'),
        'vote': require('./vote.js'),
        'mission': require('./mission.js'),
        'results': require('./results.js'),
        'end-game': require('./endgame.js'),
    },
    
    // if we don't have a single person connected, end the game
    checkEndGame: function (client) {
        if (client.players.length == 0) {
            this.transition(client, "end-game");
        }
    },
    
    defaultTeamSizes: defaultTeamSizes,
    
    getDefaultTeamSizes: function (count) {
        var capped = Math.max(5, Math.min(count, 12));
        return this.defaultTeamSizes[capped];
    },
    
    defaultSpyCounts: Object.freeze({
        5: 2,
        6: 2,
        7: 3,
        8: 3,
        9: 3,
        10: 4,
        11: 4,
        12: 5,
    }),
    
    getDefaultSpyCount: function (count) {
        var capped = Math.max(5, Math.min(count, 12));
        return this.defaultSpyCounts[capped];       
    },

    // game settings, variations
    defaultGameSettings: Object.freeze({
        numSpies: 2,
        blindSpies: false,
        trapper: false,
        reverser: false,
        teamSizes: defaultTeamSizes[5],
    }),
    
    // global game state. this will get reset to these values every time the match starts
    defaultGameState: Object.freeze({
        round: 0,
        turn: 0,
        resistanceScore: 0,
        spyScore: 0,
    }),
    
    // default state for every connected client. these do NOT get reset, so the game fsm
    // should make sure values are reset in the various state exits
    defaultPlayerState: Object.freeze({
        name: undefined,
        team: null,
        currentVote: 0,
    }),
    
    // factory function, takes in room settings, and starts up the room into the lobby
    createGame: function (roomInfo) {
        roomInfo.settings = _.defaults({}, this.defaultGameSettings);
        roomInfo.game = _.assign({}, this.defaultGameState);
        this.transition(roomInfo, "lobby");
        return roomInfo;
    },
    
    // join a player into the match
    joinPlayer: function (client, user) {
        var player = _.defaults(user, this.defaultPlayerState);
        // the player can usually only join a match inside the lobby
        // let them watch if they come in during the game
        var canJoin = this.handle(client, 'playerCanJoin');
        if (canJoin) {
            client.players.push(player);
        } else {
            client.spectators.push(player);
        }
        // update current players count for room list and other client uses
        client.curPlayers = client.players.length + client.spectators.length;
        this.handle(client, canJoin ? "playerJoined" : "spectatorJoined", player);
        this.emit("gameStateChanged", client);
    },
    
    // remove a player from the match
    leavePlayer: function (client, user_id) {
        // remove them from the players/spectators list
        // FIXME: we should mark players as inactive, and let the room owner kick them
        // split this function up into disconnectPlayer and leavePlayer
        var oldPlayerCount = client.players.length;
        client.players = _.reject(client.players, { 'id': user_id });
        client.spectators = _.reject(client.spectators, { 'id': user_id });
        // update current players count for room list and other client uses
        client.curPlayers = client.players.length + client.spectators.length;
        this.handle(client, oldPlayerCount != client.players.length ? "playerLeft" : "spectatorLeft");
        this.emit("gameStateChanged", client);
        // if a player has left, the match may be empty
        this.checkEndGame(client);
    },
});