/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import Employee from '../../server/models/employee.model';
import Organization from '../../server/models/organization.model';
import RBAC from '../../server/models/rbac.model';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {OrganizationData} from '../../development/organization.data';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg} from '../helper';
import StaticStrings from '../../config/StaticStrings';


chai.use(chaiHttp);
chai.should();

const organizationEmployeeTest = () => {
  describe('Organization Employee Test', ()=>{
    // describe('POST /api/ent/organizations/:organizationId/employee`', ()=>{
    //   const agent = chai.request.agent(app);
    //   let admin; let org; let employee;
    //   beforeEach(async ()=>{
    //     await dropDatabase();
    //     admin = await loginAdminEmployee();
    //     org = await createOrg(admin.access_token, OrganizationData[0]);
    //     employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
    //     await Employee.findByIdAndUpdate(employee.id, {'organization': undefined});
    //   });
    //   it('Add Employee to Organization: Already part of organization (should fail)', async ()=>{
    //     await Employee.findByIdAndUpdate(employee.id, {'organization': org._id});
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employee_id: employee.id, role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(400);
    //           res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.EmployeeAlreadyInOrganization);
    //         });
    //   });
    //   it('Add Employee to Organization: Not logged in (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees`)
    //         .send({employeeId: employee.id})
    //         .then(async (res)=>{
    //           res.status.should.eql(401);
    //           res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
    //         });
    //   });
    //   it('Add Employee to Organization: Missing permissions (should fail)', async ()=>{
    //     const NARole = await RBAC.findOne({'role': 'none'});
    //     await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employeeId: employee.id})
    //         .then(async (res)=>{
    //           res.status.should.eql(403);
    //           res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //         });
    //   });
    //   it('Add Employee to Organization: Not supervisor or higher (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${employee.access_token}`)
    //         .send({employee_id: employee.id, role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(403);
    //           res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //         });
    //   });
    //   it('Add Employee to Organization: Missing \'employee_id\' field (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(422);
    //           res.body.error.should.include('Missing required fields');
    //         });
    //   });
    //   it('Add Employee to Organization: Missing \'role\' field (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employee_id: employee.id})
    //         .then(async (res)=>{
    //           res.status.should.eql(422);
    //           res.body.error.should.include('Missing required fields');
    //         });
    //   });
    //   it('Add Employee to Organization: Employee not found (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employee_id: org._id, role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(404);
    //           res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
    //         });
    //   });
    //   it('Add Employee to Organization: \'employee_id\' is invalid (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employee_id: 123456, role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(400);
    //           res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.InvalidEmployeeID);
    //         });
    //   });
    //   it('Add Employee to Organization: Role not found (should fail)', async ()=>{
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
    //         .send({employee_id: employee.id, role: '404'})
    //         .then(async (res)=>{
    //           res.status.should.eql(400);
    //           res.body.error.should.eql(StaticStrings.RBACModelErrors.RoleNotFound);
    //         });
    //   });
    //   it('Add Employee to Organization: Role higher than requester role (should fail)', async ()=>{
    //     const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${supervisor.access_token}`)
    //         .send({employee_id: employee.id, role: 'admin'})
    //         .then(async (res)=>{
    //           res.status.should.eql(401);
    //           res.body.error.should.include('Requester authorization insufficient');
    //         });
    //   });
    //   it('Add Employee to Organization: Supervisor adds employee to organization with correct role (should succeed)', async ()=>{
    //     const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
    //     return agent.post(`/api/ent/organizations/${org._id}/employees?access_token=${supervisor.access_token}`)
    //         .send({employee_id: employee.id, role: 'supervisor'})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const employeeUpdated = await Employee.findById(employee.id).populate('permissions').exec();
    //           employeeUpdated.organization.toString().should.eql(org._id);
    //           employeeUpdated.permissions.role.should.eql('supervisor');
    //         });
    //   });
    // });
    describe('DELETE /api/ent/organizations/:organizationId/employee`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let org; let employee;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        org = await Organization.findOne({'name': 'Locker Company'});
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Delete Employee from Organization: Requester not in :organizationId (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const otherCompanySupervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[4]));
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${otherCompanySupervisor.access_token}`)
            .send({employee_id: employee.id})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
            });
      });
      it('Delete Employee from Organization: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/ent/organizations/${org._id}/employees`)
            .send({employeeId: employee.id})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Delete Employee from Organization: Missing permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': NARole._id}, {new: true});
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
            .send({employeeId: employee.id})
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Delete Employee from Organization: Not supervisor or higher (should fail)', async ()=>{
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${employee.access_token}`)
            .send({employee_id: employee.id})
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Delete Employee from Organization: Missing \'employee_id\' field (should fail)', async ()=>{
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
            .send({role: 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(422);
              res.body.error.should.include('Missing required fields');
            });
      });
      it('Delete Employee from Organization: Employee not found (should fail)', async ()=>{
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
            .send({employee_id: org._id})
            .then(async (res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
            });
      });
      it('Delete Employee from Organization: \'employee_id\' is invalid (should fail)', async ()=>{
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${admin.access_token}`)
            .send({employee_id: 123456})
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.InvalidEmployeeID);
            });
      });
      it('Delete Employee from Organization: Role higher than requester role (should fail)', async ()=>{
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        const supervisorDoc = await Employee.findById(supervisor.id);
        await Employee.findByIdAndUpdate(admin.id, {'organization': supervisorDoc.organization});
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${supervisor.access_token}`)
            .send({employee_id: admin.id})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.include('Requester authorization insufficient');
            });
      });
      it('Delete Employee from Organization: Requester and requestee not in same organization (should fail)', async ()=>{
        const supervisorOrg = await createOrg(admin.access_token, OrganizationData[0]);
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[4]));
        return agent.delete(`/api/ent/organizations/${supervisorOrg._id}/employees?access_token=${supervisor.access_token}`)
            .send({employee_id: employee.id})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesteeandRequesterInSameOrg);
            });
      });
      it('Delete Employee from Organization: Supervisor deletes employee to organization with correct role (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.delete(`/api/ent/organizations/${org._id}/employees?access_token=${supervisor.access_token}`)
            .send({employee_id: employee.id})
            .then(async (res)=>{
              res.status.should.eql(200);
              const employeeUpdated = await Employee.findById(employee.id).populate('permissions').exec();
              (employeeUpdated.organization == undefined || employeeUpdated.organization == null).should.be.true;
              employeeUpdated.permissions.role.should.eql('none');
            });
      });
    });
  });
};

export default organizationEmployeeTest;
