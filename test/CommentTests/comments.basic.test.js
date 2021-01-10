/* eslint-disable max-len */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';

import Employee from '@server/models/employee.model';
import RBAC from '@server/models/rbac.model';
import Organization from '@server/models/organization.model';

import {UserData} from '@development/user.data';
import {CommentData} from '@development/comments.data';
import {ProductData} from '@development/product.data';
import {EmployeeData, getEmployeeConstructor} from '@development/employee.data';

import {dropDatabase, createUser, createEmployee, loginAdminEmployee, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';


chai.use(chaiHttp);
chai.should();

const commentsTest = () => {
  describe('Basic Comments Test', ()=>{
    describe('POST /api/:postId/comments', ()=>{
      let admin; let post; let defaultComment;
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
        defaultComment = CommentData[0];
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Create Comment: Execute (should work)', async ()=>{
        return agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Comment: Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${post._id}/comments`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Create Comment: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Comment: Too long of comment (should fail)', async ()=>{
        const comment = {'text': new Array(302).join('a')};
        return agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(comment).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.MaxCommentSizeError);
        });
      });
      it('Create Comment: Empty comment (should fail)', async ()=>{
        const comment = {'text': ''};
        return agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(comment).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);
        });
      });
      it('Create Comment: Comment is all spaces (should fail)', async ()=>{
        const comment = {'text': '    '};
        return agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(comment).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);
        });
      });
      it('Create Comment: Post doesn\'t exist (should fail)', async ()=>{
        return agent.post(`/api/${1234}/comments?access_token=${admin.access_token}`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Create Comment: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.post(`/api/${post._id}/comments?access_token=${user.access_token}`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Comment: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.post(`/api/${post._id}/comments?access_token=${employee.access_token}`).send(defaultComment).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
    });
    describe('GET /api/:postId/comments', ()=>{
      let admin; let product; let post; let comment;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
        comment = await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(CommentData[0]).then((res)=>res.body);
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Get Comments: Post two comments from two different people and list comments (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        const comment2 = await agent.post(`/api/${post._id}/comments?access_token=${user.access_token}`).send(CommentData[1]).then((res)=>res.body);
        return agent.get(`/api/${post._id}/comments?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body[0]._id.should.eql(comment._id);
          res.body[0].postedBy.toString().should.eql(admin.id);
          res.body[0].text.should.eql(CommentData[0].text);
          res.body[1]._id.should.eql(comment2._id);
          res.body[1].postedBy.toString().should.eql(user._id);
          res.body[1].text.should.eql(CommentData[1].text);
        });
      });
      it('Get Comments: No comments, should be empty (should succeed)', async ()=>{
        const reqBody = {product: product._id};
        const post2 = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
        return agent.get(`/api/${post2._id}/comments?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.length.should.eql(0);
            });
      });
      it('Get Comments: Post doesn\'t exist (should fail)', async ()=>{
        return agent.get(`/api/${12345}/comments?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
        });
      });
      it('Get Comments: User deleted, comment should remain (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        await agent.delete(`/api/employees/${admin._id}/comments?access_token=${admin.access_token}`);
        return agent.get(`/api/${post._id}/comments?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body[0]._id.should.eql(comment._id);
          res.body[0].postedBy.toString().should.eql(admin.id);
          res.body[0].text.should.eql(CommentData[0].text);
        });
      });
      it('Get Comments: Post deleted comments should be removed (should succeed)', async ()=>{
        return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          await agent.delete(`/api/posts/${post._id}?access_token=${admin.access_token}`);
          return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(404);
            res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
          });
        });
      });
      it('Get Comments: As user (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/${post._id}/comments?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Comments: As employee (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/${post._id}/comments?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
  });
};

export default commentsTest;
