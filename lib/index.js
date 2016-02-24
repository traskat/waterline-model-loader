'use strict';

const Waterline = require('waterline');
const recursive = require('recursive-readdir');
const path = require('path');

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

let loadModels = function (modelsDir, orm, connections) {
    return recursiveModules(modelsDir).then(modelFiles => {
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
};

module.exports = {
    _orm: null,
    models: null,
    setup: function (config) {
        return new Promise((resolve, reject) => {
            if (!config) {
                return reject(new Error('No configuration given'));
            }

            if (!config.connections) {
                return reject(new Error('No "connections" configuration given'));
            }

            if (!config.modelsDir) {
                return reject(new Error('No "modelsDir" configuration given'));
            }

            this._orm = new Waterline();

            loadModels(config.modelsDir, this._orm, config.connections).then(modelNameMapping => {
                return initializeOrm(modelNameMapping, this._orm, config.connections);
            }).then(models => {
                this.models = models;

                return resolve(this.models);
            });
        });
    },
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
