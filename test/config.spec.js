import ModelLoader from '../src'
import { expect } from 'chai';
import path from 'path';
import validConnections from './connections';
import memoryAdapter from 'sails-memory';

describe('config arguments', function () {
    it('missing modelsDir', done => {
        let config = {
            connections: validConnections
        };

        ModelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('No "modelsDir" configuration given');
        }).then(done).catch(done);
    });

    it('missing connections', done => {
        let config = {
            modelsDir: path.join(__dirname, 'models')
        };

        ModelLoader.setup(config).then(models => {
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

        ModelLoader.setup(config).then(models => {
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

        ModelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message).to.equal('Options object must contain an adapters object');
        }).then(done).catch(done);
    });

    it('no config given', done => {
        ModelLoader.setup().then(models => {
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

        ModelLoader.setup(config).then(models => {
            expect.fail();
        }).catch(err => {
            expect(err.message.startsWith('Unknown adapter "memory" for conn')).to.equal(true);
        }).then(done).catch(done);
    });
});


