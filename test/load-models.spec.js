'use strict';

const modelLoader = require('../lib/index');
const chai = require('chai');
const path = require('path');
const expect = chai.expect;
const connections = require('./connections');

describe('waterline model loader', function () {
    context('initial properties', () => {
        it('_orm and models are null', () => {
            expect(modelLoader).to.have.property('_orm');
            expect(modelLoader).to.have.property('models');
            expect(modelLoader._orm).to.equal(null);
            expect(modelLoader.models).to.equal(null);
        });
    });

    context('teardown without setup', () => {
        it('throws an error', done => {
            modelLoader.teardown().then(() => {
                expect.fail();

                return done();
            }).catch((err) => {
                expect(err.message).to.equal('Waterline ORM is not setup');
            }).then(done).catch(done);
        });
    });

    context('setup', () => {
        let loadedModels = null;

        before(done => {
            let config = {
                modelsDir: path.join(__dirname, './models'),
                connections: connections
            };

            modelLoader.setup(config).then(models => {
                loadedModels = models;

                return done();
            }).catch(done);
        });

        it('_orm and models are not null', () => {
            expect(modelLoader._orm).to.not.equal(null);
            expect(modelLoader.models).to.equal(loadedModels);
        });

        it('Waterline models are loaded', () => {
            expect(loadedModels).to.have.property('Pet');
            expect(loadedModels).to.have.property('Product');
            expect(loadedModels.Pet).to.have.property('waterline');
            expect(loadedModels.Product).to.have.property('waterline');
        });

        it('teardown', done => {
            let orm = modelLoader._orm;

            modelLoader.teardown().then(() => {
                expect(modelLoader._orm).to.equal(null);
                expect(modelLoader.models).to.equal(null);

                return done();
            }).catch(done);
        })
    });
});


