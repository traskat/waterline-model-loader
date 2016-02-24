'use strict';

const path = require('path');
const modelLoader = require('../lib/');
const memoryAdapter = require('sails-memory');
const singletonTest = require('./singleton');

const connections = {
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

let config = {
    modelsDir: path.join(__dirname, './models'),
    connections: connections
};

modelLoader.setup(config).then(models => {
    // do stuff with your Waterline models
    let ExampleModel = models.Example;

    console.log('example model loaded:', ExampleModel !== null);

    // Check if another file can access modelLoader.models after setup
    singletonTest();

    modelLoader.teardown().then(() => {
        console.log('tore down');
    }).catch(err => {
        console.log(err.stack)
    });
}).catch(err => {
    console.log(err.stack)
});
