'use strict';

const Waterline = require('waterline');
const recursive = require('recursive-readdir');
const path = require('path');
const co = require('co');

function recursiveModules(dir) {
    return new Promise(function (resolve, reject) {
        recursive(dir, ['!*.js', '^\\.'], function (err, files) {
            if (err) {
                return reject(err);
            }

            return resolve(files);
        });
    });
}

function initializeOrm(modelNameMapping, orm, connections) {
    return new Promise((resolve, reject) => {
        return orm.initialize(connections, function (err, models) {
            if (err) {
                return reject(err);
            }

            let modelMapping = {};

            Object.keys(models.collections).forEach((collectionName) => {
                modelMapping[modelNameMapping[collectionName]] = models.collections[collectionName];
            });

            return resolve(modelMapping);
        });
    });
}

let loadModels = co.wrap(function* (modelsDir, orm, connections) {
    let modelFiles = yield recursiveModules(modelsDir);
    let defaultConnection = connections.defaults.connection;
    let modelNameMapping = {};

    for (let modelFile of modelFiles) {
        let modelName = path.basename(modelFile, '.js');
        let modelDefinition = require(modelFile);

        modelDefinition.identity = modelName.toLowerCase();
        modelDefinition.connection = modelDefinition.connection || defaultConnection;

        modelNameMapping[modelDefinition.identity] = modelName;

        let model = Waterline.Collection.extend(modelDefinition);

        orm.loadCollection(model);
    }

    return modelNameMapping;
});

module.exports = {
    _orm: null,
    models: null,
    setup: co.wrap(function* (config) {
        if (!config) {
            throw new Error('No configuration given');
        }

        if (!config.connections) {
            throw new Error('No "connections" configuration given');
        }

        if (!config.modelsDir) {
            throw new Error('No "modelsDir" configuration given');
        }

        this._orm = new Waterline();

        let modelNameMapping = yield loadModels(config.modelsDir, this._orm, config.connections);

        this.models = yield initializeOrm(modelNameMapping, this._orm, config.connections);

        return this.models;
    }),
    teardown: function () {
        if (!this._orm) {
            return Promise.reject(new Error('Waterline ORM is not setup'));
        }

        let adapterTeardowns = [];

        Object.keys(this._orm.connections).forEach((name) => {
            let adapter = this._orm.connections[name]._adapter;

            if (adapter.teardown) {
                adapterTeardowns.push(new Promise((resolve, reject) => {
                    adapter.teardown(null, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        return resolve();
                    });
                }));
            }
        });

        this._orm = null;
        this.models = null;

        return Promise.all(adapterTeardowns);
    }
};
