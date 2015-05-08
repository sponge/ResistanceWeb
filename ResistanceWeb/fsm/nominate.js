"use strict";
module.exports = {
    _onEnter: function (client) {
        client.timer = setTimeout(function () {
            this.handle(client, "teamSelected");
        }.bind(this), 2000);
        
        client.game.turn++;
        this.emit("gameStateChanged", client);
        
        if (client.game.turn > 5) {
            this.handle(client, "outOfTurns");
        }
    },
    
    teamSelected: "vote",
    outOfTurns: "end-game",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};