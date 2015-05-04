"use strict";
module.exports = {
    _onEnter: function (client) {
        Math.random() > 0.5 ? client.game.resistanceScore++ : client.game.spyScore++;
        this.emit("gameStateChanged", client);
        
        if (client.game.resistanceScore == 3 || client.game.spyScore == 3) {
            client.timer = setTimeout(function () {
                this.handle(client, "endGame");
            }.bind(this), 2000);
        } else {
            this.handle(client, "nextState");
        }
    },
    
    nextState: "nominate",
    endGame: "end-game",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};