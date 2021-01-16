/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '@server/server';
import RBAC from '@server/models/rbac.model';
import Employee from '@server/models/employee.model';
import Collection from '@server/models/collection.model';
import Organization from '@server/models/organization.model';
import Media from '@server/models/media.model';
import { EmployeeData } from '@development/employee.data';
import { OrganizationData } from '@development/organization.data';
import { ProductData } from '@development/product.data';
import { CollectionData } from '@development/collection.data';
import {
  createProduct, createCollection, dropDatabase, createEmployee, loginAdminEmployee, createOrg,
} from '@test/helper';
import StaticStrings from '@config/StaticStrings';

chai.use(chaiHttp);
chai.should();

const createProductList = async (organizationID, accessToken, numProducts = 1) => {
  const productList = [];
  for (let i = 0; i < numProducts; i += 1) {
    const newProductData = JSON.parse(JSON.stringify(ProductData[i]));
    newProductData.organization = organizationID;
    productList.push(
      (await createProduct(newProductData, accessToken))._id,
    );
  }
  return productList;
};

const collectionSpecificTest = () => {
  describe('Collection Specific Test', () => {
    const url = '/api/collections';
    describe(`PUT ${url}/:collectionId`, () => {
      const agent = chai.request.agent(app);
      let admin; let collection; let newCollectionData;
      const defaultUpdate = { name: 'new name' };
      beforeEach(async () => {
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const productList = await createProductList(anyOrg._id.toString(), admin.access_token, 1);
        newCollectionData = JSON.parse(JSON.stringify(CollectionData[0]));
        newCollectionData.organization = anyOrg._id.toString();
        newCollectionData.product_list = productList;
        collection = await createCollection(newCollectionData, admin.access_token);
      });
      after(async () => {
        await dropDatabase();
      });
      it('Update Collections: Success', async () => agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
        .send(defaultUpdate)
        .then(async (res) => {
          res.status.should.eql(200);
          res.body.name.should.eql(defaultUpdate.name);
        }));
      it('Update Collections: Empty update (do nothing)', async () => {
        const collectionData = JSON.parse(JSON.stringify(await Collection.findById(collection._id)));
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send({})
          .then(async (res) => {
            res.status.should.eql(200);
            for (const key of Object.keys(res.body)) {
              res.body[key].should.eql(collectionData[key]);
            }
          });
      });
      it('Update Collections: Update "name" success', async () => {
        const update = { name: 'new name' };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send(update)
          .then(async (res) => {
            res.status.should.eql(200);
            res.body.name.should.eql(update.name);
          });
      });
      it('Update Collections: Update "description" success', async () => {
        const update = { description: 'new description' };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send(update)
          .then(async (res) => {
            res.status.should.eql(200);
            res.body.description.should.eql(update.description);
          });
      });
      it('Update Collections: Update "product_list" success', async () => {
        const update = { product_list: [] };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send(update)
          .then(async (res) => {
            res.status.should.eql(200);
            res.body.product_list.should.eql(update.product_list);
          });
      });
      it('Update Collections: Update "tags" success', async () => {
        const update = { tags: ['tag1', 'tag2'] };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .field(update)
          .then(async (res) => {
            res.status.should.eql(200);
            res.body.tags.should.eql(update.tags);
          });
      });
      it('Update Collections: Update "visible" success', async () => {
        const update = { visible: false };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .field(update)
          .then(async (res) => {
            res.status.should.eql(200);
            res.body.visible.should.eql(update.visible);
          });
      });
      it('Update Collections: Update "hero" field (success)', async () => {
        const mediaCount = await Media.countDocuments();
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .attach('hero', newCollectionData.hero)
          .then(async (res) => {
            res.status.should.eql(200);
            const media = await Media.findById(res.body.hero);
            (media === null || media === undefined).should.be.false;
            const newMediaCount = await Media.countDocuments();
            mediaCount.should.eql(newMediaCount);
          });
      });
      it('Update Collections: "hero" invalid mime type (failure)', async () => {
        const mediaCount = await Media.countDocuments();
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .attach('hero', `${process.cwd()}/test/resources/profile3.txt`)
          .then(async (res) => {
            res.status.should.eql(422);
            res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
            const newMediaCount = await Media.countDocuments();
            mediaCount.should.eql(newMediaCount);
          });
      });
      it('Update Collections: "hero" valid but update invalid (failure)', async () => {
        const mediaCount = await Media.countDocuments();
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .attach('hero', newCollectionData.hero)
          .field({ product_list: ['invalid'] })
          .then(async (res) => {
            res.status.should.eql(400);
            const newMediaCount = await Media.countDocuments();
            mediaCount.should.eql(newMediaCount);
          });
      });
      it('Update Collections: Update invalid field (failure)', async () => {
        const update = { 404: 'bad field' };
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send(update)
          .then(async (res) => {
            res.status.should.eql(422);
            res.body.error.should.include(StaticStrings.BadRequestInvalidFields);
          });
      });
      it('Update Collections: Not logged in (failure)', async () => agent.put(`${url}/${collection._id}`).then(async (res) => {
        res.status.should.eql(401);
        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
      }));
      it('Update Collection: Bad permissions (failure)', async () => {
        const role = await RBAC.findOne({ role: 'none' });
        await Employee.findByIdAndUpdate(admin.id, { permissions: role._id });
        return agent.put(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .send(defaultUpdate)
          .then(async (res) => {
            res.status.should.eql(403);
            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
          });
      });
      it('Update Collection: Collection not found (failure)', async () => agent.put(`${url}/${admin.id}?access_token=${admin.access_token}`)
        .send(defaultUpdate)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Update Collection: CollectionId is invalid (failure)', async () => agent.put(`${url}/${1234}?access_token=${admin.access_token}`)
        .send(defaultUpdate)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Update Collection: Employee can update collection (success)', async () => {
        const employee = await createEmployee(admin, EmployeeData[1]);
        return agent.put(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .send(defaultUpdate)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
      it('Update Collection: Employee from another org cannot update (failure)', async () => {
        await createOrg(admin.access_token, OrganizationData[0]);
        const employee = await createEmployee(admin, EmployeeData[3]);
        return agent.put(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .send(defaultUpdate)
          .then(async (res) => {
            res.status.should.eql(401);
            res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
          });
      });
    });
    describe(`DELETE ${url}/:collectionId`, () => {
      const agent = chai.request.agent(app);
      let admin; let collection; let newCollectionData;
      beforeEach(async () => {
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const productList = await createProductList(anyOrg._id.toString(), admin.access_token, 1);
        newCollectionData = JSON.parse(JSON.stringify(CollectionData[0]));
        newCollectionData.organization = anyOrg._id.toString();
        newCollectionData.product_list = productList;
        collection = await createCollection(newCollectionData, admin.access_token);
      });
      after(async () => {
        await dropDatabase();
      });
      it('Delete Collections: Success', async () => {
        const numCollections = await Collection.countDocuments();
        const numMedia = await Media.countDocuments();
        agent.delete(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
            (await Collection.countDocuments()).should.equal(numCollections - 1);
            (await Media.countDocuments()).should.equal(numMedia - 1);
          });
      });
      it('Delete Collections: Not logged in (failure)', async () => agent.delete(`${url}/${collection._id}`).then(async (res) => {
        res.status.should.eql(401);
        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
      }));
      it('Delete Collection: Bad permissions (failure)', async () => {
        const role = await RBAC.findOne({ role: 'none' });
        await Employee.findByIdAndUpdate(admin.id, { permissions: role._id });
        return agent.delete(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .then(async (res) => {
            res.status.should.eql(403);
            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
          });
      });
      it('Update Collection: Collection not found (failure)', async () => agent.delete(`${url}/${admin.id}?access_token=${admin.access_token}`)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Update Collection: CollectionId is invalid (failure)', async () => agent.delete(`${url}/${1234}?access_token=${admin.access_token}`)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Update Collection: Employee can delete collection (success)', async () => {
        const employee = await createEmployee(admin, EmployeeData[1]);
        return agent.delete(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
      it('Update Collection: Employee from another org cannot update (failure)', async () => {
        await createOrg(admin.access_token, OrganizationData[0]);
        const employee = await createEmployee(admin, EmployeeData[3]);
        return agent.delete(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .then(async (res) => {
            res.status.should.eql(401);
            res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
          });
      });
    });
    describe(`GET ${url}/:collectionId`, () => {
      const agent = chai.request.agent(app);
      let admin; let collection; let newCollectionData;
      beforeEach(async () => {
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const productList = await createProductList(anyOrg._id.toString(), admin.access_token, 1);
        newCollectionData = JSON.parse(JSON.stringify(CollectionData[0]));
        newCollectionData.organization = anyOrg._id.toString();
        newCollectionData.product_list = productList;
        collection = await createCollection(newCollectionData, admin.access_token);
      });
      after(async () => {
        await dropDatabase();
      });
      it('Get Collection: Success', async () => {
        agent.get(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
      it('Get Collection: Not logged in (success)', async () => agent.get(`${url}/${collection._id}`).then(async (res) => {
        res.status.should.eql(200);
      }));
      it('Get Collection: No permissions (success)', async () => {
        const role = await RBAC.findOne({ role: 'none' });
        await Employee.findByIdAndUpdate(admin.id, { permissions: role._id });
        return agent.get(`${url}/${collection._id}?access_token=${admin.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
      it('Get Collection: Collection not found (failure)', async () => agent.get(`${url}/${admin.id}?access_token=${admin.access_token}`)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Get Collection: CollectionId is invalid (failure)', async () => agent.get(`${url}/${1234}?access_token=${admin.access_token}`)
        .then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CollectionControllerErrors.NotFoundError);
        }));
      it('Get Collection: Employee can get collection (success)', async () => {
        const employee = await createEmployee(admin, EmployeeData[1]);
        return agent.get(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
      it('Get Collection: Employee can get collection from another organization (success)', async () => {
        await createOrg(admin.access_token, OrganizationData[0]);
        const employee = await createEmployee(admin, EmployeeData[3]);
        return agent.get(`${url}/${collection._id}?access_token=${employee.access_token}`)
          .then(async (res) => {
            res.status.should.eql(200);
          });
      });
    });
  });
};

export default collectionSpecificTest;
