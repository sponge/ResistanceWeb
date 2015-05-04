"use strict";
var _ = require('lodash');
module.exports = {
    _onEnter: function (client) {
        client.game = _.extend({}, this.defaultGameState);
        this.emit("gameStateChanged", client);
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 2000);
    },
    
    nextState: "reveal",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};