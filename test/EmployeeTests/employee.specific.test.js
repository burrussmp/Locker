/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import Media from '../../server/models/media.model';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';

import StaticStrings from '../../config/StaticStrings';
import {dropDatabase, loginAdminEmployee, createEmployee} from '../helper';


chai.use(chaiHttp);
chai.should();

const employeeSpecificTest = () => {
  describe('Basics Test', ()=>{
    describe('GET /api/employees/:employeeId', ()=>{
      const agent = chai.request.agent(app);
      let admin;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
      });
      it('Get an employee by ID (success)', async ()=>{
        return agent.get(`/api/employees/${admin.id}?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Get an employee by incorrect ID (should fail)', async ()=>{
        return agent.get(`/api/employees/${3214323}?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(404);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.get(`/api/employees/${admin.id}`)
            .then((res)=>{
              res.status.should.eql(401);
            });
      });
    });
    describe('PUT /api/employees/:employeeId', ()=>{
      const agent = chai.request.agent(app);
      let admin;
      let employee;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Update employee first_name (should succeed)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.put(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.first_name.should.eql(newField.first_name);
                  });
            });
      });
      it('Update employee last_name (should succeed)', async ()=>{
        const newField = {'last_name': 'last_name'};
        return agent.put(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.last_name.should.eql(newField.last_name);
                  });
            });
      });
      it('Update employee date_of_birth (should succeed)', async ()=>{
        const newField = {'date_of_birth': new Date()};
        return agent.put(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                  });
            });
      });
      it('Update employee email (should succeed)', async ()=>{
        const newField = {'email': 'test@mail.com'};
        return agent.put(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Update employee email with email that already exists (should fail)', async ()=>{
        const newField = {'email': process.env.ADMIN_EMAIL};
        return agent.put(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(400);
            });
      });
      it('Update an employee (incorrect ID) (should fail)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.put(`/api/employees/${1234}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(404);
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.first_name.should.eql(EmployeeData[1].first_name);
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.put(`/api/employees/${employee.id}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.first_name.should.eql(EmployeeData[1].first_name);
                  });
            });
      });
      it('Not owner (should fail)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.put(`/api/employees/${admin.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
              return agent.get(`/api/employees/${admin.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body._id.should.eql(admin.id);
                  });
            });
      });
    });
    describe('DELETE /api/employees/:employeeId', ()=>{
      const agent = chai.request.agent(app);
      let admin;
      let employee;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Delete an employee (should succeed)', async ()=>{
        return agent.delete(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('Delete an employee, profile should be deleted (should succeed)', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then(async (res)=> {
              res.status.should.eql(200);
              let media = await Media.findOne({uploadedBy: employee.id});
              (media == undefined || media == null).should.be.false;
              return agent.delete(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    media = await Media.findOne({uploadedBy: employee.id});
                    (media == undefined || media == null).should.be.true;
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.delete(`/api/employees/${employee.id}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
              return agent.get(`/api/employees/${employee.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.first_name.should.eql(EmployeeData[1].first_name);
                  });
            });
      });
      it('Not owner (should fail)', async ()=>{
        const newField = {'first_name': 'first_name'};
        return agent.delete(`/api/employees/${admin.id}?access_token=${employee.access_token}`)
            .send(newField)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
              return agent.get(`/api/employees/${admin.id}?access_token=${employee.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body._id.should.eql(admin.id);
                  });
            });
      });
    });
  });
};

export default employeeSpecificTest;
