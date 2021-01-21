/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import Locker from '@server/models/locker/locker.model';
import RBAC from '@server/models/rbac.model';
import User from '@server/models/user.model';
import Employee from '@server/models/employee.model';
import Organization from '@server/models/organization.model';
import Media from '@server/models/media.model';
import { EmployeeData } from '@development/employee.data';
import { OrganizationData } from '@development/organization.data';
import { UserData } from '@development/user.data';
import { CollectionData, getCollectionConstructor } from '@development/collection.data';
import {createUser, loginAdminEmployee, dropDatabase, createLocker} from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/s3';

chai.use(chaiHttp);
chai.should();

export default () => {
  describe('Locker Basics Test', () => {
    
    const url = '/api/lockers';

    describe(`POST ${url}`, () => {
      const agent = chai.request.agent(app);
      let user; let admin;
      beforeEach(async () => {
        await dropDatabase();
        user = await createUser(UserData[0]);
        admin = await loginAdminEmployee();
      });
      it('Create Locker: Cannot create twice for a given user (should fail)', async () => {
        const role = await RBAC.findOne({ role: 'admin' });
        await User.findByIdAndUpdate(user._id, { permissions: role._id });
        return agent.post(`${url}?access_token=${user.access_token}`)
        .then((res) => {
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.LockerControllerErrors.LockerAlreadyExistsForUser)
        })
     });
      it('Create Locker: Not logged in (should fail)', async () => agent.post(`${url}`)
        .then((res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        }));
      it('Create Locker: Bad permissions (should fail)', async () => {
        return agent.post(`${url}?access_token=${user.access_token}`)
          .then(async (res) => {
            res.status.should.eql(403);
            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
          });
      });
      it('Remove user: Should remove locker (should succeed)', async () => {
        return agent.delete(`/api/users/${user._id}?access_token=${admin.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
            const numLockers = await Locker.countDocuments();
            numLockers.should.eql(0);
        });
      });
    });
    describe(`GET ${url}`, () => {
        const agent = chai.request.agent(app);
        let user;
        beforeEach(async () => {
          await dropDatabase();
          user = await createUser(UserData[0]);
        });
        it('Get Locker: Success', async () => agent.get(`${url}?access_token=${user.access_token}`)
          .then((res) => {
            res.status.should.eql(200);
            res.body.length.should.eql(1)
        }));
        it('Create Locker: Not logged in (should succeed)', async () => agent.get(`${url}`)
          .then((res) => {
            res.status.should.eql(200);
          }));
        it('Create Locker: Bad permissions (should succeed)', async () => {
          const role = await RBAC.findOne({ role: 'none' });
          await User.findByIdAndUpdate(user._id, { permissions: role._id });
          return agent.get(`${url}`)
            .then(async (res) => {
                res.status.should.eql(200);
            });
        });
        it('Remove user: Should remove locker and list should be empty (should succeed)', async () => {
          return agent.delete(`/api/users/${user._id}?access_token=${user.access_token}`)
            .then(async (res) => {
                return agent.get(`${url}`)
                .then(async (res) => {
                    res.body.length.should.eql(0);
                });
          });
        });
        it("Create Locker: Query by 'user' by ID is invalid (empty list)", async () => {
            return agent.get(`${url}?access_token=${user.access_token}&user=${12345}`).then((res) => {
                res.status.should.eql(400);
            });
        });
        it("Create Locker: Query by 'user' by ID is not found (empty list)", async () => {
            const newId = '600623b74f91b470ec81bad0';
            return agent.get(`${url}?access_token=${user.access_token}&user=${newId}`).then((res) => {
                res.status.should.eql(200);
                res.body.length.should.eql(0);
            });
        });
        it("Create Locker: Query by 'user' found", async () => {
            return agent.get(`${url}?access_token=${user.access_token}&user=${user._id}`).then((res) => {
                res.status.should.eql(200);
                res.body.length.should.eql(1);
            });
        });
      });
  });
};

