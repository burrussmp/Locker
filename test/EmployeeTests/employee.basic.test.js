import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {OrganizationData, getOrganizationConstructor} from '../../development/organization.data';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';

import StaticStrings from '../../config/StaticStrings';
import {drop_database, loginAdminEmployee} from  '../helper';
import permissions from '../../server/permissions';


chai.use(chaiHttp);
chai.should();

const employee_basics_test = () => {
    describe("Basics Test",()=>{
        describe("GET/POST /api/ent/employees",()=>{
            let agent = chai.request.agent(app);
            let admin;
            beforeEach(async()=>{
                await drop_database();
                admin = await loginAdminEmployee();
            });
            it("Create a new employee (w/ admin should succeed)",async()=>{
                const employee_data = getEmployeeConstructor(EmployeeData[0]);
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(2);
                        })
                })
            })
            it("Missing password (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                delete employee_data.password;
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(1);
                        })
                })
            })
            it("Password too short (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.password = 'A$5d';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                })
            });
            it("Password missing special character (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.password = 'Admin1234';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                })
            });
            it("Password missing uppercase (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.password = 'admin123#';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                })
            })
            it("Password missing lowercase (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.password = 'ADMIN123#';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                })
            })
            it("Missing email (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                delete employee_data.email;
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(1);
                        })
                })
            })
            it("Missing role_type (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                delete employee_data.role_type;
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(1);
                        })
                })
            });
            it("Invalid role_type (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.role_type = '404';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(404);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(1);
                        })
                })
            });
            it("Duplicate email (should fail)",async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.email = process.env.ADMIN_EMAIL;
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(400);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(1);
                        })
                })
            })
            it("Admin can create admin", async()=>{
                let employee_data = JSON.parse(JSON.stringify(getEmployeeConstructor(EmployeeData[0])));
                employee_data.role_type = 'admin';
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/ent/employees?access_token=${admin.access_token}`)
                        .then((res)=>{
                            res.body.length.should.eql(2);
                        })
                })
            });
            it("Supervisor cannot create an admin", async()=>{
                const employee_data = getEmployeeConstructor(EmployeeData[0]);
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(200);
                        const access_token = res.body.access_token;
                        let employee_data2 = getEmployeeConstructor(EmployeeData[1]);
                        employee_data2.role_type = 'admin'
                        return agent.post(`/api/ent/employees?access_token=${access_token}`)
                        .send(employee_data2)
                        .then((res)=>{
                            res.status.should.eql(401);
                        });
                })
            });
            it("Supervisor can create an employee", async()=>{
                const employee_data = getEmployeeConstructor(EmployeeData[0]);
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(200);
                        const access_token = res.body.access_token;
                        let employee_data2 = getEmployeeConstructor(EmployeeData[2]);
                        return agent.post(`/api/ent/employees?access_token=${access_token}`)
                        .send(employee_data2)
                        .then((res)=>{
                            res.status.should.eql(200);
                        });
                })
            });
            it("Employee cannot create another employee", async()=>{
                const employee_data = getEmployeeConstructor(EmployeeData[2]);
                return agent.post(`/api/ent/employees?access_token=${admin.access_token}`)
                    .send(employee_data)
                    .then((res)=>{
                        res.status.should.eql(200);
                        const access_token = res.body.access_token;
                        let employee_data2 = getEmployeeConstructor(EmployeeData[2]);
                        employee_data2.email = 'different@mail,com'
                        return agent.post(`/api/ent/employees?access_token=${access_token}`)
                        .send(employee_data2)
                        .then((res)=>{
                            res.status.should.eql(403);
                        });
                })
            });
        });
    })
}

export default employee_basics_test;