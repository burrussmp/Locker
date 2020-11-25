/* eslint-disable max-len */

import chai from 'chai';
import chaiHttp from 'chai-http';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {app} from '../../server/server';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg} from '../helper';
import RBAC from '../../server/models/rbac.model';
import Employee from '../../server/models/employee.model';

import StaticStrings from '../../config/StaticStrings';
import {OrganizationData} from '../../development/organization.data';

chai.use(chaiHttp);
chai.should();

const employeeRoleTest = () => {
  describe('Role update test', ()=>{
    describe('PUT /api/ent/employees/:employee/role', ()=>{
      const agent = chai.request.agent(app);
      let admin; let supervisor; let employee;
      beforeEach( async () =>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Elevate permissions (should succeed)', async ()=>{
        return agent.put(`/api/ent/employees/${employee.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const rbac = await RBAC.findById(res.body.role_id);
              rbac.role.should.eql('supervisor');
              const updatedEmployee = await Employee.findById(res.body.employee_id);
              updatedEmployee.permissions.should.eql(rbac._id);
            });
      });
      it('Requester level is same (supervisor trying to promote self to supervisor) (should succeed)', async ()=>{
        return agent.put(`/api/ent/employees/${supervisor.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const rbac = await RBAC.findById(res.body.role_id);
              rbac.role.should.eql('supervisor');
              const updatedEmployee = await Employee.findById(res.body.employee_id);
              updatedEmployee.permissions.should.eql(rbac._id);
            });
      });
      it('Requester level is same (supervisor trying to promote self to supervisor) (should succeed)', async ()=>{
        return agent.put(`/api/ent/employees/${supervisor.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const rbac = await RBAC.findById(res.body.role_id);
              rbac.role.should.eql('supervisor');
              const updatedEmployee = await Employee.findById(res.body.employee_id);
              updatedEmployee.permissions.should.eql(rbac._id);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${employee.id}/role`)
            .send({'new_role': 'supervisor'})
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Employee not found (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${12345678}/role`)
            .send({'new_role': 'supervisor'})
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
            });
      });
      it('Missing permissions (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${employee.id}/role?access_token=${employee.access_token}`)
            .send({'new_role': 'supervisor'})
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Requester level is less than the role (supervisor trying to promote self to admin) (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${supervisor.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'admin'})
            .then((res)=>{
              res.status.should.eql(401);
            });
      });
      it('Requester level is less than requestee level (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${admin.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'employee'})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.ChangeRoleCannotUpdateSuperior);
            });
      });
      it('Role doesnt exist (should fail)', async ()=>{
        return agent.put(`/api/ent/employees/${employee.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'unknown'})
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.RBACModelErrors.RoleNotFound);
            });
      });
      it('Requester and requestee not part of the same organization (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const otherOrgEmployee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[3]));
        return agent.put(`/api/ent/employees/${otherOrgEmployee.id}/role?access_token=${supervisor.access_token}`)
            .send({'new_role': 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrSameOrg);
            });
      });
      it('Requester and requestee not part of the same organization, but admin (should succeed)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const otherOrgEmployee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[3]));
        return agent.put(`/api/ent/employees/${otherOrgEmployee.id}/role?access_token=${admin.access_token}`)
            .send({'new_role': 'supervisor'})
            .then(async (res)=>{
              res.status.should.eql(200);
            });
      });
    });
  });
};

export default employeeRoleTest;
