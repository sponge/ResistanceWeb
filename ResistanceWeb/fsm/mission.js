﻿"use strict";
module.exports = {
    _onEnter: function (client) {
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 2000);
    },
    
    nextState: "results",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};