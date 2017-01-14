# Waterline model loader

[![npm version](https://img.shields.io/npm/v/waterline-model-loader.svg)](https://www.npmjs.com/package/waterline-model-loader)
[![Build Status](https://travis-ci.org/arjanfrans/waterline-model-loader.svg?branch=master)](https://travis-ci.org/arjanfrans/waterline-model-loader)
[![Coverage Status](https://coveralls.io/repos/arjanfrans/waterline-model-loader/badge.svg)](https://coveralls.io/r/arjanfrans/waterline-model-loader)
[![Dependency Status](https://david-dm.org/arjanfrans/waterline-model-loader.svg)](https://david-dm.org/arjanfrans/waterline-model-loader)
[![devDependency Status](https://david-dm.org/arjanfrans/waterline-model-loader/dev-status.svg)](https://david-dm.org/arjanfrans/waterline-model-loader#info=devDependencies)

Node module to load Waterline models from a directory and use the file names (without the extension)
for the model names. It is an abstraction on the Waterline loading process.

## Installation

```
npm install --save waterline-model-loader
```

## Basic usage

Create a directory where your models live. The files are loaded recursively, however the name of
the model files must be unique.

Model example:
```javascript
// ./models/Example.js

// A regular Waterline model
module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true
        }
    }
};
```

Usage example:
```javascript
const path = require('path');
const modelLoader = require('waterline-model-loader').default;

let config = {
    modelsDir: path.join(__dirname, './models'),
    connections: {
        // Waterline connections object
    }
};

modelLoader.setup(config).then(models => {
    // do stuff with your Waterline models
    let ExampleModel = models.Example;

    // do stuff with ExampleModel
}).catch(err => {
    // deal with any setup errors
});

// Alternatively you can access the models from the modelLoader singleton after setup:
// let models = modelLoader.models;


// When quiting your app you can teardown the connections.
// This could be necessary for tests if multiple connections are loaded.
modelLoader.teardown().then(() => {
    console.log('done');
}).catch(err => {
    // deal with an error (and report it if you suspect a bug)
})

```

See the [Waterline docs](https://github.com/balderdashy/waterline-docs) for a *connections* object
or check the tests for an [example](./test/connections.js).
