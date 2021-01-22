/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import Locker from '@server/models/locker/locker.model';
import LockerProduct from '@server/models/locker/lockerproduct.model';
import LockerCollection from '@server/models/locker/locker.collection.model';
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
    describe('Locker Collection Products Test', () => {

        let url = '/api/lockers/:lockerId/collections/:lockerCollectionId/products';

        describe(`PUT ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let lockerCollectionId; let defaultUpdate;

            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId/products';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);
                const product = await createProduct(ProductData[0]);
                defaultUpdate = { product: product._id };     
            });
            
            // it('Add Product to a Locker Collection: Success', async () => {
            //     const numProductsLockerCollection = (await LockerCollection.findById(lockerCollectionId)).products.length;
            //     numProductsLockerCollection.should.eql(0);
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(200);
            //         const numProductsLockerCollectionNow = (await LockerCollection.findById(lockerCollectionId)).products.length;
            //         numProductsLockerCollectionNow.should.eql(1);
            //         (await LockerProduct.countDocuments()).should.eql(1);
            //     })
            // });
            // it('Add Product to a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
            //     return agent.put(`/api/lockers/${1234}/collections/${lockerCollectionId}/products?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
            //     })
            // });
            // it('Add Product to a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
            //     return agent.put(`/api/lockers/${user._id}/collections/${lockerCollectionId}/products?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
            //     })
            // });
            // it('Add Product to a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
            //     return agent.put(`/api/lockers/${locker._id}/collections/${1234}/products?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
            //     })
            // });
            // it('Add Product to a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
            //     return agent.put(`/api/lockers/${locker._id}/collections/${user._id}/products?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
            //     })
            // });
            // it('Add Product to a Locker Collection: Not logged in (should fail)', async () => {
            //     return agent.put(`${url}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(401);
            //         res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            //     });
            // });
            // it('Add Product to a Locker Collection: Not owner (should fail)', async () => {
            //     const newUser = await createUser(UserData[1]);
            //     return agent.put(`${url}?access_token=${newUser.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(403);
            //         res.body.error.should.eql(StaticStrings.NotOwnerError);
            //     })
            // });
            // it('Add Product to a Locker Collection: Bad permissions (should fail)', async () => {
            //     const role = await RBAC.findOne({ role: 'none' });
            //     await User.findByIdAndUpdate(user._id, { permissions: role._id });
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(403);
            //         res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
            //     })
            // });
            // it('Add Product to a Locker Collection: Missing "product" in body', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).send({}).then(async (res) => {
            //         res.status.should.eql(400);
            //         res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.MissingProduct);
            //     })
            // });
            // it('Add Product to a Locker Collection: "product" doesnt exist', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).send({product: user._id}).then(async (res) => {
            //         res.status.should.eql(400);
            //         res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
            //     })
            // });
            // it('Add Product to a Locker Collection: "product" invalid', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).send({product: 12345}).then(async (res) => {
            //         res.status.should.eql(400);
            //     })
            // });
            // it('Add Product to a Locker Collection: Add it multiple times, allowed but doesnt duplicate in locker', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(200);
            //         return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //             res.status.should.eql(200);
            //             (await LockerCollection.findById(lockerCollectionId)).products.length.should.eql(2);
            //             (await Locker.findById(locker._id)).products.length.should.eql(1);
            //         })
            //     })
            // });
            // it('Add Product to a Locker Collection: Add different products added to both locker and collection.', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         const product2 = await createProduct(ProductData[1]);
            //         return agent.put(`${url}?access_token=${user.access_token}`).send({product: product2._id}).then(async (res) => {
            //             res.status.should.eql(200);
            //             (await LockerCollection.findById(lockerCollectionId)).products.length.should.eql(2);
            //             (await Locker.findById(locker._id)).products.length.should.eql(2);
            //         })
            //     })
            // });
            // it('Add Product to a Locker Collection: Product not in locker and added', async () => {
            //     const numProductsLocker = (await Locker.findById(locker._id)).products.length;
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(200);
            //         const numProductsLockerNow = (await Locker.findById(locker._id)).products.length;
            //         numProductsLockerNow.should.eql(numProductsLocker+ 1);
            //     })
            // });
            // it('Add Product to a Locker Collection: Product in locker and only added to collection', async () => {
            //     await agent.put(`/api/lockers/${locker._id}/products?access_token=${user.access_token}`).send(defaultUpdate).then();
            //     const numProductsLocker = (await Locker.findById(locker._id)).products.length;
            //     const numProductsCollection = (await LockerCollection.findById(lockerCollectionId)).products.length;
            //     return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(200);
            //         (await Locker.findById(locker._id)).products.length.should.eql(numProductsLocker);
            //         (await LockerCollection.findById(lockerCollectionId)).products.length.should.eql(numProductsCollection + 1);
            //     })
            // });

        });
        describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let lockerCollectionId;
            let product;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId/products';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);
                product = await createProduct(ProductData[0]);
                await agent.put(`${url}?access_token=${user.access_token}`).send({ product: product._id }).then()   
            });
            
            it('Get Products from a Locker Collection: Success', async () => {
                return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(1)
                    res.body[0]._id.should.eql(product._id)
                })
            });
            it('Get Products from a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
                return agent.get(`/api/lockers/${1234}/collections/${lockerCollectionId}/products?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('Get Products from a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
                return agent.get(`/api/lockers/${user._id}/collections/${lockerCollectionId}/products?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('Get Products from a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
                return agent.get(`/api/lockers/${locker._id}/collections/${1234}/products?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
                })
            });
            it('Get Products from a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
                return agent.get(`/api/lockers/${locker._id}/collections/${user._id}/products?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
                })
            });
            it('Get Products from a Locker Collection: Not logged in (should fail)', async () => {
                return agent.get(`${url}`).send(defaultUpdate).then(async (res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                });
            });
            it('Get Products from a Locker Collection: Not owner (should succeed)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.get(`${url}?access_token=${newUser.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                })
            });
            it('Get Products from a Locker Collection: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                })
            });
        });
        // describe(`DELETE ${url}`, () => {
        //     const agent = chai.request.agent(app);
        //     let user; let locker; let lockerCollectionId;
        //     const hero = process.cwd() + '/test/resources/alo_yoga_logo.png'

        //     beforeEach(async () => {
        //         url = '/api/lockers/:lockerId/collections/:lockerCollectionId';
        //         await dropDatabase();
        //         user = await createUser(UserData[0]);
        //         locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
        //         lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
        //         url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);     
        //     });
            
            // it('Delete a Locker Collection: Success', async () => {
            //     return agent.delete(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
            //         res.status.should.eql(200);
            //         (await Locker.findById(locker._id)).collections.length.should.eql(0);
            //         (await LockerCollection.countDocuments()).should.eql(0)
            //     })
            // });
            // it('Delete a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
            //     return agent.delete(`/api/lockers/${1234}/collections/${lockerCollectionId}?access_token=${user.access_token}`).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
            //     })
            // });
            // it('Delete a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
            //     return agent.delete(`/api/lockers/${user._id}/collections/${lockerCollectionId}?access_token=${user.access_token}`).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
            //     })
            // });
            // it('Delete a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
            //     return agent.delete(`/api/lockers/${locker._id}/collections/${1234}?access_token=${user.access_token}`).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
            //     })
            // });
            // it('Delete a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
            //     return agent.delete(`/api/lockers/${locker._id}/collections/${user._id}?access_token=${user.access_token}`).then(async (res) => {
            //         res.status.should.eql(404);
            //         res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
            //     })
            // });
            // it('Delete a Locker Collection: Not logged in (should fail)', async () => {
            //     return agent.delete(`${url}`).then(async (res) => {
            //         res.status.should.eql(401);
            //         res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            //     });
            // });
            // it('Delete a Locker Collection: Not owner (should fail)', async () => {
            //     const newUser = await createUser(UserData[1]);
            //     return agent.delete(`${url}?access_token=${newUser.access_token}`).then(async (res) => {
            //         res.status.should.eql(403);
            //         res.body.error.should.eql(StaticStrings.NotOwnerError);
            //     })
            // });
            // it('Delete a Locker Collection: Bad permissions (should fail)', async () => {
            //     const role = await RBAC.findOne({ role: 'none' });
            //     await User.findByIdAndUpdate(user._id, { permissions: role._id });
            //     return agent.delete(`${url}?access_token=${user.access_token}`).then(async (res) => {
            //         res.status.should.eql(403);
            //         res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
            //     })
            // });
            // it('Delete a Locker Collection: Hero image is cleaned (should succeed)', async () => {
            //     return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async (res) => {
            //         const moreMedia = await Media.countDocuments();
            //         return agent.delete(`${url}?access_token=${user.access_token}`).then(async (res) => {
            //             (await Media.countDocuments()).should.eql(moreMedia - 1);
            //         })
            //     })
            // });

            // it('Delete a Locker: Should remove the locker collection (should succeed)', async () => {
            //     const admin = await loginAdminEmployee()
            //     return agent.delete(`/api/lockers/${locker._id}?access_token=${admin.access_token}`).then(async (res) => {
            //         res.status.should.eql(200);
            //         (await LockerCollection.countDocuments()).should.eql(0);
            //     })
            // });
        // });
    });
};

