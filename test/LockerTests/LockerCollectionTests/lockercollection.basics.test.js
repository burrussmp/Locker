/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import Locker from '@server/models/locker/locker.model';
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
    describe('Locker Collection Basics Test', () => {

        let url = '/api/lockers/:lockerId/collections';

        describe(`POST ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker;

            const hero = process.cwd() + '/test/resources/alo_yoga_logo.png'
            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                url = url.replace(':lockerId', locker._id);            
            });
            it('Create a Locker Collection: Success', async () => {
                return agent.post(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.countDocuments()).should.eql(1);
                    const lockerCollection = (await Locker.findById(locker._id)).locker_collections
                    lockerCollection.length.should.eql(1);
                    lockerCollection[0]._id.toString().should.eql(res.body._id);
                })
            });
            it('Create a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
                return agent.post(`/api/lockers/${1234}/collections?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('Create a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
                return agent.post(`/api/lockers/${user._id}/collections?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('Create a Locker Collection: Not logged in (should fail)', async () => {
                return agent.post(`${url}`).then(async (res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it('Create a Locker Collection: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.post(`${url}?access_token=${newUser.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.NotOwnerError)
                })
            });
            it('Create a Locker Collection: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.post(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                })
            });
            it('Create a Locker Collection: Add hero image (should succeed)', async () => {
                return agent.post(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async (res) => {
                    res.status.should.eql(200);
                    const lockerCollectionHero = (await LockerCollection.findById(res.body._id)).hero;
                    (lockerCollectionHero == undefined || lockerCollectionHero == null).should.be.false;
                })
            });
            it('Create a Locker Collection: Add hero image, other validation fails and cleans properly (should fail)', async () => {
                const name = {name: new Array(26).join('a')};
                const numMedia = await Media.countDocuments();
                return agent.post(`${url}?access_token=${user.access_token}`).attach('hero', hero).field(name).then(async (res) => {
                    res.status.should.eql(400);
                    numMedia.should.eql(await Media.countDocuments());
                })
            });
            it('Create a Locker Collection: Hero not image/png or image/jpeg (should fail)', async () => {
                const textFile = process.cwd() + '/test/resources/profile3.txt';
                return agent.post(`${url}?access_token=${user.access_token}`).attach('hero', textFile).then(async (res) => {
                    res.status.should.eql(422);
                    res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
                })
            });
            it('Create a Locker Collection: Name is provided (should succeed)', async () => {
                const name = {name: 'new name'};
                return agent.post(`${url}?access_token=${user.access_token}`).send(name).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.findById(res.body._id)).name.should.eql(name.name);
                })
            });
            it('Create a Locker Collection: Name is too long (should fail)', async () => {
                const name = {name: new Array(26).join('a')};
                return agent.post(`${url}?access_token=${user.access_token}`).send(name).then(async (res) => {
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.LockerCollectionModelErrors.NameExceededLength)
                })
            });
            it('Create a Locker Collection: Description is provided (should succeed)', async () => {
                const description = {description: 'description'};
                return agent.post(`${url}?access_token=${user.access_token}`).send(description).then(async (res) => {
                    res.status.should.eql(200);
                    (await LockerCollection.findById(res.body._id)).description.should.eql(description.description);
                })
            });
            it('Create a Locker Collection: Description is too long (should fail)', async () => {
                const description = {description: new Array(202).join('a')};
                return agent.post(`${url}?access_token=${user.access_token}`).send(description).then(async (res) => {
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.LockerCollectionModelErrors.DescriptionExceededLength)
                })
            });
        });
        describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let lockerCollectionId;

            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                url = url.replace(':lockerId', locker._id);     
                lockerCollectionId = (await agent.post(`${url}?access_token=${user.access_token}`).then(res=>res.body))._id;       
            });
            
            it('List a Locker Collection: Success', async () => {
                return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(1);
                    res.body[0].should.eql(lockerCollectionId);
                })
            });
            it('Multiple Locker Collections: Success (should succeed)', async () => {
                await agent.post(`${url}?access_token=${user.access_token}`).then()
                return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                    res.body.length.should.eql(2);
                })
            });
            it('List a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
                return agent.get(`/api/lockers/${1234}/collections?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('List a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
                return agent.get(`/api/lockers/${user._id}/collections?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                })
            });
            it('List a Locker Collection: Not logged in (should fail)', async () => {
                return agent.get(`${url}`).then(async (res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                });
            });
            it('List a Locker Collection: Not owner (should succeed)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.get(`${url}?access_token=${newUser.access_token}`).then(async (res) => {
                    res.status.should.eql(200);
                })
            });
            it('List a Locker Collection: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                })
            });
        });
    });
};

