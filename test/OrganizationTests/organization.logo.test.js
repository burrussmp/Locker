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
import s3Services from '../../server/services/S3.services';

chai.use(chaiHttp);
chai.should();

const organizationLogoTests = () => {
  describe('Basics Test', ()=>{
    // describe('GET /api/ent/organizations/:organizationId/logo`', ()=>{
    //   const agent = chai.request.agent(app);
    //   let admin; let org;
    //   beforeEach(async ()=>{
    //     await dropDatabase();
    //     admin = await loginAdminEmployee();
    //     org = await createOrg(admin.access_token, OrganizationData[0]);
    //   });
    //   it('Get Logo: Cannot find an organization (should fail)', async ()=>{
    //     return agent.get(`/api/ent/organizations/${1234567}/logo?access_token=${admin.access_token}`)
    //         .then(async (res)=>{
    //           res.status.should.eql(404);
    //           res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
    //         });
    //   });
    //   it('Get Logo: Not logged in (should fail)', async ()=>{
    //     return agent.get(`/api/ent/organizations/${org._id}`).then((res)=>{
    //       res.status.should.eql(401);
    //       res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
    //     });
    //   });
    //   it('Get Logo: Cannot find an organization (should fail)', async ()=>{
    //     return agent.get(`/api/ent/organizations/${1234567}/logo?access_token=${admin.access_token}`)
    //         .then(async (res)=>{
    //           res.status.should.eql(404);
    //           res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
    //         });
    //   });
    //   it('Get Logo: Not logged in (should succeed)', async ()=>{
    //     return agent.get(`/api/ent/organizations/${org._id}/logo`).then((res)=>{
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('Get Logo: Logged in (should succeed)', async ()=>{
    //     return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('Get Logo: No permissions (should succeed)', async ()=>{
    //     const NARole = await RBAC.findOne({'role': 'none'});
    //     await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
    //     return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('Get Logo: Check if correct logo retrieved', async ()=>{
    //     return fetch(`http://localhost:3000/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`)
    //         .then((res)=>res.blob())
    //         .then(async (res)=>{
    //           const buffer = await res.arrayBuffer();
    //           return fs.readFile(OrganizationData[0].logo).then((data)=>{
    //             bufferEquality(data, buffer).should.be.true;
    //           });
    //         });
    //   });
    //   it('Get Logo: Check if size query parameter works retrieved', async ()=>{
    //     return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}&size=small`).then(async (res)=>{
    //       res.status.should.eql(200);
    //       const orgWithLogo = await Organization.findById(org._id).populate('logo', 'resized_keys').exec();
    //       orgWithLogo.logo.resized_keys.length.should.eql(1);
    //       for (const key of orgWithLogo.logo.resized_keys) {
    //         await s3Services.fileExistsS3(key);
    //       }
    //     });
    //   });
    // });
    describe('POST /api/ent/organizations/:organizationId/logo`', ()=>{
        const agent = chai.request.agent(app);
        let admin; let org;
        beforeEach(async ()=>{
          await dropDatabase();
          admin = await loginAdminEmployee();
          org = await createOrg(admin.access_token, OrganizationData[0]);
        });
        it('Get Logo: Cannot find an organization (should fail)', async ()=>{
          return agent.get(`/api/ent/organizations/${1234567}/logo?access_token=${admin.access_token}`)
              .then(async (res)=>{
                res.status.should.eql(404);
                res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
              });
        });
        it('Get Logo: Not logged in (should fail)', async ()=>{
          return agent.get(`/api/ent/organizations/${org._id}`).then((res)=>{
            res.status.should.eql(401);
            res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
          });
        });
        it('Get Logo: Cannot find an organization (should fail)', async ()=>{
          return agent.get(`/api/ent/organizations/${1234567}/logo?access_token=${admin.access_token}`)
              .then(async (res)=>{
                res.status.should.eql(404);
                res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
              });
        });
        it('Get Logo: Not logged in (should succeed)', async ()=>{
          return agent.get(`/api/ent/organizations/${org._id}/logo`).then((res)=>{
            res.status.should.eql(200);
          });
        });
        it('Get Logo: Logged in (should succeed)', async ()=>{
          return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
            res.status.should.eql(200);
          });
        });
        it('Get Logo: No permissions (should succeed)', async ()=>{
          const NARole = await RBAC.findOne({'role': 'none'});
          await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
          return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`).then((res)=>{
            res.status.should.eql(200);
          });
        });
        it('Get Logo: Check if correct logo retrieved', async ()=>{
          return fetch(`http://localhost:3000/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}`)
              .then((res)=>res.blob())
              .then(async (res)=>{
                const buffer = await res.arrayBuffer();
                return fs.readFile(OrganizationData[0].logo).then((data)=>{
                  bufferEquality(data, buffer).should.be.true;
                });
              });
        });
        it('Get Logo: Check if size query parameter works retrieved', async ()=>{
          return agent.get(`/api/ent/organizations/${org._id}/logo?access_token=${admin.access_token}&size=small`).then(async (res)=>{
            res.status.should.eql(200);
            const orgWithLogo = await Organization.findById(org._id).populate('logo', 'resized_keys').exec();
            orgWithLogo.logo.resized_keys.length.should.eql(1);
            for (const key of orgWithLogo.logo.resized_keys) {
              await s3Services.fileExistsS3(key);
            }
          });
        });
  });
};

export default organizationLogoTests;
