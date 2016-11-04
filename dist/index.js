import Waterline from 'waterline';
import recursive from 'recursive-readdir';
import path from 'path';

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

            const modelMapping = {};

            Object.keys(models.collections).forEach(collectionName => {
                modelMapping[modelNameMapping[collectionName]] = models.collections[collectionName];
            });

            return resolve(modelMapping);
        });
    });
}

function loadModels(modelsDir, orm, connections) {
    const defaultConnection = connections.defaults ? connections.defaults.connection : null;
    const modelNameMapping = {};

    if (typeof modelsDir === 'string') {
        return recursiveModules(modelsDir).then(modelFiles => {
            for (const modelFile of modelFiles) {
                const modelName = path.basename(modelFile, '.js');
                const modelDefinition = require(modelFile); // eslint-disable-line global-require

                modelDefinition.identity = modelName.toLowerCase();

                if (defaultConnection) {
                    modelDefinition.connection = modelDefinition.connection || defaultConnection;
                }

                modelNameMapping[modelDefinition.identity] = modelName;

                const model = Waterline.Collection.extend(modelDefinition);

                orm.loadCollection(model);
            }

            return modelNameMapping;
        });
    } else {
        for (const modelName of Object.keys(modelsDir)) {
            const modelDefinition = modelsDir[modelName];

            modelDefinition.identity = modelName.toLowerCase();

            if (defaultConnection) {
                modelDefinition.connection = modelDefinition.connection || defaultConnection;
            }

            modelNameMapping[modelDefinition.identity] = modelName;

            const model = Waterline.Collection.extend(modelDefinition);

            orm.loadCollection(model);
        }

        return Promise.resolve(modelNameMapping);
    }
}

let _orm = null;
let _models = null;

const ModelLoader = {
    get _orm() {
        return _orm;
    },
    get models() {
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

        const orm = new Waterline();

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

        const adapterTeardowns = [];

        Object.keys(_orm.connections).forEach(name => {
            const adapter = _orm.connections[name]._adapter;

            if (adapter.teardown) {
                adapterTeardowns.push(new Promise((resolve, reject) => {
                    adapter.teardown(null, err => {
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

export default ModelLoader;