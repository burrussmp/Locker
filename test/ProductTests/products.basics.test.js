/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';
import RBAC from '@server/models/rbac.model';
import Employee from '@server/models/employee.model';
import Product from '@server/models/product.model';
import Organization from '@server/models/organization.model';
import Media from '@server/models/media.model';
import {EmployeeData} from '@development/employee.data';
import {OrganizationData} from '@development/organization.data';
import {ProductData, getProductPostConstructor} from '@development/product.data';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/S3.services';

chai.use(chaiHttp);
chai.should();

const productBasicTests = () => {
  describe('Basics Test', ()=>{
    describe('POST /api/products`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let anyOrg; let newProductData;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
      });
      it('Create Product: Success (should)', async ()=>{
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product: Not logged in (should fail)', async ()=>{
        return createProductPostAgent(agent, newProductData).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Create Product: Bad permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Product: Missing media field which is required (should fail)', async ()=>{
        delete newProductData.media;
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
        });
      });
      it('Create Product: Media field is just some text (should fail)', async ()=>{
        const fieldData = getProductPostConstructor(newProductData);
        fieldData['media'] = 'some text';
        let postAgent = agent.post(`/api/products?access_token=${admin.access_token}`)
            .field(fieldData);
        for (let i = 0; i < newProductData.additional_media.length; ++i) {
          postAgent = postAgent.attach(`additional_media`, newProductData.additional_media[i]);
        }
        return postAgent.then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
        });
      });
      it('Create Product: Media not a support mimetype (should fail)', async ()=>{
        newProductData.media = process.cwd() + '/test/resources/profile3.txt';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(422);
          res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
        });
      });
      it('Create Product: Unexpected form-data field (should fail)', async ()=>{
        let postAgent = createProductPostAgent(agent, newProductData, admin.access_token);
        postAgent = postAgent.attach('404', process.cwd() + '/test/resources/profile3.txt');
        return postAgent.then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestUnexpectedField);
        });
      });
      it('Create Product: additional_media missing (should succeed because not required)', async ()=>{
        newProductData.additional_media = [];
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product: additional_media wrong type (should fail)', async ()=>{
        newProductData.additional_media = [process.cwd() + '/test/resources/profile3.txt'];
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(422);
          res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
        });
      });
      it('Create Product: Missing description (should fail)', async ()=>{
        newProductData.description = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.DescriptionRequired);
        });
      });
      it('Create Product: Missing price (should fail)', async ()=>{
        newProductData.price = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.PriceRequired);
        });
      });
      it('Create Product: \'approved\' is omitted but should be false (should succeed)', async ()=>{
        return createProductPostAgent(agent, newProductData, admin.access_token).then(async (res)=>{
          res.status.should.eql(200);
          const product = await Product.findById(res.body._id);
          product.approved.should.eql(false);
        });
      });
      it('Create Product: \'approved\' is true (should succeed)', async ()=>{
        newProductData.approved = true;
        return createProductPostAgent(agent, newProductData, admin.access_token).then(async (res)=>{
          res.status.should.eql(200);
          const product = await Product.findById(res.body._id);
          product.approved.should.eql(false);
        });
      });
      it('Create Product: Price is negative (should fail)', async ()=>{
        newProductData.price = '-0.1';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.NegativePrice);
        });
      });
      it('Create Product: Url is missing (should fail)', async ()=>{
        newProductData.url = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.UrlRequired);
        });
      });
      it('Create Product: Url is not unique (should fail)', async ()=>{
        const otherProductData = JSON.parse(JSON.stringify(ProductData[1]));
        otherProductData.organization = anyOrg._id.toString();
        otherProductData.url = newProductData.url;
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(200);
          return createProductPostAgent(agent, otherProductData, admin.access_token).then((res)=>{
            res.status.should.eql(400);
            res.body.error.should.eql(StaticStrings.ProductModelErrors.URLAlreadyExists);
          });
        });
      });
      it('Create Product: Missing name (should fail)', async ()=>{
        newProductData.name = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.NameRequired);
        });
      });
      it('Create Product: Missing organization (should fail)', async ()=>{
        newProductData.organization = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
        });
      });
      it('Create Product: Organization doesnt exist (should fail)', async ()=>{
        newProductData.organization = admin.id;
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
        });
      });
      it('Create Product: Check if Media and s3 successfully cleaned when saving product fails', async ()=>{
        const numMedia = await Media.countDocuments();
        const s3MediaCount = await S3Services.listObjectsS3();
        newProductData.url = '';
        return createProductPostAgent(agent, newProductData, admin.access_token).then(async (res)=>{
          res.status.should.eql(400);
          const numMediaNow = await Media.countDocuments();
          const s3MediaCountNow = await S3Services.listObjectsS3();
          numMediaNow.should.eql(numMedia);
          s3MediaCount.Contents.length.should.eql(s3MediaCountNow.Contents.length);
        });
      });
      it('Create Product: Supervisor can add a product (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, EmployeeData[0]);
        return createProductPostAgent(agent, newProductData, supervisor.access_token).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product: Employee can add a product (should succeed)', async ()=>{
        const employee = await createEmployee(admin, EmployeeData[1]);
        return createProductPostAgent(agent, newProductData, employee.access_token).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product: Add product to organization you are not a part, but admin (should succeed)', async ()=>{
        const otherOrg = await createOrg(admin.access_token, OrganizationData[0]);
        newProductData.organization = otherOrg._id.toString();
        return createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product: Add product to organization you are not a part, but supervisor (should fail)', async ()=>{
        const otherOrg = await createOrg(admin.access_token, OrganizationData[0]);
        const supervisor = await createEmployee(admin, EmployeeData[0]);
        newProductData.organization = otherOrg._id.toString();
        return createProductPostAgent(agent, newProductData, supervisor.access_token).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
        });
      });
    });
    describe('GET /api/products`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let anyOrg; let newProductData;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        await createProductPostAgent(agent, newProductData, admin.access_token).then();
      });
      it('List Products: Not logged in (should succeed)', async ()=>{
        return agent.get(`/api/products`).then(async (res) => {
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
      it('List Products: Logged in (should succeed)', async ()=>{
        return agent.get(`/api/products?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
      it('List Products: Query an organization (should succeed)', async ()=>{
        const otherOrg = await createOrg(admin.access_token, OrganizationData[0]);
        const query = `organization=${otherOrg._id.toString()}`;
        return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
          res.status.should.eql(200);
          res.body.length.should.eql(0);
        });
      });
      it('List Products: Query available false (should succeed)', async ()=>{
        const query = `available=false`;
        return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
          res.status.should.eql(200);
          res.body.length.should.eql(0);
        });
      });
      it('List Products: Query available true (should succeed)', async ()=>{
        const query = `available=true`;
        return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
    });
  });
};

export default productBasicTests;
