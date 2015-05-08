"use strict";
module.exports = {
    _onEnter: function (client) {
        client.timer = setTimeout(function () {
            var nextState = Math.random() > 0.5 ? "votePassed" : "voteFailed";
            this.handle(client, nextState);
        }.bind(this), 4000);
    },
    
    votePassed: "mission",
    voteFailed: "nominate",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};