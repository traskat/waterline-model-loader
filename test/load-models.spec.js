import ModelLoader from '../src'
import { expect } from 'chai';
import path from 'path';
import connections from './connections';

describe('waterline model loader', function () {
    context('initial properties', () => {
        it('_orm and models are null', () => {
            expect(ModelLoader).to.have.property('_orm');
            expect(ModelLoader).to.have.property('models');
            expect(ModelLoader._orm).to.equal(null);
            expect(ModelLoader.models).to.equal(null);
        });
    });

    context('teardown without setup', () => {
        it('throws an error', done => {
            ModelLoader.teardown().then(() => {
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

            ModelLoader.setup(config).then(models => {
                loadedModels = models;

                return done();
            }).catch(done);
        });

        it('_orm and models are not null', () => {
            expect(ModelLoader._orm).to.not.equal(null);
            expect(ModelLoader.models).to.equal(loadedModels);
        });

        it('Waterline models are loaded', () => {
            expect(loadedModels).to.have.property('Pet');
            expect(loadedModels).to.have.property('Product');
            expect(loadedModels.Pet).to.have.property('waterline');
            expect(loadedModels.Product).to.have.property('waterline');
        });

        it('teardown', done => {
            let orm = ModelLoader._orm;

            ModelLoader.teardown().then(() => {
                expect(ModelLoader._orm).to.equal(null);
                expect(ModelLoader.models).to.equal(null);

                return done();
            }).catch(done);
        })
    });
});


