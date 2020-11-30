/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';
import {OrganizationData, getConstructorData} from '../../development/organization.data';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg} from '../helper';
import StaticStrings from '../../config/StaticStrings';


chai.use(chaiHttp);
chai.should();

const organizationBasicsTest = () => {
  describe('Basics Test', ()=>{
    describe('POST /api/organizations`', ()=>{
      const agent = chai.request.agent(app);
      let admin;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
      });
      it('Create a new organization, not logged in (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        return agent.post(`/api/organizations`)
            .attach('media', organizationData.logo)
            .field(getConstructorData(organizationData))
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Create a new organization with supervisor, bad permissions (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.post(`/api/organizations?access_token=${supervisor.access_token}`)
            .attach('media', organizationData.logo)
            .field(getConstructorData(organizationData))
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Missing URL (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        const constructorData = JSON.parse(JSON.stringify(getConstructorData(organizationData)));
        delete constructorData.url;
        return agent.post(`/api/organizations?access_token=${admin.access_token}`)
            .attach('media', organizationData.logo)
            .field(constructorData)
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.OrganizationModelErrors.UrlRequired);
            });
      });
      it('Missing name (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        const constructorData = JSON.parse(JSON.stringify(getConstructorData(organizationData)));
        delete constructorData.name;
        return agent.post(`/api/organizations?access_token=${admin.access_token}`)
            .attach('media', organizationData.logo)
            .field(constructorData)
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.OrganizationModelErrors.NameRequired);
            });
      });
      it('Missing media (should fail)', async ()=>{
        const organizationData = getConstructorData(OrganizationData[0]);
        return agent.post(`/api/organizations?access_token=${admin.access_token}`)
            .field(organizationData)
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
            });
      });
      it('Duplicate name (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        return agent.post(`/api/organizations?access_token=${admin.access_token}`)
            .attach('media', organizationData.logo)
            .field(getConstructorData(organizationData))
            .then((res)=>{
              res.status.should.eql(200);
              const organizationDataDuplicateName = OrganizationData[1];
              organizationDataDuplicateName.name = organizationData.name;
              return agent.post(`/api/organizations?access_token=${admin.access_token}`)
                  .attach('media', organizationDataDuplicateName.logo)
                  .field(getConstructorData(organizationDataDuplicateName))
                  .then((res)=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.OrganizationModelErrors.NameAlreadyExists);
                  });
            });
      });
      it('Duplicate URL (should fail)', async ()=>{
        const organizationData = OrganizationData[0];
        return agent.post(`/api/organizations?access_token=${admin.access_token}`)
            .attach('media', organizationData.logo)
            .field(getConstructorData(organizationData))
            .then((res)=>{
              res.status.should.eql(200);
              const organizationDataDuplicateUrl = OrganizationData[1];
              organizationDataDuplicateUrl.url = organizationData.url;
              return agent.post(`/api/organizations?access_token=${admin.access_token}`)
                  .attach('media', organizationDataDuplicateUrl.logo)
                  .field(getConstructorData(organizationDataDuplicateUrl))
                  .then((res)=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.OrganizationModelErrors.URLAlreadyExists);
                  });
            });
      });
    });
    describe('GET /api/organizations`', ()=>{
      const agent = chai.request.agent(app);
      let admin;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        await createOrg(admin.access_token, OrganizationData[0]);
      });
      it('Not logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations`).then((res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(2);
        });
      });
      it('Logged in (should succeed)', async ()=>{
        return agent.get(`/api/organizations?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(2);
        });
      });
    });
  });
};

export default organizationBasicsTest;
