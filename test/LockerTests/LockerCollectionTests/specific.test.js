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
    describe('Locker Collection Specific Test', () => {

        let url = '/api/lockers/:lockerId/collections/:lockerCollectionId';

        // describe(`GET ${url}`, () => {
        //     const agent = chai.request.agent(app);
        //     let user; let locker; let lockerCollectionId;

        //     beforeEach(async () => {
        //         url = '/api/lockers/:lockerId/collections/:lockerCollectionId';
        //         await dropDatabase();
        //         user = await createUser(UserData[0]);
        //         locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
        //         lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
        //         url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);     
        //     });
            
        //     it('Retrieve a Locker Collection: Success', async () => {
        //         return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(200);
        //             res.body._id.should.eql(lockerCollectionId);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
        //         return agent.get(`/api/lockers/${1234}/collections/${lockerCollectionId}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
        //         return agent.get(`/api/lockers/${user._id}/collections/${lockerCollectionId}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
        //         return agent.get(`/api/lockers/${locker._id}/collections/${1234}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
        //         return agent.get(`/api/lockers/${locker._id}/collections/${user._id}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Not logged in (should fail)', async () => {
        //         return agent.get(`${url}`).then(async (res) => {
        //             res.status.should.eql(401);
        //             res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        //         });
        //     });
        //     it('Retrieve a Locker Collection: Not owner (should succeed)', async () => {
        //         const newUser = await createUser(UserData[1]);
        //         return agent.get(`${url}?access_token=${newUser.access_token}`).then(async (res) => {
        //             res.status.should.eql(200);
        //         })
        //     });
        //     it('Retrieve a Locker Collection: Bad permissions (should fail)', async () => {
        //         const role = await RBAC.findOne({ role: 'none' });
        //         await User.findByIdAndUpdate(user._id, { permissions: role._id });
        //         return agent.get(`${url}?access_token=${user.access_token}`).then(async (res) => {
        //             res.status.should.eql(403);
        //             res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
        //         })
        //     });
        // });
        // describe(`PUT ${url}`, () => {
        //     const agent = chai.request.agent(app);
        //     let user; let locker; let lockerCollectionId;
        //     const defaultUpdate = {name: 'new collection name'};
        //     const hero = process.cwd() + '/test/resources/alo_yoga_logo.png'

        //     beforeEach(async () => {
        //         url = '/api/lockers/:lockerId/collections/:lockerCollectionId';
        //         await dropDatabase();
        //         user = await createUser(UserData[0]);
        //         locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
        //         lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
        //         url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);     
        //     });
            
        //     it('Update a Locker Collection: Success', async () => {
        //         return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(200);
        //         })
        //     });
        //     it('Update a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
        //         return agent.put(`/api/lockers/${1234}/collections/${lockerCollectionId}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Update a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
        //         return agent.put(`/api/lockers/${user._id}/collections/${lockerCollectionId}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Update a Locker Collection: Locker doesnt exist, invalid lockerId (should fail)', async () => {
        //         return agent.put(`/api/lockers/${locker._id}/collections/${1234}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Update a Locker Collection: Locker doesnt exist, lockerId not found (should fail)', async () => {
        //         return agent.put(`/api/lockers/${locker._id}/collections/${user._id}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(404);
        //             res.body.error.should.eql(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
        //         })
        //     });
        //     it('Update a Locker Collection: Not logged in (should fail)', async () => {
        //         return agent.put(`${url}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(401);
        //             res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        //         });
        //     });
        //     it('Update a Locker Collection: Not owner (should fail)', async () => {
        //         const newUser = await createUser(UserData[1]);
        //         return agent.put(`${url}?access_token=${newUser.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(403);
        //             res.body.error.should.eql(StaticStrings.NotOwnerError);
        //         })
        //     });
        //     it('Update a Locker Collection: Bad permissions (should fail)', async () => {
        //         const role = await RBAC.findOne({ role: 'none' });
        //         await User.findByIdAndUpdate(user._id, { permissions: role._id });
        //         return agent.put(`${url}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res) => {
        //             res.status.should.eql(403);
        //             res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
        //         })
        //     });
        //     it('Update a Locker Collection: Add hero image (should succeed)', async () => {
        //         return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async (res) => {
        //             res.status.should.eql(200);
        //             const lockerCollectionHero = (await LockerCollection.findById(res.body._id)).hero;
        //             (lockerCollectionHero == undefined || lockerCollectionHero == null).should.be.false;
        //         })
        //     });

        //     it('Update a Locker Collection: Clean up old hero image (should succeed)', async () => {
        //         const numMedia = await Media.countDocuments();
        //         return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async (res) => {
        //             res.status.should.eql(200);
        //             return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async (res) => {
        //                 res.status.should.eql(200);
        //                 (await Media.countDocuments()).should.eql(numMedia + 1);
        //             })
        //         })
        //     });
        //     it('Update a Locker Collection: Add hero image, other validation fails and cleans properly (should fail)', async () => {
        //         const name = {name: new Array(26).join('a')};
        //         const numMedia = await Media.countDocuments();
        //         return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).field(name).then(async (res) => {
        //             res.status.should.eql(400);
        //             numMedia.should.eql(await Media.countDocuments());
        //         })
        //     });
        //     it('Update a Locker Collection: Hero not image/png or image/jpeg (should fail)', async () => {
        //         const textFile = process.cwd() + '/test/resources/profile3.txt';
        //         return agent.put(`${url}?access_token=${user.access_token}`).attach('hero', textFile).then(async (res) => {
        //             res.status.should.eql(422);
        //             res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
        //         })
        //     });
        //     it('Update a Locker Collection: Name is provided (should succeed)', async () => {
        //         const name = {name: 'new name'};
        //         return agent.put(`${url}?access_token=${user.access_token}`).send(name).then(async (res) => {
        //             res.status.should.eql(200);
        //             (await LockerCollection.findById(res.body._id)).name.should.eql(name.name);
        //         })
        //     });
        //     it('Update a Locker Collection: Name is provided and hero not cleaned (should succeed)', async () => {
        //         const name = {name: 'new name'};
        //         await agent.put(`${url}?access_token=${user.access_token}`).attach('hero', hero).then(async res=> {
        //             const numMedia = await Media.countDocuments();
        //             return agent.put(`${url}?access_token=${user.access_token}`).send(name).then(async (res) => {
        //                 res.status.should.eql(200);
        //                 (await LockerCollection.findById(res.body._id)).name.should.eql(name.name);
        //                 numMedia.should.eql(await Media.countDocuments());
        //             })
        //         });
        //     });
        // });
        describe(`DELETE ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let lockerCollectionId;
            const hero = process.cwd() + '/test/resources/alo_yoga_logo.png'

            beforeEach(async () => {
                url = '/api/lockers/:lockerId/collections/:lockerCollectionId';
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
                lockerCollectionId = (await agent.post(`/api/lockers/${locker._id}/collections?access_token=${user.access_token}`).then(res=>res.body))._id;
                url = url.replace(':lockerId', locker._id).replace(':lockerCollectionId', lockerCollectionId);     
            });
            
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
        });
    });
};

