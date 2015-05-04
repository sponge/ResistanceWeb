"use strict"
var _ = require('lodash');
module.exports = {
    _onEnter: function (client) {
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 2000);
    },
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
    
    nextState: "select-characters",
    playerCanJoin: function (client) {
        return true;
    },
};
;