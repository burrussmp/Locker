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
    describe('Locker Clone Collection Test', () => {

        let url = '/api/lockers/:lockerId/collections/:lockerCollectionId/reference';

        describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user1; let user2;
            let locker1; let lockerCollectionId1;
            let locker2;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId/reference';
                await dropDatabase();
                user1 = await createUser(UserData[0]);
                locker1 = JSON.parse(JSON.stringify(await Locker.findOne({ user: user1._id })));
                lockerCollectionId1 = (await agent.post(`/api/lockers/${locker1._id}/collections?access_token=${user1.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker1._id).replace(':lockerCollectionId', lockerCollectionId1);
                const product = await createProduct(ProductData[0]);
                await agent.post(`/api/lockers/${locker1._id}/collections/${lockerCollectionId1}/products?access_token=${user1.access_token}`).send({ product: product._id }).then(res=>res.body._id);
                user2 = await createUser(UserData[1]);
                locker2 = JSON.parse(JSON.stringify(await Locker.findOne({ user: user2._id })));
            });

            it('Reference Locker: User 2 references collection owned by User 1', async () => {
                return agent.post(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.countDocuments()).should.eql(1);
                    (await LockerCollection.find({user: user1._id})).length.should.eql(1);
                    (await LockerProduct.countDocuments()).should.eql(1);
                    (await LockerProduct.find({locker_collections: {$in: [lockerCollectionId1]}})).length.should.eql(1);
                    (await Locker.findOne({user: user1._id})).locker_collections.should.include(lockerCollectionId1);
                    (await Locker.findOne({user: user2._id})).locker_collections.should.include(lockerCollectionId1);
                })
            });

            it('Reference Locker: User 1 references own collection which is a noop', async () => {
                return agent.post(`${url}?access_token=${user1.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.find({user: user1._id})).length.should.eql(1);
                    (await Locker.findOne({user: user1._id})).locker_collections.should.include(lockerCollectionId1);
                })
            });

            it('Reference Locker: User 2 references collection owned by user 1 and then attempts to delete collection (should fail)', async () => {
                return agent.post(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/lockers/${locker2._id}/collections/${lockerCollectionId1}?access_token=${user2.access_token}`).then( async (res2) => {
                        res2.status.should.eql(401);
                        res2.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.CollectionAndLockerNotOwnedBySameRequester);
                    });
                })
            });

            it('Reference Locker: User 2 references collection owned by user 1 and account deleted (should keep collection)', async () => {
                return agent.post(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    return agent.delete(`/api/users/${user2._id}?access_token=${user2.access_token}`).then( async (res2) => {
                        res2.status.should.eql(200);
                        (await Locker.countDocuments()).should.eql(1);
                        (await LockerCollection.countDocuments()).should.eql(1);
                        (await LockerProduct.countDocuments()).should.eql(1);
                        (await LockerCollection.find({user: user1._id})).length.should.eql(1);
                        (await LockerProduct.find({locker_collections: {$in: [lockerCollectionId1]}})).length.should.eql(1);
                    });
                })
            });

            it('Reference Locker: User 2 references collection owned by user 1 and user 1 deletes collection (should remove from user 2)', async () => {
                return agent.post(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await Locker.findById(locker2._id)).locker_collections.length.should.eql(1);
                    return agent.delete(`/api/lockers/${locker1._id}/collections/${lockerCollectionId1}?access_token=${user1.access_token}`).then( async (res2) => {
                        res2.status.should.eql(200);
                        (await Locker.findById(locker2._id)).locker_collections.length.should.eql(0);
                    });
                })
            });

            it('Reference Locker: Not logged in (should fail)', async () => {
                return agent.post(`${url}`).then(async (res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                });
            });
            it('Reference Locker: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user2._id, { permissions: role._id });
                return agent.post(`${url}?access_token=${user2.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                })
            });
        });
    });
};
