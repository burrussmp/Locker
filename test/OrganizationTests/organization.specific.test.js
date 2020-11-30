/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import Employee from '../../server/models/employee.model';
import Organization from '../../server/models/organization.model';
import RBAC from '../../server/models/rbac.model';
import Media from '../../server/models/media.model';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {OrganizationData} from '../../development/organization.data';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg} from '../helper';
import StaticStrings from '../../config/StaticStrings';


chai.use(chaiHttp);
chai.should();

const organizationSpecificTests = () => {
  describe('Organization Specific Test', ()=>{
    describe('GET /api/organizations/:organizationId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Cannot find an organization (should fail)', async ()=>{
        return agent.get(`/api/organizations/${1234567}?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Get an organization, not logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations/${org._id}`).then((res)=>{
          res.status.should.eql(200);
          res.body._id.toString().should.eql(org._id);
        });
      });
      it('Get an organization, logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations/${org._id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          res.body._id.toString().should.eql(org._id);
        });
      });
      it('Get an organization, no permissions (should succeed)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
        return agent.get(`/api/organizations/${org._id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          res.body._id.toString().should.eql(org._id);
        });
      });
    });
    describe('PUT /api/organizations/:organizationId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Update Organization: Requester not in :organizationId (should fail)', async ()=>{
        const otherCompanySupervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        const update = {'name': 'new name'};
        return agent.put(`/api/organizations/${org._id}?access_token=${otherCompanySupervisor.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
            });
      });
      it('Update an organization, not logged in (should fail)', async ()=>{
        const update = {'name': 'new name'};
        return agent.put(`/api/organizations/${org._id}`)
            .send(update)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Update an organization, missing permissions (should fail)', async ()=>{
        const update = {'name': 'new name'};
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Update an organization with invalid fields in update object (should fail)', async ()=>{
        const update = {'products': 'EVIL'};
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.include(StaticStrings.BadRequestInvalidFields);
            });
      });
      it('Update an organization with one valid field (should succeed)', async ()=>{
        const update = {'name': 'new name'};
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(200);
              const updatedOrg = await Organization.findById(org._id);
              for (const [key, value] of Object.entries(update)) {
                updatedOrg[key].should.eql(value);
              }
            });
      });
      it('Update an organization with all valid fields (should succeed)', async ()=>{
        const update = {
          'name': 'new name',
          'url': 'https://google.com',
          'description': 'a new description',
        };
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(200);
              const updatedOrg = await Organization.findById(org._id);
              for (const [key, value] of Object.entries(update)) {
                updatedOrg[key].should.eql(value);
              }
            });
      });
      it('Update an organization with all valid fields and an invalid (should fail)', async ()=>{
        const update = {
          'name': 'new name',
          'url': 'https://google.com',
          'description': 'a new description',
          'invalid': 'test',
        };
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(422);
            });
      });
      it('Cannot find an organization (should fail)', async ()=>{
        const update = {'name': 'new name'};
        return agent.put(`/api/organizations/${1234567}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Check that employee cannot update an organization', async ()=>{
        const update = {
          'name': 'new name',
          'url': 'https://google.com',
          'description': 'a new description',
        };
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.put(`/api/organizations/${org._id}?access_token=${employee.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(403);
            });
      });
      it('Check if URL already exists (should fail and not update)', async ()=>{
        const existingOrg = await Organization.findOne();
        const update = {
          'name': 'new name',
          'url': existingOrg.url,
          'description': 'a new description',
        };
        const prevOrg = await Organization.findById(org._id).lean();
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.OrganizationModelErrors.URLAlreadyExists);
              const updatedOrg = await Organization.findById(org._id).lean();
              for (const [key, value] of Object.entries(updatedOrg)) {
                prevOrg[key].should.eql(value);
              }
            });
      });
      it('Check if name already exists (should fail and not update)', async ()=>{
        const existingOrg = await Organization.findOne();
        const update = {
          'name': existingOrg.name,
          'url': 'https://google.com',
          'description': 'a new description',
        };
        const prevOrg = await Organization.findById(org._id).lean();
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.OrganizationModelErrors.NameAlreadyExists);
              const updatedOrg = await Organization.findById(org._id).lean();
              for (const [key, value] of Object.entries(updatedOrg)) {
                prevOrg[key].should.eql(value);
              }
            });
      });
      it('Check if no error if name stays the same (should succeed', async ()=>{
        const prevOrg = await Organization.findById(org._id).lean();
        const update = {
          'name': prevOrg.name,
          'url': prevOrg.url,
          'description': 'a new description',
        };
        return agent.put(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .send(update)
            .then(async (res)=>{
              res.status.should.eql(200);
              const updatedOrg = await Organization.findById(org._id).lean();
              for (const [key, value] of Object.entries(update)) {
                updatedOrg[key].should.eql(value);
              }
            });
      });
    });
    describe('DELETE /api/organizations/:organizationId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Delete Organization: Not employee of organization (should fail because of permissions)', async ()=>{
        const otherCompanySupervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[4]));
        return agent.delete(`/api/organizations/${org._id}?access_token=${otherCompanySupervisor.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Delete an organization, not logged in (should fail)', async ()=>{
        return agent.delete(`/api/organizations/${org._id}`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Delete an organization, missing permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
        return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Check that employee cannot delete an organization', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.delete(`/api/organizations/${org._id}?access_token=${employee.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(403);
            });
      });
      it('Cannot find an organization (should fail)', async ()=>{
        return agent.delete(`/api/organizations/${1234567}?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Check that admin can delete an organization', async ()=>{
        return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              const deletedOrg = await Organization.findById(res.body._id);
              (deletedOrg == undefined || deletedOrg == null).should.be.true;
            });
      });
      it('Check if you can delete twice (should fail)', async ()=>{
        return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('Check if media is cleaned up after delete (should fail)', async ()=>{
        const numMedia = await Media.countDocuments();
        return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              const newNumMedia = await Media.countDocuments();
              numMedia.should.eql(newNumMedia+1);
            });
      });
    });
  });
};

export default organizationSpecificTests;
