"use strict";
var _ = require('lodash');
module.exports = {
    _onEnter: function (client) {
        // the game has just started. reset the volatile game state to default 
        client.game = _.extend({}, this.defaultGameState);
        
        var spiesLeft = client.settings.numSpies;
        var clientIndexes = [];
        for (var i = 0; i < client.players.length; i++) {
            clientIndexes.push(i);   
        }
        clientIndexes = _.shuffle(clientIndexes);
        for (var i = 0; i < clientIndexes.length; i++) {
            var team = spiesLeft-- > 0 ? 2 : 1;
            client.players[ clientIndexes[i] ].team = team;
        }
        
        this.emit("gameStateChanged", client);
        
        client.timer = setTimeout(function () {
            this.handle(client, "nextState");
        }.bind(this), 5000);
    },
    
    nextState: "reveal",
    
    _onExit: function (client) {
        clearTimeout(client.timer);
    },
};