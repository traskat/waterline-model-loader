'use strict';

const memoryAdapter = require('sails-memory');

module.exports = {
    adapters: {
        default: memoryAdapter,
        memory: memoryAdapter
    },

    connections: {
        memoryConnection: {
            adapter: 'memory'
        }
    },

    defaults: {
        connection: 'memoryConnection'
    }
};
