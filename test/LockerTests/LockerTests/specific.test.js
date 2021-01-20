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
import { OrganizationData } from '@development/organization.data';
import { UserData } from '@development/user.data';
import { CollectionData, getCollectionConstructor } from '@development/collection.data';
import { createUser, createCollection, dropDatabase, createLocker, loginAdminEmployee } from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/s3';

chai.use(chaiHttp);
chai.should();

export default () => {
    describe('Locker Basics Test', () => {

        const url = '/api/lockers';

        describe(`GET ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker;
            beforeEach(async () => {
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
            });
            it('Get Locker: Success', async () => agent.get(`${url}/${locker._id}?access_token=${user.access_token}`)
                .then((res) => {
                    res.status.should.eql(200);
                    res.body.user.should.eql(user._id);
                }));
            it('Update Locker: Not logged in (should succeed)', async () => agent.get(`${url}/${locker._id}`)
                .then((res) => {
                    res.status.should.eql(200);
            }));
            it('Update Locker: Not owner (should succeed)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.get(`${url}/${locker._id}?access_token=${newUser.access_token}`)
                    .then((res) => {
                        res.status.should.eql(200);
                });
            });
            it('Update Locker: Bad permissions (should succeed)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.get(`${url}/${locker._id}?access_token=${user.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(200);
                    });
            });
            it('Update Locker: Locker ID invalid (should fail)', async () => agent.get(`${url}/${12345}`)
                .then((res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                }));
            it('Update Locker: Locker ID not found (should fail)', async () => agent.get(`${url}/${user._id}`)
                .then((res) => {
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                }));
        });

        describe(`PUT ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker;
            const defaultUpdate = { "name": "new name" };
            beforeEach(async () => {
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
            });
            it('Update Locker: Success', async () => agent.put(`${url}/${locker._id}?access_token=${user.access_token}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(200);
                    res.body.name.should.eql(defaultUpdate.name);
                }));
            it('Update Locker: Not logged in (should fail)', async () => agent.put(`${url}/${locker._id}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                }));
            it('Update Locker: Not owner (should fail)', async () => {
                const newUser = await createUser(UserData[1]);
                return agent.put(`${url}/${locker._id}?access_token=${newUser.access_token}`)
                    .send(defaultUpdate)
                    .then((res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                    });
            });
            it('Update Locker: Bad permissions (should fail)', async () => {
                const role = await RBAC.findOne({ role: 'none' });
                await User.findByIdAndUpdate(user._id, { permissions: role._id });
                return agent.put(`${url}/${locker._id}?access_token=${user.access_token}`)
                    .send(defaultUpdate)
                    .then(async (res) => {
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    });
            });
            it('Update Locker: Locker ID invalid (should fail)', async () => agent.put(`${url}/${12345}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                }));
            it('Update Locker: Locker ID not found (should fail)', async () => agent.put(`${url}/${user._id}`)
                .send(defaultUpdate)
                .then((res) => {
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.LockerControllerErrors.NotFoundError);
                }));
            it('Update Locker: Unsupported field', async () => agent.put(`${url}/${locker._id}?access_token=${user.access_token}`)
                .send({ 'user': user._id })
                .then((res) => {
                    res.status.should.eql(422);
                    res.body.error.should.include(StaticStrings.BadRequestInvalidFields);
                }));
            it("Update Locker: 'Name' too long ", async () => agent.put(`${url}/${locker._id}?access_token=${user.access_token}`)
                .send({ 'name': new Array(26).join('a') })
                .then((res) => {
                    res.status.should.eql(400);
                    res.body.error.should.include(StaticStrings.LockerModelErrors.NameExceededLength);
                }));
        });

        describe(`DELETE ${url}`, () => {
            const agent = chai.request.agent(app);
            let user; let locker; let admin;
            beforeEach(async () => {
                await dropDatabase();
                user = await createUser(UserData[0]);
                locker = JSON.parse(JSON.stringify(await Locker.findOne({ user: user._id })));
            });
            it('Delete Locker: Using user, cannot directly delete (should fail)', async () => agent.delete(`${url}/${locker._id}?access_token=${user.access_token}`)
                .then((res) => {
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                }));
            // it('Update Locker: Not logged in (should fail)', async () => agent.delete(`${url}/${locker._id}`)
            //     .then((res) => {
            //         res.status.should.eql(401);
            //         res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            // }));
            // it('Update Locker: Not owner (should fail)', async () => {
            //     const newUser = await createUser(UserData[1]);
            //     return agent.delete(`${url}/${locker._id}?access_token=${newUser.access_token}`)
            //         .then((res) => {
            //             res.status.should.eql(403);
            //             res.body.error.should.eql(StaticStrings.NotOwnerError);
            //     });
            // });
            it('Delete Locker: Using admin (should succeed)', async () => {
                const admin = await loginAdminEmployee();
                return agent.delete(`${url}/${locker._id}?access_token=${admin.access_token}`)
                    .then(async (res) => {
                        res.status.should.eql(200);
                        (await Locker.countDocuments()).should.eql(0);
                    });
            });
        });
    });
};

