'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _waterline = require('waterline');

var _waterline2 = _interopRequireDefault(_waterline);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _recursiveReaddir = require('recursive-readdir');

var _recursiveReaddir2 = _interopRequireDefault(_recursiveReaddir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function recursiveModules(dir) {
    return new Promise(function (resolve, reject) {
        (0, _recursiveReaddir2.default)(dir, ['!*.js', '^\\.'], function (err, files) {
            if (err) {
                return reject(err);
            }

            return resolve(files);
        });
    });
}

function initializeOrm(modelNameMapping, orm, connections) {
    return new Promise(function (resolve, reject) {
        return orm.initialize(connections, function (err, models) {
            if (err) {
                return reject(err);
            }

            var modelMapping = {};

            Object.keys(models.collections).forEach(function (collectionName) {
                modelMapping[modelNameMapping[collectionName]] = models.collections[collectionName];
            });

            return resolve(modelMapping);
        });
    });
}

function loadModels(modelsDir, orm, connections) {
    var defaultConnection = connections.defaults ? connections.defaults.connection : null;
    var modelNameMapping = {};

    if (typeof modelsDir === 'string') {
        return recursiveModules(modelsDir).then(function (modelFiles) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = modelFiles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var modelFile = _step.value;

                    var modelName = _path2.default.basename(modelFile, '.js');
                    var modelDefinition = require(modelFile); // eslint-disable-line global-require

                    modelDefinition.identity = modelName.toLowerCase();

                    if (defaultConnection) {
                        modelDefinition.connection = modelDefinition.connection || defaultConnection;
                    }

                    modelNameMapping[modelDefinition.identity] = modelName;

                    var model = _waterline2.default.Collection.extend(modelDefinition);

                    orm.loadCollection(model);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return modelNameMapping;
        });
    } else {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = Object.keys(modelsDir)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var modelName = _step2.value;

                var modelDefinition = modelsDir[modelName];

                modelDefinition.identity = modelName.toLowerCase();

                if (defaultConnection) {
                    modelDefinition.connection = modelDefinition.connection || defaultConnection;
                }

                modelNameMapping[modelDefinition.identity] = modelName;

                var model = _waterline2.default.Collection.extend(modelDefinition);

                orm.loadCollection(model);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        return Promise.resolve(modelNameMapping);
    }
}

var _orm = null;
var _models = null;

var ModelLoader = {
    get _orm() {
        return _orm;
    },
    get models() {
        return _models;
    },
    setup: function setup(config) {
        if (!config) {
            return Promise.reject(new Error('No configuration given'));
        }

        if (!config.connections) {
            return Promise.reject(new Error('No "connections" configuration given'));
        }

        if (!config.modelsDir) {
            return Promise.reject(new Error('No "modelsDir" configuration given'));
        }

        var orm = new _waterline2.default();

        return loadModels(config.modelsDir, orm, config.connections).then(function (modelNameMapping) {
            return initializeOrm(modelNameMapping, orm, config.connections);
        }).then(function (models) {
            _models = models;
            _orm = orm;

            return _models;
        });
    },
    teardown: function teardown() {
        if (!_orm) {
            return Promise.reject(new Error('Waterline ORM is not setup'));
        }

        var adapterTeardowns = [];

        Object.keys(_orm.connections).forEach(function (name) {
            var adapter = _orm.connections[name]._adapter;

            if (adapter.teardown) {
                adapterTeardowns.push(new Promise(function (resolve, reject) {
                    adapter.teardown(null, function (err) {
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

exports.default = ModelLoader;