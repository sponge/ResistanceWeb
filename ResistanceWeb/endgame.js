"use strict";
module.exports = {
    _onEnter: function (client) {
        if (client.players.length == 0 && client.spectators.length == 0) {
            return;
        }
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 2000);
    },
    
    nextState: "lobby",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};