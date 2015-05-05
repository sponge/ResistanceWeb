"use strict"
var _ = require('lodash');
module.exports = {
    publicCommands: ["changeSetting", "startGame"],

    _onEnter: function (client) {
        // we're back in the lobby. move all spectators into client slots
        client.players = _.union(client.players, client.spectators);
        client.spectators = [];
        this.emit("gameStateChanged", client);
    },
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
    
    nextState: "select-characters",
    
    // this is the only state where players can join right into the game
    // in other states, they will go into spectator instead
    playerCanJoin: function (client) {
        return true;
    },
    
    startGame: function (client, command) {
        this.handle(client, "nextState");   
    },
    
    changeSetting: function (client, command, data) {
        console.log("not done yet");
        this.emit("gameStateChanged", client);
    },

    userCommand: function (client, command, data) {
        if (this.states[client.__machina__.gameFlow.state].publicCommands.indexOf(command) == -1) {
            return false;
        }

        this.handle(client, command, data);
    },
};
;