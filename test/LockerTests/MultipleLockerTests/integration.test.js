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
    describe('Locker Integration Test', () => {

        let url = '/api/lockers/:lockerId/collections/:lockerCollectionId/clone';

        describe(`Integration tests`, () => {
            const agent = chai.request.agent(app);
            let user1; let lockerProductId;
            let locker1; let lockerCollectionId1;
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId/clone';
                await dropDatabase();
                user1 = await createUser(UserData[0]);
                locker1 = JSON.parse(JSON.stringify(await Locker.findOne({ user: user1._id })));
                lockerCollectionId1 = (await agent.post(`/api/lockers/${locker1._id}/collections?access_token=${user1.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker1._id).replace(':lockerCollectionId', lockerCollectionId1);
                const product = await createProduct(ProductData[0]);
                lockerProductId = await agent.put(`/api/lockers/${locker1._id}/collections/${lockerCollectionId1}/products?access_token=${user1.access_token}`).send({ product: product._id }).then(res=>res.body._id);
            });
            
            it('Deleting a user cleans up their collections and products', async () => {
                return agent.delete(`/api/users/${user1._id}?access_token=${user1.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await Locker.countDocuments()).should.eql(0);
                    (await LockerCollection.countDocuments()).should.eql(0);
                    (await LockerProduct.countDocuments()).should.eql(0);
                })
            });

            it('Deleting a locker cleans up collections and products', async () => {
                const admin = await loginAdminEmployee();
                return agent.delete(`/api/lockers/${locker1._id}?access_token=${admin.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await Locker.countDocuments()).should.eql(0);
                    (await LockerCollection.countDocuments()).should.eql(0);
                    (await LockerProduct.countDocuments()).should.eql(0);
                })
            });

            it('Deleting a collection cleans up from locker and cleans up from product but both still exist.', async () => {
                return agent.delete(`/api/lockers/${locker1._id}/collections/${lockerCollectionId1}?access_token=${user1.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.countDocuments()).should.eql(0);
                    (await Locker.countDocuments()).should.eql(1);
                    (await LockerProduct.countDocuments()).should.eql(1);
                    (await LockerProduct.find({locker: locker1._id})).length.should.eql(1);
                    (await Locker.findById(locker1._id)).locker_collections.length.should.eql(0);
                })
            });

            it('Removing a product from a locker deletes the product', async () => {
                return agent.delete(`/api/lockers/${locker1._id}/products?access_token=${user1.access_token}`).send({locker_product: lockerProductId}).then( async (res2) => {
                    res2.status.should.eql(200);
                    (await LockerProduct.countDocuments()).should.eql(0);
                });
            })
        });
    });
};
