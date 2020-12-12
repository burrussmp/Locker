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
import {ProductData} from '@development/product.data';
import {dropDatabase, createEmployee, loginAdminEmployee, createOrg, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/S3.services';

chai.use(chaiHttp);
chai.should();

const productSpecificTest = () => {
  describe('Specific Test', ()=>{
    describe('GET /api/products/:productId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let anyOrg; let product;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
      });
      it('Get Product: Not logged in (should succeed)', async ()=>{
        return agent.get(`/api/products/${product._id}`).then(async (res) => {
          res.status.should.eql(200);
          res.body._id.should.eql(product._id);
        });
      });
      it('Get Product: No permissions (should succeed)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
        return agent.get(`/api/products/${product._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
          res.body._id.should.eql(product._id);
        });
      });
      it('Get Product: Logged in (should succeed)', async ()=>{
        return agent.get(`/api/products/${product._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
          res.body._id.should.eql(product._id);
        });
      });
      it('Get Product: Product not found (should fail)', async ()=>{
        return agent.get(`/api/products/${anyOrg._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
        });
      });
    });
    describe('DELETE /api/products/:productId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let anyOrg; let product;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
      });
      it('Delete Product: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/products/${product._id}`).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Delete Product: No permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
        return agent.delete(`/api/products/${product._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Product: Product not found (should fail)', async ()=>{
        return agent.delete(`/api/products/${anyOrg._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
        });
      });
      it('Delete Product: Product and requester (not admin) are not part of same organization (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        return agent.delete(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
        });
      });
      it('Delete Product: Product and requester are not part of same organization but admin (should succeed)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        const adminRole = await RBAC.findOne({role: 'admin'});
        await Employee.findByIdAndUpdate(employeeOtherOrg.id, {permissions: adminRole._id});
        return agent.delete(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Delete Product: Product and requester (not admin) are not part of same organization (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        return agent.delete(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
        });
      });
      it('Delete Product: Supervisor deleting (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, EmployeeData[0]);
        return agent.delete(`/api/products/${product._id}?access_token=${supervisor.access_token}`).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Delete Product: Employee deleting (should succeed)', async ()=>{
        const employee = await createEmployee(admin, EmployeeData[1]);
        return agent.delete(`/api/products/${product._id}?access_token=${employee.access_token}`).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Delete Product: S3 and media properly cleaned (should succeed)', async ()=>{
        const numMedia = await Media.countDocuments();
        const numProducts = await Product.countDocuments();
        const s3MediaCount = await S3Services.listObjectsS3();
        return agent.delete(`/api/products/${product._id}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
          const numMediaNow = await Media.countDocuments();
          const s3MediaCountNow = await S3Services.listObjectsS3();
          numMediaNow.should.be.below(numMedia);
          s3MediaCountNow.Contents.length.should.be.below(s3MediaCount.Contents.length);
          const numProductsNow = await Product.countDocuments();
          numProducts.should.eql(numProductsNow+1);
        });
      });
    });
    describe('PUT /api/products/:productId`', ()=>{
      const agent = chai.request.agent(app);
      let admin; let anyOrg; let product;
      const defaultUpdate = {'name': 'new_name'};
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
      });
      it('Update Product: Not logged in (should fail)', async ()=>{
        return agent.put(`/api/products/${product._id}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Update Product: No permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {permissions: role._id});
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Update Product: Product not found (should fail)', async ()=>{
        return agent.put(`/api/products/${anyOrg._id}?access_token=${admin.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
        });
      });
      it('Update Product: Product and requester (not admin) are not part of same organization (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        return agent.put(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
        });
      });
      it('Update Product: Product and requester are not part of same organization but admin (should succeed)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        const adminRole = await RBAC.findOne({role: 'admin'});
        await Employee.findByIdAndUpdate(employeeOtherOrg.id, {permissions: adminRole._id});
        return agent.put(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Update Product: Product and requester (not admin) are not part of same organization (should fail)', async ()=>{
        await createOrg(admin.access_token, OrganizationData[0]);
        const employeeOtherOrg = await createEmployee(admin, EmployeeData[4]);
        return agent.put(`/api/products/${product._id}?access_token=${employeeOtherOrg.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg);
        });
      });
      it('Update Product: Make request as Supervisor (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, EmployeeData[0]);
        return agent.put(`/api/products/${product._id}?access_token=${supervisor.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Update Product: Make request as Employee (should succeed)', async ()=>{
        const employee = await createEmployee(admin, EmployeeData[1]);
        return agent.put(`/api/products/${product._id}?access_token=${employee.access_token}`).send(defaultUpdate).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Update Product: Name update is empty (should fail)', async ()=>{
        const update = {'name': '  '};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.NameRequired);
        });
      });
      it('Update Product: URL update is empty (should fail)', async ()=>{
        const update = {'url': '  '};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.UrlRequired);
        });
      });
      it('Update Product: Description update is empty (should fail)', async ()=>{
        const update = {'description': '  '};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.DescriptionRequired);
        });
      });
      it('Update Product: Price update is empty and makes price 0 (should succeed)', async ()=>{
        const update = {'price': '  '};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.price.should.eql(0);
        });
      });
      it('Update Product: Set approved to true (should fail)', async ()=>{
        const update = {'approved': true};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          const product = await Product.findById(res.body._id);
          product.approved.should.eql(true);
        });
      });
      it('Update Product: Price update is negative (should fail)', async ()=>{
        const update = {'price': '-0.1'};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.ProductModelErrors.NegativePrice);
        });
      });
      it('Update Product: Available is a truthy \'True\' (should succeed)', async ()=>{
        const update = {'available': 1};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.available.should.be.true;
        });
      });
      it('Update Product: Available is \'false\' (should succeed)', async ()=>{
        const update = {'available': false};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.available.should.be.false;
        });
      });
      it('Update Product: Tags a proper array of strings (should succeed)', async ()=>{
        const update = {'tags': ['a', 'b', 'c']};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.tags.should.eql(['a', 'b', 'c']);
        });
      });
      it('Update Product: Tags empty array (should succeed)', async ()=>{
        const update = {'tags': []};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.tags.should.eql([]);
        });
      });
      it('Update Product: Sizes a proper array of strings (should succeed)', async ()=>{
        const update = {'sizes': ['a', 'b', 'c']};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.sizes.should.eql(['a', 'b', 'c']);
        });
      });
      it('Update Product: Sizes empty array (should succeed)', async ()=>{
        const update = {'tags': []};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          res.body.tags.should.eql([]);
        });
      });
      it('Update Product: Meta empty json (should succeed)', async ()=>{
        const update = {'meta': JSON.stringify({})};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(200);
          (res.body.meta == undefined || res.body.meta == null).should.be.true;
        });
      });
      it('Update Product: Meta proper stringified json (should succeed)', async ()=>{
        const update = {'meta': JSON.stringify({'a': 1})};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.body.meta.should.eql({'a': 1});
        });
      });
      it('Update Product: Not an acceptable key (should fail)', async ()=>{
        const update = {'organization': 'new organzation'};
        return agent.put(`/api/products/${product._id}?access_token=${admin.access_token}`).send(update).then(async (res) => {
          res.status.should.eql(422);
          res.body.error.should.include(StaticStrings.BadRequestInvalidFields);
        });
      });
    });
  });
};

export default productSpecificTest;
