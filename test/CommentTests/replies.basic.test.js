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

const replyTest = () => {
  describe('Replies Basic Test', ()=>{
    describe('POST \'/api/:commentId/replies\'', ()=>{
      let admin; let comment; let defaultReply;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        const post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then((res)=>res.body);
        comment = await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(CommentData[0]).then((res)=>res.body);
        defaultReply = {text: 'This is a reply'};
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Create Reply: Execute and check if added to comment (should succeed)', async ()=>{
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send(defaultReply).then((res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).then((res)=>{
            res.status.should.eql(200);
            res.body.length.should.eql(1);
            res.body[0].should.have.property('text'); // the required
            res.body[0].text.should.eql(defaultReply.text);
          });
        });
      });
      it('Create Reply: Not logged in (should fail)', async ()=>{
        return agent.post(`/api/comments/${comment._id}/replies`).send(defaultReply).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Create Reply: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send(defaultReply).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Reply: Comment doesnt exist (should fail)', async ()=>{
        return agent.post(`/api/comments/${12345}/replies?access_token=${admin.access_token}`).send(defaultReply).then((res)=>{
          res.status.should.eql(404);
        });
      });
      it('Create Reply: Empty reply (should fail)', async ()=>{
        const reply = {text: ''};
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send(reply).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.CommentModelErrors.ReplyTextRequired);
        });
      });
      it('Create Reply: Reply is all spaces (should fail)', async ()=>{
        const reply = {text: '    '};
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send(reply).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.CommentModelErrors.ReplyTextRequired);
        });
      });
      it('Create Reply: Reply is all too long (should fail)', async ()=>{
        const reply = {text: new Array(302).join('a')};
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send(reply).then((res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.CommentModelErrors.MaxReplySizeError);
        });
      });
      it('Create Reply: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${user.access_token}`).send(defaultReply).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Reply: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${employee.access_token}`).send(defaultReply).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
    });
    describe('GET \'/api/:commentId/replies\'', ()=>{
      let admin; let comment; let post;
      const agent = chai.request.agent(app);
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then((res)=>res.body);
        comment = await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(CommentData[0]).then((res)=>res.body);
        await agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'This is a reply'}).then();
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('List Replies: Execute (should succeed)', async ()=>{
        return agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'test'}).then((res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).then((res)=>{
            res.status.should.eql(200);
            res.body.length.should.eql(2);
          });
        });
      });
      it('List Replies: Not logged in (should fail)', async ()=>{
        return agent.get(`/api/comments/${comment._id}/replies`).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('List Replies: No replies (should work)', async ()=>{
        const comment2 = await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`).send(CommentData[0]).then((res)=>res.body);
        return agent.get(`/api/comments/${comment2._id}/replies?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          res.body.length.should.eql(0);
        });
      });
      it('List Replies: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.get(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('List Replies: Comment doesnt exist (should fail)', async ()=>{
        return agent.get(`/api/comments/${12345}/replies?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
        });
      });
      it('Create Reply: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/comments/${comment._id}/replies?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Reply: As employee (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/comments/${comment._id}/replies?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
  });
};

export default replyTest;
