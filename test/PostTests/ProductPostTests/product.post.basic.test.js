/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';

import Employee from '@server/models/employee.model';
import RBAC from '@server/models/rbac.model';
import Organization from '@server/models/organization.model';
import Post from '@server/models/post.model';

import {UserData} from '@development/user.data';
import {ProductData} from '@development/product.data';
import {EmployeeData, getEmployeeConstructor} from '@development/employee.data';

import {dropDatabase, createUser, createEmployee, loginAdminEmployee, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';

chai.use(chaiHttp);
chai.should();

const productPostTestBasics = () => {
  describe('Product Post Test Basics', ()=>{
    describe('POST \'/api/posts\'', ()=>{
      let admin; let anyOrg; let product;
      const agent = chai.request.agent(app);
      let reqBody;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        reqBody = {
          product: product._id,
          caption: newProductData.caption,
          tags: newProductData.tags,
        };
      });
      it('Create Product Post: Successfully create a product post and see if media matches in S3! (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Product Post: Not logged in: (should fail)', async ()=>{
        return agent.post(`/api/posts?type=Product`).send({'product': product._id}).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Create Product Post: Incorrect query parameter \'type\' (not implemented) (should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=NotImplemented`).send(reqBody).then(async (res)=>{
          res.status.should.eql(501);
          res.body.error.should.eql(StaticStrings.NotImplementedError);
        });
      });
      it('Create Product Post: Caption too long (should fail)', async ()=>{
        reqBody.caption = new Array(302).join('a');
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
        });
      });
      it('Create Product Post: Missing caption (should succeed)', async ()=>{
        delete reqBody.caption;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: Too many tags (should fail)', async ()=>{
        reqBody.tags = ['tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaximumNumberOfTags);
        });
      });
      it('Create Product Post: Tag field is too long (should fail)', async ()=>{
        reqBody.tags = ['tooLongOfATagThisShouldFailQuickly'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaxLengthTag);
        });
      });
      it('Create Product Post: Tag field cannot have anything besides letters (should fail)', async ()=>{
        reqBody.tags = ['tag1'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.TagMustBeAlphabetical);
        });
      });
      it('Create Product Post: Missing tags (should succeed)', async ()=>{
        delete reqBody.tags;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: \'product\' field missing (should fail)', async ()=>{
        delete reqBody.product;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.MissingRequiredField);
        });
      });
      it('Create Product Post: \'product\' not found (should fail)', async ()=>{
        reqBody.product = admin.id.toString();
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
        });
      });
      it('Create Product Post: \'product\' not a valid ID (should fail)', async ()=>{
        reqBody.product = 'an invalid ID';
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
        });
      });
      it('Create Product Post: Product model cleaned up when error in creating basic post model (should fail)', async ()=>{
        reqBody.tags = ['tags1'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          const numProductPosts = await Post.countDocuments();
          numProductPosts.should.eql(0);
        });
      });
      it('Create Product Post: Check if a user can create a post (should fail)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.post(`/api/posts?access_token=${user.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Product Post: Check if a supervisor can create a post (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.post(`/api/posts?access_token=${supervisor.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: Check if a employee can create a post (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.post(`/api/posts?access_token=${employee.access_token}&type=Product`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('GET \'/api/posts\'', ()=>{
      let admin;
      const agent = chai.request.agent(app);
      let product;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
      });
      it('List Posts: Execute (should succeed)', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
      it('List Posts: Not logged in (should fail)', async ()=>{
        return agent.get(`/api/posts?`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('List Posts: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.get(`/api/posts?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('List Posts: Invalid query parameter \'type\' (should succeed and return 0)', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}&type=NotImplememted`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(0);
        });
      });
      it('List Posts: Query parameter "product" invalid (should return 400)', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}&product=1234567`).then(async (res)=>{
          res.status.should.eql(400);
        });
      });
      it('List Posts: Query parameter "product" not found (should return 404)', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}&product=${admin.id}`).then(async (res)=>{
          res.status.should.eql(404);
        });
      });
      it('List Posts: Query parameter "product" found. Should return 200 with product info', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}&product=${product._id.toString()}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.content._id.should.eql(product._id.toString());
        });
      });
      it('List Posts: Correct query parameter \'type=Product\' (should succeed and return 1)', async ()=>{
        return agent.get(`/api/posts?access_token=${admin.access_token}&type=Product`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
      it('List Posts: Check if a user can list posts (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/posts?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
      it('List Posts: Check if a employee can list posts (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/posts?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(1);
        });
      });
    });
  });
};

export default productPostTestBasics;
