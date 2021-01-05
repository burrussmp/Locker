/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
const fs = require('fs').promises;
import fetch from 'node-fetch';
import {app} from '@server/server';
import {EmployeeData, getEmployeeConstructor} from '@development/employee.data';
import {dropDatabase, bufferEquality, createEmployee, loginAdminEmployee} from '@test/helper';
import Employee from '@server/models/employee.model';
import RBAC from '@server/models/rbac.model';
import Media from '@server/models/media.model';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

const defaultProfilePhoto = '/client/assets/images/profile-pic.png';

const employeeAvatarTest = () => {
  describe('Profile Photo', ()=>{
    describe('POST /api/employees/:employeeId/avatar', ()=>{
      const agent = chai.request.agent(app);
      let admin; let employee;
      beforeEach( async () =>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Successfully post an avatar (png) and check exists in S3', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const emp = await Employee.findById({'_id': employee.id}).populate('profile_photo', 'key').exec();
              emp.should.have.property('profile_photo');
              emp.profile_photo.should.have.property('key');
              let image = await Media.findOne({'key': emp.profile_photo.key});
              image.mimetype.includes('image').should.be.true;
              image.uploadedBy.toString().should.eql(employee.id);
              const key = image.key;
              return S3Services.fileExistsS3(key).then((data)=>{
                data.Metadata.type.should.eql('Avatar');
                data.Metadata.uploader.should.eql(employee.id);
                data.Metadata.uploader.should.eql(emp._id.toString());
                return S3Services.deleteMediaS3(key).then(async ()=> {
                  image = await Media.findOne({'key': key});
                  (image == undefined || image == null).should.be.true;
                  return S3Services.fileExistsS3(key).catch((err)=>{
                    err.should.exist;
                  });
                });
              });
            });
      });
      it('Delete an employee and then see if avatar cleaned up in S3', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then(async (res)=>{
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const image = await Media.findOne({'uploadedBy': employee.id});
              const key = image.key;
              return agent.delete(`/api/employees/${employee.id}?access_token=${employee.access_token}`).then(()=>{
                return S3Services.fileExistsS3(key).catch((err)=>{
                  (err==null || err==undefined).should.be.false;
                  err.statusCode.should.eql(404);
                });
              });
            });
      });
      it('Empty field (should fail)', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', '')
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
            });
      });
      it('Not owner (should fail)', async ()=>{
        return agent.post(`/api/employees/${admin.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
            });
      });
      it('Employee not found (should fail)', async ()=>{
        return agent.post(`/api/employees/404/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await Employee.findOneAndUpdate({'_id': employee.id}, {'permissions': NARole._id}, {new: true});
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Not an image file (should fail)', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', process.cwd() + '/test/resources/profile3.txt')
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar`)
            .attach('media', EmployeeData[1].profile)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Check if overwrite works (upload twice). This checks if MongoDB and S3 have been cleaned. Old entry should be gone', async ()=>{
        return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile)
            .then(async ()=>{
              const image = await Media.findOne({'uploadedBy': employee.id});
              const key = image.key;
              return S3Services.fileExistsS3(key).then(()=>{
                return agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
                    .attach('media', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
                    .then(async ()=>{
                      const image2 = await Media.findOne({'uploadedBy': employee.id});
                      const oldImage = await Media.findOne({'key': key});
                      (oldImage == null || oldImage == undefined).should.be.true;
                      const key2 = image2.key;
                      key.should.not.eql(key2);
                    });
              });
            });
      });
    });
    describe('GET /api/employees/:employeeId/avatar', ()=>{
      const agent = chai.request.agent(app);
      let admin; let employee;
      beforeEach( async () =>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      });
      it('Get default profile', async ()=>{
        return fetch(`http://localhost:3000/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .then((res)=>res.blob())
            .then(async (res)=>{
              const buffer = await res.arrayBuffer();
              return fs.readFile(process.cwd()+defaultProfilePhoto).then((data)=>{
                bufferEquality(data, buffer).should.be.true;
              });
            });
      });
      it('Not owner (should succeed)', async ()=>{
        return agent.get(`/api/employees/${admin.id}/avatar?access_token=${employee.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.get(`/api/employees/${employee.id}/avatar`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Employee not found (should fail)', async ()=>{
        return agent.get(`/api/employees/1234/avatar?access_token=${employee.access_token}`)
            .then((res)=>{
              res.status.should.eql(404);
            });
      });
    });
    describe('/DELETE /api/employees/:employeeId/avatar', ()=>{
      const agent = chai.request.agent(app);
      let admin; let employee;
      beforeEach( async () =>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        await agent.post(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .attach('media', EmployeeData[1].profile);
      });
      it('Delete twice (first succeeds and second fails)', async ()=>{
        return agent.delete(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess);
              return agent.delete(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserControllerErrors.ProfilePhotoNotFound);
                  });
            });
      });
      it('Delete employee and see if S3 gets cleaned up correctly', async ()=>{
        const image = await Media.findOne({'uploadedBy': employee.id});
        const key = image.key;
        return agent.delete(`/api/employees/${employee.id}/avatar?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return S3Services.fileExistsS3(key).catch(async (err)=>{
            err.statusCode.should.eql(404);
            const image = await Media.findOne({'key': key});
            (image == null || image == undefined).should.be.true;
          });
        });
      });
      it('Not owner (should fail)', async ()=>{
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.delete(`/api/employees/${employee.id}/avatar?access_token=${supervisor.access_token}`).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.NotOwnerError);
        });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/employees/${employee.id}/avatar`).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('User does not exists (should fail)', async ()=>{
        return agent.delete(`/api/employees/404/avatar?access_token=${employee.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.EmployeeNotFound);
        });
      });
    });
  });
};

export default employeeAvatarTest;
