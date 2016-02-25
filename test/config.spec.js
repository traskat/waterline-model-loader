'use strict';

const modelLoader = require('../lib/index');
const chai = require('chai');
const path = require('path');
const expect = chai.expect;
const validConnections = require('./connections');
const memoryAdapter = require('sails-memory');

describe('config arguments', function () {
    it('missing modelsDir', done => {
        let config = {
            connections: validConnections
        };

        modelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('No "modelsDir" configuration given');
        }).then(done).catch(done);
    });

    it('missing connections', done => {
        let config = {
            modelsDir: path.join(__dirname, 'models')
        };

        modelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('No "connections" configuration given');
        }).then(done).catch(done);
    });

    it('non existing modelsDir', done => {
        let config = {
            connections: validConnections,
            modelsDir: path.join(__dirname, 'models-bad')
        };

        modelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message.startsWith('ENOENT: no such file or dir')).to.equal(true);
        }).then(done).catch(done);
    });

    it('empty connections', done => {
        let config = {
            connections: {},
            modelsDir: path.join(__dirname, 'models')
        };

        modelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('Options object must contain an adapters object');
        }).then(done).catch(done);
    });

    it('no config given', done => {
        modelLoader.setup().then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('No configuration given');
        }).then(done).catch(done);
    });

    it('connection with unknown adapter', done => {
        let config = {
            modelsDir: path.join(__dirname, 'models'),
            connections: {
                adapters: {
                    default: memoryAdapter,
                },

                connections: {
                    memoryConnection: {
                        adapter: 'memory'
                    }
                },
            }
        };

        modelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message.startsWith('Unknown adapter "memory" for conn')).to.equal(true);
        }).then(done).catch(done);
    });
});


