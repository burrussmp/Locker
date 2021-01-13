/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';
import RBAC from '@server/models/rbac.model';
import Employee from '@server/models/employee.model';
import Product from '@server/models/product.model';
import Collection from '@server/models/collection.model';
import Organization from '@server/models/organization.model';
import Media from '@server/models/media.model';
import {EmployeeData} from '@development/employee.data';
import {OrganizationData} from '@development/organization.data';
import {ProductData, getProductPostConstructor} from '@development/product.data';
import { CollectionData, getCollectionConstructor } from '@development/collection.data';
import {createProduct, dropDatabase, createEmployee, loginAdminEmployee, createOrg, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/S3.services';

chai.use(chaiHttp);
chai.should();

const createProductList = async (organizationID, accessToken, numProducts = 1) => {
  let productList = []
  for (let i = 0; i < numProducts; ++i){
    let newProductData = JSON.parse(JSON.stringify(ProductData[i]));
    newProductData.organization = organizationID;
    productList.push(
      await createProduct(newProductData, accessToken)
    )
  }
  return productList;
};


const collectionBasicsTest = () => {
  describe('Basics Test', ()=>{
    describe('POST /api/collections`', ()=>{

      const agent = chai.request.agent(app);
      const url = '/api/collections';

      let admin; let anyOrg;
      let employee;
      let newCollectionData;
      let productList;
      
      before(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        employee = await createEmployee(admin, EmployeeData[1]);
        anyOrg = await Organization.findOne();
        productList = await createProductList(anyOrg._id.toString(), admin.access_token, 1);
      });
      beforeEach(async () => {
        anyOrg = await Organization.findOne();
        newCollectionData = JSON.parse(JSON.stringify(CollectionData[0]));
        newCollectionData.organization = anyOrg._id.toString();
        newCollectionData.product_list = productList;
      })
      it('Create Collection: Success', async ()=>{
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Not logged in (should fail)', async ()=>{
        return agent.post(`${url}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Create Collection: Bad permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              const role = await RBAC.findOne({'role': 'admin'});
              await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
            });
      });
      it('Create Collection: Missing name (should fail)', async ()=>{
        newCollectionData.name = '';
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CollectionModelErrors.NameRequired);
            });
      });
      it('Create Collection: Name too long (should fail)', async ()=>{
        newCollectionData.name = new Array(26).join('a');
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CollectionModelErrors.NameExceededLength);
            });
      });
      it('Create Collection: Missing organization (should fail)', async ()=>{
        delete newCollectionData.organization;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CollectionModelErrors.OrganizationRequired);
            });
      });
      it('Create Collection: Organization not found (should fail)', async ()=>{
        newCollectionData.organization = admin.id;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Create Collection: Missing hero field which is not required (should succeed)', async ()=>{
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Description too long (should fail)', async ()=>{
        newCollectionData.description = new Array(202).join('a');
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CollectionModelErrors.DescriptionExceededLength);
            });
      });
      it('Create Collection: Hero image is unsupported mimetype', async ()=>{
        newCollectionData.hero = process.cwd() + '/test/resources/profile3.txt';
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
            });
      });
      it('Create Collection: Unexpected form-data field (should fail)', async ()=>{
        newCollectionData.hero = process.cwd() + '/test/resources/profile3.txt';
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('404', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestUnexpectedField);
            });
      });
      it('Create Collection: Missing description (should succeed)', async ()=>{
        delete newCollectionData.description;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Missing tags (should succeed)', async ()=>{
        delete newCollectionData.tags;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Empty product list (should succeed)', async ()=>{
        newCollectionData.product_list = [];
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Properly cleans up image if hero provided and save fails', async ()=>{
        const numMedia = await Media.countDocuments();
        newCollectionData.organization = admin.id;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(400);
              const numMediaNow = await Media.countDocuments();
              numMediaNow.should.eql(numMedia);
            });
      });
      it('Create Collection: Properly fails if failed save and hero not provided', async ()=>{
        newCollectionData.organization = admin.id;
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(400);
            });
      });
      it('Create Collection: Supervisor can add a collection (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, EmployeeData[0]);
        return agent.post(`${url}?access_token=${supervisor.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Employee can add a collection (should succeed)', async ()=>{
        return agent.post(`${url}?access_token=${employee.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Add collection to organization you are not a part, but admin (should succeed)', async ()=>{
        const otherOrg = await createOrg(admin.access_token, OrganizationData[0]);
        newCollectionData.organization = otherOrg._id.toString();
        return agent.post(`${url}?access_token=${admin.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(200);
            });
      });
      it('Create Collection: Add collection to organization you are not a part (should fail)', async ()=>{
        const otherOrg = await createOrg(admin.access_token, OrganizationData[1]);
        newCollectionData.organization = otherOrg._id.toString();
        return agent.post(`${url}?access_token=${employee.access_token}`)
            .attach('hero', newCollectionData.hero)
            .field(getCollectionConstructor(newCollectionData))
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg)
            });
      });
    });
    // describe('GET /api/products`', ()=>{
    //   const agent = chai.request.agent(app);
    //   let admin; let anyOrg; let newProductData;
    //   beforeEach(async ()=>{
    //     await dropDatabase();
    //     admin = await loginAdminEmployee();
    //     anyOrg = await Organization.findOne();
    //     newProductData = JSON.parse(JSON.stringify(ProductData[0]));
    //     newProductData.organization = anyOrg._id.toString();
    //     await createProductPostAgent(agent, newProductData, admin.access_token).then();
    //   });
    //   it('List Products: Not logged in (should succeed)', async ()=>{
    //     return agent.get(`/api/products`).then(async (res) => {
    //       res.status.should.eql(200);
    //       res.body.length.should.eql(1);
    //     });
    //   });
    //   it('List Products: Logged in (should succeed)', async ()=>{
    //     return agent.get(`/api/products?access_token=${admin.access_token}`).then(async (res) => {
    //       res.status.should.eql(200);
    //       res.body.length.should.eql(1);
    //     });
    //   });
    //   it('List Products: Query an organization (should succeed)', async ()=>{
    //     const otherOrg = await createOrg(admin.access_token, OrganizationData[0]);
    //     const query = `organization=${otherOrg._id.toString()}`;
    //     return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
    //       res.status.should.eql(200);
    //       res.body.length.should.eql(0);
    //     });
    //   });
    //   it('List Products: Query available false (should succeed)', async ()=>{
    //     const query = `available=false`;
    //     return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
    //       res.status.should.eql(200);
    //       res.body.length.should.eql(0);
    //     });
    //   });
    //   it('List Products: Query available true (should succeed)', async ()=>{
    //     const query = `available=true`;
    //     return agent.get(`/api/products?access_token=${admin.access_token}&${query}`).then(async (res) => {
    //       res.status.should.eql(200);
    //       res.body.length.should.eql(1);
    //     });
    //   });
    // });
  });
};

export default collectionBasicsTest;
