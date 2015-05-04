"use strict";
module.exports = {
    list: new Map(),
    bySocket: new WeakMap(),

    isValidUser: function (name) {
        return !this.list.has(name);
    },

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

        this.list.set(options.name, userInfo);
        this.bySocket.set(options.socket, userInfo);
        return userInfo;
    },

    deleteUser: function (name) {
        this.list.delete(name);
    },
};