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

const replySpecific = () => {
  describe('Replies Specific Test', ()=>{
    describe('GET \'/api/:commentId/replies/:replyId\'', ()=>{
      let admin; let comment; let reply;
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
        reply = await agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'test'}).then((res)=>res.body);
      });
      after(async ()=>{
        await dropDatabase();
      });
    //   it('Get Reply: Execute (should succeed)', async ()=>{
    //     return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(200);
    //       res.body.postedBy.should.eql(admin.id.toString());
    //       res.body.likes.should.eql(0);
    //       res.body.liked.should.be.false;
    //       res.body.text.should.eql('test');
    //     });
    //   });
    //   it('Get Reply: Not logged in (should fail)', async ()=>{
    //     return agent.get(`/api/comments/${comment._id}/replies/${reply._id}`).then((res)=>{
    //       res.status.should.eql(401);
    //       res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
    //     });
    //   });
    //   it('Get Reply: Insufficient permissions  (should fail)', async ()=>{
    //     const role = await RBAC.findOne({'role': 'none'});
    //     await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
    //     return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(403);
    //       res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //     });
    //   });
    //   it('Get Reply: Comment doesnt exist  (should fail)', async ()=>{
    //     return agent.get(`/api/comments/${123456}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(404);
    //       res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
    //     });
    //   });
    //   it('Get Reply: Reply doesnt exist  (should fail)', async ()=>{
    //     return agent.get(`/api/comments/${comment._id}/replies/${1234}?access_token=${admin.access_token}`).then((res)=>{
    //       res.status.should.eql(404);
    //       res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
    //     });
    //   });
    //   it('Get Reply: As user (should work)', async ()=>{
    //     const user = await createUser(UserData[0]);
    //     return agent.get(`/api/comments/${comment._id}/replies/replies/${reply._id}?access_token=${user.access_token}`).then(async (res)=>{
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('Get Reply: As employee (should succeed)', async ()=>{
    //     const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
    //     return agent.get(`/api/comments/${comment._id}/replies/replies/${reply._id}?access_token=${employee.access_token}`).then(async (res)=>{
    //       res.status.should.eql(200);
    //     });
    //   });
    });
    describe('DELETE \'/api/:commentId/replies/:replyId\'', ()=>{
      let admin; let comment; let reply;
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
        reply = await agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'test'}).then((res)=>res.body);
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Delete Reply: Execute (should succeed)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).then((res)=>{
            res.body.length.should.eql(0);
          });
        });
      });
      it('Delete Reply: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}`).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Delete Reply: Insufficient permissions  (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Reply: Comment doesnt exist  (should fail)', async ()=>{
        return agent.delete(`/api/comments/${123456}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        });
      });
      it('Delete Reply: Reply doesnt exist  (should fail)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/replies/${1234}?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
        });
      });
      it('Delete Reply: As admin but not owner (should work)', async ()=>{
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Delete Reply: As user but not owner (should fail)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.NotOwnerError);
        });
      });
      it('Delete Reply: As user and owner (should work)', async ()=>{
        const user = await createUser(UserData[0]);
        const reply2 = await agent.post(`/api/comments/${comment._id}/replies?access_token=${user.access_token}`).send({text: 'test'}).then((res)=>res.body);
        return agent.delete(`/api/comments/${comment._id}/replies/${reply2._id}?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Delete Reply: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
    });
  });
  describe('PUT \'/api/:commentId/replies/:replyId/likes\'', ()=>{
    let admin; let comment; let reply;
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
      reply = await agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'test'}).then((res)=>res.body);
    });
    after(async ()=>{
      await dropDatabase();
    });
    it('Like Reply: Execute (should succeed)', async ()=>{
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(200);
        return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.body.liked.should.be.true;
          res.body.likes.should.eql(1);
        });
      });
    });
    it('Like Reply: Execute two different people like the reply (should succeed)', async ()=>{
      const user = await createUser(UserData[0]);
      await agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${user.access_token}`).then();
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(200);
        return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.body.liked.should.be.true;
          res.body.likes.should.eql(2);
        });
      });
    });
    it('Like Reply: Same person likes the reply twice, second should be no-op (should succeed)', async ()=>{
      await agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then();
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(200);
        return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
          res.body.liked.should.be.true;
          res.body.likes.should.eql(1);
        });
      });
    });
    it('Like Reply: One person likes and other sees if they have liked it (should succeed)', async ()=>{
      const user = await createUser(UserData[0]);
      await agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${user.access_token}`).then();
      return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
        res.body.liked.should.be.false;
        res.body.likes.should.eql(1);
      });
    });

    it('Like Reply: Not logged in (should fail)', async ()=>{
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes`).then((res)=>{
        res.status.should.eql(401);
        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
      });
    });
    it('Like Reply: Insufficient permissions  (should fail)', async ()=>{
      const role = await RBAC.findOne({'role': 'none'});
      await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(403);
        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
      });
    });
    it('Like Reply: Comment doesnt exist  (should fail)', async ()=>{
      return agent.put(`/api/comments/${123456}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(404);
        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
      });
    });
    it('Like Reply: Reply doesnt exist  (should fail)', async ()=>{
      return agent.put(`/api/comments/${comment._id}/replies/${1234}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(404);
        res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
      });
    });
    it('Like Reply: As user (should succeed)', async ()=>{
      const user = await createUser(UserData[0]);
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${user.access_token}`).then(async (res)=>{
        res.status.should.eql(200);
      });
    });
    it('Like Reply: As employee (should fail)', async ()=>{
      const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      return agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${employee.access_token}`).then(async (res)=>{
        res.status.should.eql(403);
        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
      });
    });
  });
  describe('DELETE \'/api/:commentId/replies/:replyId/likes\'', ()=>{
    let admin; let comment; let reply;
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
      reply = await agent.post(`/api/comments/${comment._id}/replies?access_token=${admin.access_token}`).send({text: 'test'}).then((res)=>res.body);
      await agent.put(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then();
    });
    after(async ()=>{
      await dropDatabase();
    });
    it('Unlike Reply: Execute by deleting and seeing if like cleared (should succeed)', async ()=>{
      return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
        res.body.liked.should.be.true;
        res.body.likes.should.eql(1);
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
            res.body.liked.should.be.false;
            res.body.likes.should.eql(0);
          });
        });
      });
    });
    it('Unlike Reply: Someone else unlike the reply, should not modify your like (should succeed)', async ()=>{
      const user = await createUser(UserData[0]);
      await agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${user.access_token}`).then();
      return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
        res.body.liked.should.be.true;
        res.body.likes.should.eql(1);
      });
    });
    it('Unlike Reply: Unlike twice, second should be a noop (should succeed)', async ()=>{
      await agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then();
      return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
        res.body.liked.should.be.false;
        res.body.likes.should.eql(0);
        return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/comments/${comment._id}/replies/${reply._id}?access_token=${admin.access_token}`).then((res)=>{
            res.body.liked.should.be.false;
            res.body.likes.should.eql(0);
          });
        });
      });
    });
    it('Unlike Reply: Not logged in (should fail)', async ()=>{
      return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes`).then((res)=>{
        res.status.should.eql(401);
        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
      });
    });
    it('Unlike Reply: Insufficient permissions  (should fail)', async ()=>{
      const role = await RBAC.findOne({'role': 'none'});
      await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
      return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(403);
        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
      });
    });
    it('Unlike Reply: Comment doesnt exist  (should fail)', async ()=>{
      return agent.delete(`/api/comments/${123456}/replies/${reply._id}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(404);
        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
      });
    });
    it('Unlike Reply: Reply doesnt exist  (should fail)', async ()=>{
      return agent.delete(`/api/comments/${comment._id}/replies/${1234}/likes?access_token=${admin.access_token}`).then((res)=>{
        res.status.should.eql(404);
        res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
      });
    });
    it('Unlike Reply: As user (should succeed)', async ()=>{
      const user = await createUser(UserData[0]);
      return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${user.access_token}`).then(async (res)=>{
        res.status.should.eql(200);
      });
    });
    it('Unlike Reply: As employee (should fail)', async ()=>{
      const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
      return agent.delete(`/api/comments/${comment._id}/replies/${reply._id}/likes?access_token=${employee.access_token}`).then(async (res)=>{
        res.status.should.eql(403);
        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
      });
    });
  });
};

export default replySpecific;
