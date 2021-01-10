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
  describe('Product Post Specific', ()=>{
    describe('GET \'/api/posts/:postId\'', ()=>{
      let admin; let post;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
      });
      it('Get Posts: Execute (should succeed)', async ()=>{
        return agent.get(`/api/posts/${post._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body._id.should.eql(post._id.toString());
        });
      });
      it('Get Posts: Not logged in (should fail)', async ()=>{
        return agent.get(`/api/posts/${post._id}`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Get Post: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.get(`/api/posts/${post._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Get Post: Post ID invalid (should fail)', async ()=>{
        return agent.get(`/api/posts/${123456}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Get Post: Post ID not found (should fail)', async ()=>{
        return agent.get(`/api/posts/${admin.id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Get Post: User can do it (should fail)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/posts/${post._id}?access_token=${user.access_token}`).then((res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Post: Employee can do it (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/posts/${post._id}?access_token=${employee.access_token}`).then((res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('DELETE \'/api/posts/:postId\'', ()=>{
      let admin; let post;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
      });
      it('Delete Post: Execute (should succeed)', async ()=>{
        return agent.delete(`/api/posts/${post._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          const numPosts = await Post.countDocuments();
          numPosts.should.eql(0);
        });
      });
      it('Delete Post: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/posts/${post._id}`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Delete Post: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.delete(`/api/posts/${post._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Post: Post ID invalid (should fail)', async ()=>{
        return agent.delete(`/api/posts/${123456}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Delete Post: Post ID not found (should fail)', async ()=>{
        return agent.delete(`/api/posts/${admin.id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Delete Post: Not owner (Second should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.delete(`/api/posts/${post._id}?access_token=${employee.access_token}`).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.NotOwnerError);
        });
      });
      it('Delete Post: Check if a employee can delete post (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        await Post.findByIdAndUpdate(post._id, {'postedBy': employee.id});
        return agent.delete(`/api/posts/${post._id}?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('PUT \'/api/posts/:postId\'', ()=>{
      let admin; let post; let defaultUpdate;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
        defaultUpdate = {'tags': ['tag', 'tag']};
      });
      it('Update Post: Execute (should succeed)', async ()=>{
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(defaultUpdate).then(async (res)=>{
          res.status.should.eql(200);
          const updatedPost = await Post.findById(res.body._id);
          updatedPost.tags.should.eql(defaultUpdate.tags);
        });
      });
      it('Update Post: Not logged in (should fail)', async ()=>{
        return agent.put(`/api/posts/${post._id}`).send(defaultUpdate).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Update Post: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(defaultUpdate).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Update Post: Post ID invalid (should fail)', async ()=>{
        return agent.put(`/api/posts/${123456}?access_token=${admin.access_token}`).send(defaultUpdate).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Update Post: Post ID not found (should fail)', async ()=>{
        return agent.put(`/api/posts/${admin.id}?access_token=${admin.access_token}`).send(defaultUpdate).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Update Post: Not owner (Second should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.put(`/api/posts/${post._id}?access_token=${employee.access_token}`).send(defaultUpdate).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.NotOwnerError);
        });
      });
      it('Update Post: Caption change valid (should succeed)', async ()=>{
        const update = {'caption': 'A new caption'};
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(update).then(async (res)=>{
          res.status.should.eql(200);
          const updatedPost = await Post.findById(res.body._id);
          updatedPost.caption.should.eql(update.caption);
        });
      });
      it('Update Post: Empty caption should remove caption (should succeed)', async ()=>{
        const update = {'caption': ''};
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(update).then(async (res)=>{
          res.status.should.eql(200);
          const updatedPost = await Post.findById(res.body._id);
          updatedPost.caption.should.eql(update.caption);
        });
      });
      it('Update Post: Validation still works (caption too long) (should fail)', async ()=>{
        const update = {'caption': new Array(302).join('a')};
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(update).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
        });
      });
      it('Update Post: Empty tag(s) array should remove tags (should succeed)', async ()=>{
        const update = {'tags': []};
        return agent.put(`/api/posts/${post._id}?access_token=${admin.access_token}`).send(update).then(async (res)=>{
          res.status.should.eql(200);
          const updatedPost = await Post.findById(res.body._id);
          updatedPost.tags.should.eql([]);
        });
      });
      it('Update Post: Check if a user can update post (should fail because invalid permissions)', async ()=>{
        const user = await createUser(UserData[0]);
        await Post.findByIdAndUpdate(post._id, {'postedBy': user._id});
        return agent.put(`/api/posts/${post._id}?access_token=${user.access_token}`).send(defaultUpdate).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Update Post: Check if a employee can update post (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        await Post.findByIdAndUpdate(post._id, {'postedBy': employee.id});
        return agent.put(`/api/posts/${post._id}?access_token=${employee.access_token}`).send(defaultUpdate).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
  });
};

export default productPostTestBasics;
