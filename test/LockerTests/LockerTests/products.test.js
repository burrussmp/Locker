/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import Locker from '@server/models/locker/locker.model';
import RBAC from '@server/models/rbac.model';
import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';
import Media from '@server/models/media.model';
import { EmployeeData } from '@development/employee.data';
import { ProductData } from '@development/product.data';
import { UserData } from '@development/user.data';
import { CollectionData, getCollectionConstructor } from '@development/collection.data';
import { createUser, createProduct, dropDatabase, createLocker, loginAdminEmployee } from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/s3';

chai.use(chaiHttp);
chai.should();

export default () => {
    describe('Locker Product Test', () => {

        let url = '/api/lockers/:lockerId/products';

        describe(`PUT ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let defaultUpdate;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/products';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                url = url.replace(':lockerId', locker._id);            
                const product = await createProduct(ProductData[0]);
                defaultUpdate = { product: product._id };
            });
            it('Add Locker Products: Success', async () => {
                return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then((res) => {
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.LockerControllerErrors.AddedProductToLocker);
                    return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                        res.body.length.should.eql(1);
                        res.body[0]._id.should.eql(defaultUpdate.product);
                    })
                })
            });
            it('Add Locker Products: Product doesnt exist (should fail)', async () => {
                return agent.put(`${url}?access_token=${user.access_token}`)
                    .send({product: user._id})
                    .then((res) => {
                        res.status.should.eql(400);
                        res.body.error.should.include(StaticStrings.ProductControllerErrors.NotFoundError);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(0);
                        })
                    })
            });
            it('Add Locker Products: Invalid Product ID (should fail)', async () => {
                return agent.put(`${url}?access_token=${user.access_token}`)
                    .send({product: 12345})
                    .then((res) => {
                        res.status.should.eql(400);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(0);
                        })
                    })
            });
            it('Add Locker Products: Not logged in (should fail)', async () => agent.put(`${url}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            }));
            it('Add Locker Products: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.put(`${url}?access_token=${newUser.access_token}`)
                    .send(defaultUpdate)
                    .then((res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                });
            });
            it('Add Locker Products: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.put(`${url}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    });
            });
            it('Add Locker Products: Add the same product ID twice (should fail)', async () => {
                return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then((res) => {
                    res.status.should.eql(200);
                    return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res)=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.LockerControllerErrors.ProductAlreadyInLocker);
                        (await Locker.findById(locker)).all_products.length.should.eql(1);
                    })
                })
            });
            it('Add Locker Products: Add different product IDs', async () => {
                const newProduct = await createProduct(ProductData[1]);
                return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then((res) => {
                    res.status.should.eql(200);
                    return agent.put(`${url}?access_token=${user.access_token}`).send({product: newProduct._id}).then((res)=>{
                        res.status.should.eql(200);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(2);
                        })
                    })
                })
            });
        });
        describe(`DELETE ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let defaultBody;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/products';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                url = url.replace(':lockerId', locker._id);            
                const product = await createProduct(ProductData[0]);
                defaultBody = { product: product._id };
                await agent.put(`${url}?access_token=${user.access_token}`).send(defaultBody).then();
            });
            it('Remove Locker Products: Success', async () => {
                return agent.delete(`${url}?access_token=${user.access_token}`)
                    .send(defaultBody)
                    .then((res) => {
                        res.status.should.eql(200);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(0);
                        })
                    })
            });
            it('Remove Locker Products: Product doesnt exist (should fail)', async () => {
                return agent.delete(`${url}?access_token=${user.access_token}`)
                    .send({product: user._id})
                    .then((res) => {
                        res.status.should.eql(400);
                        res.body.error.should.include(StaticStrings.ProductControllerErrors.NotFoundError);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(1);
                        })
                    })
            });
            it('Remove Locker Products: Invalid Product ID (should fail)', async () => {
                return agent.delete(`${url}?access_token=${user.access_token}`)
                    .send({product: 12345})
                    .then((res) => {
                        res.status.should.eql(400);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(1);
                        })
                    })
            });
            it('Remove Locker Products: Not logged in (should fail)', async () => agent.delete(`${url}`)
                .send(defaultBody)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            }));
            it('Add Locker Products: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.put(`${url}?access_token=${newUser.access_token}`)
                    .send(defaultBody)
                    .then((res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                });
            });
            it('Remove Locker Products: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.delete(`${url}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    });
            });
            it('Remove Locker Products: Remove the same product ID twice (should fail)', async () => {
                return agent.delete(`${url}?access_token=${user.access_token}`).send(defaultBody).then((res) => {
                    res.status.should.eql(200);
                    return agent.delete(`${url}?access_token=${user.access_token}`).send(defaultBody).then((res)=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError)
                    })
                })
            });
            it('Remove Locker Products: Keep other IDs not removed', async () => {
                const newProduct = await createProduct(ProductData[1]);
                return agent.put(`${url}?access_token=${user.access_token}`).send({product: newProduct._id}).then((res) => {
                    res.status.should.eql(200);
                    return agent.delete(`${url}?access_token=${user.access_token}`).send(defaultBody).then((res)=>{
                        res.status.should.eql(200);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(1);
                        })
                    })
                })
            });
        });
       describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let defaultBody;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/products';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                url = url.replace(':lockerId', locker._id);            
                const product = await createProduct(ProductData[0]);
                defaultBody = { product: product._id };
                await agent.put(`${url}?access_token=${user.access_token}`).send(defaultBody).then();
            });
            it('Get Locker Products: Success', async () => agent.get(`${url}?access_token=${user.access_token}`)
                .then((res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(1)
                }));
            it('Get Locker Products: Not logged in (should fail)', async () => agent.get(`${url}`)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            }));
            it('Get Locker Products: Not owner (should succeed)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.get(`${url}?access_token=${newUser.access_token}`)
                    .then((res) => {
                        res.status.should.eql(200);
                });
            });
            it('Get Locker Products: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.get(`${url}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    });
            });
            it('Get Locker Products: Query using "added_after" is right now (should have nothing)', async () => {
                const added_after = new Date().getTime() / 1000;
                return agent.get(`${url}?access_token=${user.access_token}&added_after=${added_after}`).then((res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(0)
                })
            });
            it('Get Locker Products: Query using "added_after" is an hour ago (should have 1)', async () => {
                const added_after = new Date().getTime() / 1000 - 60 * 60 * 1000;
                return agent.get(`${url}?access_token=${user.access_token}&added_after=${added_after}`).then((res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(1)
                })
            });
        });
    });
};

