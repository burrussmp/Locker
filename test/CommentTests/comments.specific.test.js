/* eslint-disable max-len */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';

import Employee from '@server/models/employee.model';
import Comment from '@server/models/comment.model';
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
  describe('Specific Comments Test', ()=>{
    describe('GET /api/comments/:commentId', ()=>{
      let admin; let comment;
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
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Get Comment: Execute (should work)', async ()=>{
        return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body._id.should.eql(comment._id);
          res.body.text.should.eql(CommentData[0].text);
        });
      });
      it('Get Comment: Not logged in (should fail)', async ()=>{
        return agent.get(`/api/comments/${comment._id}`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Get Comment: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Get Comment: CommentId doesn\'t exist (should fail)', async ()=>{
        return agent.get(`/api/comments/${admin._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Get Comment: CommentId Invalid (should fail)', async ()=>{
        return agent.get(`/api/comments/${12345}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Get Comment: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/comments/${comment._id}?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Comment: As employee (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/comments/${comment._id}?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('DELETE /api/comments/:commentId', ()=>{
      let admin; let post; let comment;
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
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Delete Comment: Execute (should work)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          const numComments = await Comment.countDocuments();
          numComments.should.eql(0);
        });
      });
      it('Delete Comment: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Delete Comment: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.delete(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Comment: Not owner but admin (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        const comment2 = await agent.post(`/api/${post._id}/comments?access_token=${user.access_token}`).send(CommentData[1]).then((res)=>res.body);
        return agent.delete(`/api/comments/${comment2._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Delete Comment: Not owner and not admin (should fail)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.delete(`/api/comments/${comment._id}?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.NotOwnerError);
        });
      });
      it('Delete Comment: CommentId doesn\'t exist (should fail)', async ()=>{
        return agent.delete(`/api/comments/${admin._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Delete Comment: CommentId Invalid (should fail)', async ()=>{
        return agent.delete(`/api/comments/${12345}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Delete Comment: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        const comment2 = await agent.post(`/api/${post._id}/comments?access_token=${user.access_token}`).send(CommentData[1]).then((res)=>res.body);
        return agent.delete(`/api/comments/${comment2._id}?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('PUT /api/comments/:commentId/likes', ()=>{
      let admin; let post; let comment;
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
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Like Comment: Execute (should work)', async ()=>{
        return agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            res.body.likes.should.eql(1);
          });
        });
      });
      it('Like Comment: Check if \'liked\' attribute works and is false and first and then true (should work)', async ()=>{
        return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.liked.should.be.false;
          return agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
              res.status.should.eql(200);
              res.body.liked.should.be.true;
            });
          });
        });
      });
      it('Like Comment: Execute twice and see if second is a no-op (should work)', async ()=>{
        return agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
              res.status.should.eql(200);
              res.body.likes.should.eql(1);
              res.body.liked.should.be.true;
            });
          });
        });
      });
      it('Like Comment:: Not logged in (should fail)', async ()=>{
        return agent.put(`/api/comments/${comment._id}/likes`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Like Comment: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Like Comment: CommentId doesn\'t exist (should fail)', async ()=>{
        return agent.put(`/api/comments/${admin._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Like Comment: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.put(`/api/comments/${comment._id}/likes?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Like Comment: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.put(`/api/comments/${comment._id}/likes?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
        });
      });
    });
    describe('DELETE /api/comments/:commentId/likes', ()=>{
      let admin; let post; let comment;
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
        await agent.put(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then();
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Unlike Comment: Execute (should work)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Unlike Comment: Check if \'liked\' attribute unset after delete (should work)', async ()=>{
        return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.liked.should.be.true;
          return agent.delete(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
              res.status.should.eql(200);
              res.body.liked.should.be.false;
            });
          });
        });
      });
      it('Unlike Comment: Execute twice and see if second is a no-op (should work)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.delete(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            return agent.get(`/api/comments/${comment._id}?access_token=${admin.access_token}`).then(async (res)=>{
              res.status.should.eql(200);
              res.body.likes.should.eql(0);
              res.body.liked.should.be.false;
            });
          });
        });
      });
      it('Unlike Comment: Never liked it, and is a no-op (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}?access_token=${user.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            res.body.likes.should.eql(1);
            res.body.liked.should.be.false;
          });
        });
      });
      it('Unlike Comment: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/likes`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Unlike Comment: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Unlike Comment: CommentId doesn\'t exist (should fail)', async ()=>{
        return agent.delete(`/api/comments/${admin._id}/likes?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Unlike Comment: As user (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Unlike Comment: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.delete(`/api/comments/${comment._id}/likes?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
        });
      });
    });
  });
};

export default commentsTest;
