/* eslint-disable max-len */
/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';

import Employee from '@server/models/employee.model';
import RBAC from '@server/models/rbac.model';
import Organization from '@server/models/organization.model';

import {UserData} from '@development/user.data';
import {ProductData} from '@development/product.data';
import {EmployeeData, getEmployeeConstructor} from '@development/employee.data';

import {dropDatabase, createUser, createEmployee, loginAdminEmployee, createProductPostAgent} from '@test/helper';
import StaticStrings from '@config/StaticStrings';

import mongoose from 'mongoose';

const ReactionTypes = mongoose.models.Post.schema.tree.reactions[0].tree.type.enum.values;

chai.use(chaiHttp);
chai.should();


const reactionTest = () => {
  describe('Reactions Test', ()=>{
    describe('POST /api/posts/:postId/reaction', ()=>{
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
      it('Add Reaction: Execute and see if all reactions succeed', async ()=>{
        for (const reaction of ReactionTypes) {
          return agent.put(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).send({reaction: reaction}).then(async (res)=>{
            res.status.should.eql(200);
            return agent.get(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
              res.status.should.eql(200);
              res.body.selected.should.be.eql(reaction);
              for (const reaction2 of ReactionTypes) {
                reaction2==reaction ? res.body[reaction2].should.eql(1) : res.body[reaction2].should.eql(0);
              }
            });
          });
        }
      });
      it('Add Reaction: Not logged in (should fail)', async ()=>{
        return agent.put(`/api/posts/${post._id}/reaction`).send({reaction: ReactionTypes[0]}).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Add Reaction: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.put(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).send({reaction: ReactionTypes[0]}).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Add Reaction: Invalid reaction (should fail)', async ()=>{
        return agent.put(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).send({reaction: 'invalid'}).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.InvalidReaction);
        });
      });
      it('Add Reaction: Invalid reaction (empty string) (should fail)', async ()=>{
        return agent.put(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).send({reaction: ''}).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.InvalidReaction);
        });
      });
      it('Add Reaction: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.put(`/api/posts/${post._id}/reaction?access_token=${employee.access_token}`).send({reaction: ReactionTypes[0]}).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Add Reaction: As user (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.put(`/api/posts/${post._id}/reaction?access_token=${user.access_token}`).send({reaction: ReactionTypes[0]}).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    describe('GET /api/posts/:postId/reaction', ()=>{
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
      it('Get Reactions: Execute and and see if selected is false at start', async ()=>{
        return agent.get(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          res.body.selected.should.be.false;
        });
      });
      it('Get Reactions: Not logged in (should fail)', async ()=>{
        return agent.get(`/api/posts/${post._id}/reaction`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Get Reactions: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.get(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Get Reactions: As employee (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.get(`/api/posts/${post._id}/reaction?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Get Reactions: As user (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.get(`/api/posts/${post._id}/reaction?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });

    describe('DELETE /api/posts/:postId/reaction', ()=>{
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
        await agent.put(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).send({reaction: ReactionTypes[0]}).then();
      });
      it('Delete Reaction: Execute should succeed', async ()=>{
        return agent.delete(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.get(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
            res.body.selected.should.be.false;
          });
        });
      });
      it('Delete Reaction: Delete twice (second should fail)', async ()=>{
        return agent.delete(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
          return agent.delete(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(404);
            res.body.error.should.eql(StaticStrings.PostModelErrors.NoReactionToDelete);
          });
        });
      });
      it('Delete Reaction: Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/posts/${post._id}/reaction`).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Delete Reaction: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.delete(`/api/posts/${post._id}/reaction?access_token=${admin.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Reaction: As employee (should fail)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.delete(`/api/posts/${post._id}/reaction?access_token=${employee.access_token}`).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete Reaction: As user (should succeed)', async ()=>{
        const user = await createUser(UserData[0]);
        await agent.put(`/api/posts/${post._id}/reaction?access_token=${user.access_token}`).send({reaction: ReactionTypes[0]}).then();
        return agent.delete(`/api/posts/${post._id}/reaction?access_token=${user.access_token}`).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
  });
};

export default reactionTest;
