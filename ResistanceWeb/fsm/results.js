"use strict";
module.exports = {
    _onEnter: function (client) {
        Math.random() > 0.5 ? client.game.resistanceScore++ : client.game.spyScore++;
        this.emit("gameStateChanged", client);
        
        if (client.game.resistanceScore == 3 || client.game.spyScore == 3) {
            this.handle(client, "endGame");
        } else {
            client.timer = setTimeout(function () {
                this.handle(client, "continueGame");
            }.bind(this), 3000);
        }
    },
    
    continueGame: "nominate",
    endGame: "end-game",
    
    _onExit: function (client) {
        client.game.round++;
        client.game.turn = 0;
        clearTimeout(client.timer);
        this.emit("gameStateChanged", client);
    },
};