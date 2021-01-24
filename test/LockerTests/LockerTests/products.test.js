/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import LockerProduct from '@server/models/locker/lockerproduct.model';
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

        describe(`POST ${url}`, () => {
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
                return agent.post(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
                    res.status.should.eql(200);
                    const allLockerProducts = await LockerProduct.find({locker: locker._id});
                    allLockerProducts.length.should.eql(1);
                    allLockerProducts[0].product.toString().should.eql(defaultUpdate.product);
                })
            });
            it('Add Locker Products: Product doesnt exist (should fail)', async () => {
                return agent.post(`${url}?access_token=${user.access_token}`)
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
                return agent.post(`${url}?access_token=${user.access_token}`)
                    .send({product: 12345})
                    .then((res) => {
                        res.status.should.eql(400);
                        return agent.get(`${url}?access_token=${user.access_token}`).then(res=>{
                            res.body.length.should.eql(0);
                        })
                    })
            });
            it('Add Locker Products: Not logged in (should fail)', async () => agent.post(`${url}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            }));
            it('Add Locker Products: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.post(`${url}?access_token=${newUser.access_token}`)
                    .send(defaultUpdate)
                    .then((res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                });
            });
            it('Add Locker Products: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.post(`${url}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    });
            });
            it('Add Locker Products: Add the same product ID twice (should fail)', async () => {
                return agent.post(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then((res) => {
                    res.status.should.eql(200);
                    return agent.post(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res)=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.LockerControllerErrors.ProductAlreadyInLocker);
                        const allLockerProducts = await LockerProduct.find({locker: locker._id});
                        allLockerProducts.length.should.eql(1);
                    })
                })
            });
            it('Add Locker Products: Add different product IDs', async () => {
                const newProduct = await createProduct(ProductData[1]);
                return agent.post(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then((res) => {
                    res.status.should.eql(200);
                    return agent.post(`${url}?access_token=${user.access_token}`).send({product: newProduct._id}).then((res)=>{
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
            let user; let locker; let lockerProductID;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/products/:lockerProductId';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                const product = await createProduct(ProductData[0]);
                lockerProductID = await agent.post(`/api/lockers/${locker._id}/products?access_token=${user.access_token}`).send({product: product._id}).then(res => res.body._id);
                url = url.replace(':lockerId', locker._id).replace(':lockerProductId', lockerProductID);            
            });
            it('Remove Locker Products: Success', async () => {
                (await LockerProduct.findById(lockerProductID)).locker.toString().should.eql(locker._id);
                return agent.delete(`${url}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(200);
                        const lockerProduct = await LockerProduct.findById(res.body._id);
                        (lockerProduct == null || lockerProduct == undefined).should.be.true;
                    })
            });
            it('Remove Locker Products: Product doesnt exist (should fail)', async () => {
                return agent.delete(`/api/lockers/${locker._id}/products/${user._id}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(404);
                        res.body.error.should.equal(StaticStrings.LockerProductControllerErrors.NotFoundError);
                    })
            });
            it('Remove Locker Products: Invalid Product ID (should fail)', async () => {
                return agent.delete(`/api/lockers/${locker._id}/products/${12345}?access_token=${user.access_token}`)
                    .then((res) => {
                        res.status.should.eql(404);
                        res.body.error.should.equal(StaticStrings.LockerProductControllerErrors.NotFoundError);
                    })
            });
            it('Remove Locker Products: Locker product not in your locker', async () => {
                const newUser = await createUser(UserData[1]);
                const otherLocker = await Locker.findOne({user: newUser._id});
                return agent.delete(`/api/lockers/${otherLocker._id}/products/${lockerProductID}?access_token=${newUser.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.equal(StaticStrings.NotOwnerError);
                    })
            });

            it('Remove Locker Products: Not logged in (should fail)', async () => agent.delete(`${url}`)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            }));
            it('Remove Locker Products: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.delete(`${url}?access_token=${newUser.access_token}`)
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
                return agent.delete(`${url}?access_token=${user.access_token}`).then((res) => {
                    res.status.should.eql(200);
                    return agent.delete(`${url}?access_token=${user.access_token}`).then((res)=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.LockerProductControllerErrors.NotFoundError)
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
                await agent.post(`${url}?access_token=${user.access_token}`).send(defaultBody).then();
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
            it('Get Locker Products: Query using "orphan" (should have 1)', async () => {
                return agent.get(`${url}?access_token=${user.access_token}&orphan=true`).then((res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(1)
                })
            });
            it('Get Locker Products: Query using "orphan" after adding to collection (should have 0)', async () => {
                const lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
                await agent.post(`/api/lockers/${locker._id}/collections/${lockerCollectionId}/products?access_token=${user.access_token}`).send(defaultBody).then();   
                return agent.get(`${url}?access_token=${user.access_token}&orphan=true`).then((res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(0)
                })
            });
        });
    });
};

