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

const countLockerProducts = async (lockerID) => {
    return (await LockerProduct.find({locker: lockerID})).length;
};

const countLockerCollectionProducts = async (lockerCollectionId) => {
    return (await LockerProduct.find({locker_collections: {$in: [lockerCollectionId]}})).length;
}


export default () => {
    describe('Locker Clone Collection Test', () => {

        let url = '/api/lockers/:lockerId/collections/:lockerCollectionId/clone';

        describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user1; let user2;
            let locker1; let lockerCollectionId1; let lockerProduct1;
            let locker2;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId/clone';
                await dropDatabase();
                user1 = await createUser(UserData[0]);
                locker1 = JSON.parse(JSON.stringify(await Locker.findOne({ user: user1._id })));
                lockerCollectionId1 = (await agent.post(`/api/lockers/${locker1._id}/collections?access_token=${user1.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker1._id).replace(':lockerCollectionId', lockerCollectionId1);
                const product = await createProduct(ProductData[0]);
                await agent.put(`/api/lockers/${locker1._id}/collections/${lockerCollectionId1}/products?access_token=${user1.access_token}`).send({ product: product._id }).then(res=>res.body._id);
                user2 = await createUser(UserData[1]);
                locker2 = JSON.parse(JSON.stringify(await Locker.findOne({ user: user2._id })));
            });

            it('Clone Locker: User 2 Successfully Clones Collection owned by User 1', async () => {
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await Locker.countDocuments()).should.eql(2);
                    (await LockerCollection.countDocuments()).should.eql(2);
                    (await LockerProduct.countDocuments()).should.eql(2);
                    (await LockerCollection.find({user: user1._id})).length.should.eql(1);
                    (await LockerCollection.find({user: user2._id})).length.should.eql(1);
                    (await Locker.find({user: user1._id})).length.should.eql(1);
                    (await Locker.find({user: user2._id})).length.should.eql(1);
                    (await LockerProduct.find({locker_collections: {$in: [res.body._id]}})).length.should.eql(1);
                })
            });

            it('Clone Locker: User 1 successfully clones own collection', async () => {
                return agent.get(`${url}?access_token=${user1.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.countDocuments()).should.eql(2);
                    (await LockerProduct.countDocuments()).should.eql(1);
                    (await LockerCollection.find({user: user1._id})).length.should.eql(2);
                    (await LockerProduct.find({locker_collections: {$in: [res.body._id]}})).length.should.eql(1);

                })
            });

            it('Clone Locker: User 2 clones collection owned by user 1 and user 2 deletes new collection (should succeed but not affect original collection)', async () => {
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/lockers/${locker2._id}/collections/${res.body._id}?access_token=${user2.access_token}`).then( async (res2) => {
                        res2.status.should.eql(200);
                        (await LockerCollection.countDocuments()).should.eql(1); // only 1 collection
                        (await LockerProduct.countDocuments()).should.eql(2); // product still in both of their lockers
                        (await LockerCollection.find({user: user1._id})).length.should.eql(1); // user 1 collection still exists
                        (await LockerProduct.find({locker_collections: {$in: [res.body._id]}})).length.should.eql(0); // product pulled from user 2 collection
                        (await LockerProduct.find({locker_collections: {$in: [lockerCollectionId1]}})).length.should.eql(1);
                    });
                })
            });

            it('Clone Locker: User 2 clones collection owned by user 1 and user 1 tries to delete user 2 collection (should fail)', async () => {
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/lockers/${locker2._id}/collections/${res.body._id}?access_token=${user1.access_token}`).then( async (res2) => {
                        res2.status.should.eql(403);
                        res2.body.error.should.eql(StaticStrings.NotOwnerError);
                    });
                })
            });

            it('Clone Locker: User 2 clones collection owned by user 1 and user 1 tries to delete user 2 collection (should fail)', async () => {
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/lockers/${locker2._id}/collections/${res.body._id}?access_token=${user1.access_token}`).then( async (res2) => {
                        res2.status.should.eql(403);
                        res2.body.error.should.eql(StaticStrings.NotOwnerError);
                    });
                })
            });

            it('Clone Locker: User 2 clones collection owned by user 1 and user 1 tries to delete using own locker in query (should fail)', async () => {
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/lockers/${locker1._id}/collections/${res.body._id}?access_token=${user1.access_token}`).then( async (res2) => {
                        res2.status.should.eql(401);
                        res2.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.CollectionAndLockerNotOwnedBySameRequester);
                    });
                })
            });

            it('Clone Locker: Not logged in (should fail)', async () => {
                return agent.get(`${url}`).then(async (res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                });
            });
            it('Clone Locker: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user2._id, { permissions: role._id });
                return agent.get(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                })
            });
        });
    });
};
