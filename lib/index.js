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

function loadModels(modelsDir, orm, connections) {
    return recursiveModules(modelsDir).then(modelFiles => {
        let defaultConnection = connections.defaults ? connections.defaults.connection : null;
        let modelNameMapping = {};

        for (let modelFile of modelFiles) {
            let modelName = path.basename(modelFile, '.js');
            let modelDefinition = require(modelFile);

            modelDefinition.identity = modelName.toLowerCase();

            if (defaultConnection) {
                modelDefinition.connection = modelDefinition.connection || defaultConnection;
            }

            modelNameMapping[modelDefinition.identity] = modelName;

            let model = Waterline.Collection.extend(modelDefinition);

            orm.loadCollection(model);
        }

        return modelNameMapping;
    });
};

let _orm = null;
let _models = null;

module.exports = {
    get _orm () {
        return _orm;
    },
    get models () {
        return _models;
    },
    setup: function (config) {
        if (!config) {
            return Promise.reject(new Error('No configuration given'));
        }

        if (!config.connections) {
            return Promise.reject(new Error('No "connections" configuration given'));
        }

        if (!config.modelsDir) {
            return Promise.reject(new Error('No "modelsDir" configuration given'));
        }

        let orm = new Waterline();

        return loadModels(config.modelsDir, orm, config.connections).then(modelNameMapping => {
            return initializeOrm(modelNameMapping, orm, config.connections);
        }).then(models => {
            _models = models;
            _orm = orm;

            return _models;
        });
    },
    teardown: function () {
        if (!_orm) {
            return Promise.reject(new Error('Waterline ORM is not setup'));
        }

        let adapterTeardowns = [];

        Object.keys(_orm.connections).forEach((name) => {
            let adapter = _orm.connections[name]._adapter;

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

        _orm = null;
        _models = null;

        return Promise.all(adapterTeardowns);
    }
};
