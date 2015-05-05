"use strict"
var _ = require('lodash');
module.exports = {
    _onEnter: function (client) {
        // we're back in the lobby. move all spectators into client slots
        client.players = _.union(client.players, client.spectators);
        client.spectators = [];
        this.emit("gameStateChanged", client);
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 2000);

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
};
;