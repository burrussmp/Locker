/* eslint-disable max-len */
import chai from 'chai';
const fs = require('fs').promises;
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import Employee from '../../server/models/employee.model';
import Organization from '../../server/models/organization.model';
import RBAC from '../../server/models/rbac.model';
import Media from '../../server/models/media.model';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {OrganizationData} from '../../development/organization.data';
import {bufferEquality, dropDatabase, createEmployee, loginAdminEmployee, createOrg} from '../helper';
import StaticStrings from '../../config/StaticStrings';
import S3Services from '../../server/services/S3.services';

chai.use(chaiHttp);
chai.should();

const pngImage = process.cwd() + '/test/resources/profile1.png';
const jpgImage = process.cwd() + '/test/resources/profile2.jpg';
const textFile = process.cwd() + '/test/resources/profile3.txt';

const organizationLogoTests = () => {
  describe('Organization Logo Test', ()=>{
    describe('GET /api/organizations/:organizationId/logo`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Get Logo: Cannot find an organization (should fail)', async ()=>{
        return agent.get(`/api/organizations/${1234567}/logo?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Get Logo: Not logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations/${org._id}/logo`).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Logo: Logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Logo: No permissions (should succeed)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
        return agent.get(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Logo: Check if correct logo retrieved', async ()=>{
        return fetch(`http://localhost:3000/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .then((res)=>res.blob())
            .then(async (res)=>{
              const buffer = await res.arrayBuffer();
              return fs.readFile(OrganizationData[0].logo).then((data)=>{
                bufferEquality(data, buffer).should.be.true;
              });
            });
      });
      it('Get Logo: Check if size query parameter works retrieved', async ()=>{
        return agent.get(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}&size=small`).then(async (res)=>{
          res.status.should.eql(200);
          const orgWithLogo = await Organization.findById(org._id).populate('logo', 'resized_keys').exec();
          orgWithLogo.logo.resized_keys.length.should.eql(1);
          for (const key of orgWithLogo.logo.resized_keys) {
            await S3Services.fileExistsS3(key);
          }
        });
      });
    });
    describe('POST /api/organizations/:organizationId/logo`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Update Logo: Cannot find an organization (should fail)', async ()=>{
        return agent.post(`/api/organizations/${1234567}/logo?access_token=${admin.access_token}`)
            .attach('media', pngImage)
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Update Logo: Not logged in (should fail)', async ()=>{
        return agent.post(`/api/organizations/${org._id}/logo`)
            .attach('media', pngImage)
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Update Logo: Check if employee has permissions (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${employee.access_token}`)
            .attach('media', pngImage)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Update Logo: Wrong name (should fail)', async ()=>{
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .attach('404', pngImage)
            .then((res)=>{
              res.status.should.eql(400);
            });
      });
      it('Update Logo: Media cleaned up (should succeed)', async ()=>{
        const numMedia = await Media.countDocuments();
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .attach('media', pngImage)
            .then(async (res)=>{
              res.status.should.eql(200);
              const numMediaNow = await Media.countDocuments();
              numMediaNow.should.eql(numMedia);
            });
      });
      it('Update Logo: Check if image updated correctly (should succeed)', async ()=>{
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .attach('media', pngImage)
            .then(async (res)=>{
              res.status.should.eql(200);
              return fetch(`http://localhost:3000/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
                  .then((res)=>res.blob())
                  .then(async (res)=>{
                    const buffer = await res.arrayBuffer();
                    return fs.readFile(pngImage).then((data)=>{
                      bufferEquality(data, buffer).should.be.true;
                    });
                  });
            });
      });
      it('Update Logo: Check if jpeg works (should succeed)', async ()=>{
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .attach('media', jpgImage)
            .then(async (res)=>{
              res.status.should.eql(200);
            });
      });
      it('Update Logo: Check if text file works (should fail)', async ()=>{
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${admin.access_token}`)
            .attach('media', textFile)
            .then(async (res)=>{
              res.status.should.eql(422);
            });
      });
      it('Update Logo: Requester not in :organizationId (should fail)', async ()=>{
        const otherCompanySupervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.post(`/api/organizations/${org._id}/logo?access_token=${otherCompanySupervisor.access_token}`)
            .attach('media', textFile)
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
            });
      });
    });
  });
};

export default organizationLogoTests;
