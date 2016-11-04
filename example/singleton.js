require('babel-register')

const modelLoader = require('../src/').default;

module.exports = function () {
    const Example = modelLoader.models.Example;

    console.log('get model from modelLoader.models', Example !== null);
};

