"use strict";
module.exports = {
    list: new Map(), // list of all users indexed by user id
    bySocket: new WeakMap(), // weakmapping from socket.io socket -> user so we can find out who incoming messages are
    
    // only check right now is to ensure unique names
    isValidUser: function (name) {
        return !this.list.has(name);
    },
    
    // almost always in response to a new connection, create a new user and bind their socket
    // so we can find them later based on incoming packets
    createUser: function (options) {
        if (!options.socket || !options.id) {
            return false;
        }
        
        var userInfo = {
            id: options.id,
            name: options.name,
            socket: options.socket,
            room: null,
        };
        
        if (!options.name) {
            options.name = options.id;
        }

        this.list.set(options.id, userInfo);
        this.bySocket.set(options.socket, userInfo);
        return userInfo;
    },

    deleteUser: function (name) {
        this.list.delete(name);
    },
};