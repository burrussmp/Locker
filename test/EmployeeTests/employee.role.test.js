import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {OrganizationData, getOrganizationConstructor} from '../../development/organization.data';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {drop_database, buffer_equality, createEmployee, loginAdminEmployee} from  '../helper';
import RBAC from '../../server/models/rbac.model';
import Employee from '../../server/models/employee.model';

import StaticStrings from '../../config/StaticStrings';
chai.use(chaiHttp);
chai.should();

const employee_role_test = () => {
    describe("Role update test", ()=>{
        describe('PUT /api/ent/employees/:employee/role', ()=>{
            const agent = chai.request.agent(app);
            let admin, employee;
            const valid_password = "myNewPassword12$";
            const invalid_password = "bad";
            beforeEach( async () =>{
                await drop_database();
                admin = await loginAdminEmployee();
                employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]))         
            });
            it("Not owner (should be fine)",async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${admin.access_token}`)
                    .send({
                        'old_password' : EmployeeData[1].password,
                        'password' : valid_password
                    })
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError)
                    });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password`)
                    .send({
                        'old_password' : EmployeeData[1].password,
                        'password' : valid_password
                    })
                    .then(res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                    });
            });
            it("User does not exists (should fail)",async ()=>{
                return agent.put(`/api/ent/employees/${1234}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : EmployeeData[1].password,
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
                });
            });
            it("Invalid permissions (should fail)", async()=>{
                const na_role = await RBAC.findOne({'role':'none'});
                await Employee.findOneAndUpdate({'_id': employee.id},{'permissions': na_role._id}, {new:true});
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : EmployeeData[1].password,
                    'password' : valid_password
                })
                .then(async res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
            it("/PUT w/ old password doesn't match current password (should fail)", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : 'wrong password',
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.PasswordUpdateIncorrectError)
                });
            });
            it("/PUT missing old password (should fail)", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' old_password')
                });
            });
            it("/PUT missing password field (should fail)", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' password')
                });
            });
            it("/PUT try to update with same, old password (should be fine)", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : EmployeeData[1].password,
                    'password' : EmployeeData[1].password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.PasswordUpdateSame)
                });
            });
            it("/PUT invalid new password (should fail)", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : EmployeeData[1].password,
                    'password' : invalid_password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordTooShort)
                });
            });
            it("/PUT tries to update different field other than password", async ()=>{
                return agent.put(`/api/ent/employees/${employee.id}/password?access_token=${employee.access_token}`)
                .send({
                    'old_password' : EmployeeData[1].password,
                    'password' : valid_password,
                    'email' : 'email@email.com'
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestInvalidFields + ' email')
                });
            });
        });
    });
}

export default employee_role_test;