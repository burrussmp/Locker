/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';

import {app} from '@server/server';
import {UserData} from '@development/user.data';
import {dropDatabase, createUser} from '@test/helper';
import User from '@server/models/user.model';
import RBAC from '@server/models/rbac.model';
import StaticStrings from '@config/StaticStrings';

chai.use(chaiHttp);
chai.should();

const followTest = () => {
  describe('Follows/Following Test', ()=>{
    let id0; let id1; let id2;
    const agent = chai.request.agent(app);
    let token0; let token1;
    describe('GET /api/users/:userID/follow', ()=>{
      before( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        token0 = user.access_token;
        user = await createUser(UserData[1]);
        token1 = user.access_token;
        id1 = user._id;
        user = await createUser(UserData[2]);
        id2 = user._id;
      });
      it('Get someone elses follower/following (should succeed) and be empty', async ()=>{
        return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.followers.length.should.eql(0);
              res.body.following.length.should.eql(0);
            });
      });
      it('Get own follower/following (should succeed) and be empty', async ()=>{
        return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.followers.length.should.eql(0);
              res.body.following.length.should.eql(0);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.get(`/api/users/${id0}/follow`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('User does not exists (should fail)', async ()=>{
        return agent.get(`/api/users/bad/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              const userRole = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': userRole._id}, {new: true});
            });
      });
    });
    describe('PUT /api/users/:userID/follow', ()=>{
      it('Follow someone else (both should properly update)', async ()=>{
        return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.AddedFollowerSuccess);
              return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.followers.length.should.eql(1);
                    res.body.followers[0].should.have.property('_id');
                    res.body.following.length.should.eql(0);
                    id0.should.eql(res.body.followers[0]._id);
                    return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.followers.length.should.eql(0);
                          res.body.following.length.should.eql(1);
                          id1.should.eql(res.body.following[0]._id);
                        });
                  });
            });
      });
      it('Follow twice (should be the same as once and succeed)', async ()=>{
        return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
            .then(()=>{
              return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                  .then(()=>{
                    return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.followers.length.should.eql(1);
                          res.body.following.length.should.eql(0);
                        });
                  });
            });
      });
      it('Attempt to follow self (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.eql(StaticStrings.UserControllerErrors.FollowSelfError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.put(`/api/users/${id1}/follow`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('User does not exists (should fail)', async ()=>{
        return agent.put(`/api/users/bad/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              const userRole = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': userRole._id}, {new: true});
            });
      });
    });
    describe('DELETE /api/users/:userID/follow', ()=>{
      it('Follow someone else and then unfollow them (both should update)', async ()=>{
        return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
            .then(()=>{
              return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
                  .then((res)=>{
                    res.body.message.should.eql(StaticStrings.RemovedFollowerSuccess);
                    return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.followers.length.should.eql(0);
                          res.body.following.length.should.eql(0);
                          return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                              .then((res)=>{
                                res.status.should.eql(200);
                                res.body.followers.length.should.eql(0);
                                res.body.following.length.should.eql(0);
                              });
                        });
                  });
            });
      });
      it('Unfollow before following (should succeed)', async ()=>{
        return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                  .then(()=>{
                    return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.followers.length.should.eql(1);
                          res.body.following.length.should.eql(0);
                        });
                  });
            });
      });
      it('Attempt to unfollow self (should fail)', async ()=>{
        return agent.delete(`/api/users/${id0}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.eql(StaticStrings.UserControllerErrors.UnfollowSelfError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/users/${id1}/follow`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('User does not exists (should fail)', async ()=>{
        return agent.delete(`/api/users/bad/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              const userRole = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': userRole._id}, {new: true});
            });
      });
    });
    describe('Scenario: User A follows User B and User C and then deletes their account', ()=>{
      before( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        token0 = user.access_token;
        user = await createUser(UserData[1]);
        token1 = user.access_token;
        id1 = user._id;
        user = await createUser(UserData[2]);
        id2 = user._id;
        await agent.put(`/api/users/${id1}/follow?access_token=${token0}`);
        await agent.put(`/api/users/${id2}/follow?access_token=${token0}`);
      });
      after( async ()=>{
        await dropDatabase();
      });
      it('Circular references properly removed', async ()=>{
        return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.following.length.should.eql(2);
              return agent.delete(`/api/users/${id0}?access_token=${token0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    return agent.get(`/api/users/${id1}/follow?access_token=${token1}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.following.length.should.eql(0);
                          res.body.followers.length.should.eql(0);
                          return agent.get(`/api/users/${id2}/follow?access_token=${token1}`)
                              .then((res)=>{
                                res.status.should.eql(200);
                                res.body.following.length.should.eql(0);
                                res.body.followers.length.should.eql(0);
                              });
                        });
                  });
            });
      });
    });
    describe('Scenario: User A deletes their account and their token is no longer valid', ()=>{
      before( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        token0 = user.access_token;
        user = await createUser(UserData[1]);
        token1 = user.access_token;
        id1 = user._id;
        user = await createUser(UserData[2]);
        id2 = user._id;
      });
      after( async ()=>{
        await dropDatabase();
      });
      it('Should fail', async ()=>{
        return agent.delete(`/api/users/${id0}?access_token=${token0}`)
            .then((res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/users/${id1}?access_token=${token0}`)
                  .then((res)=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.TokenIsNotValid);
                  });
            });
      });
    });
  });
};

export default followTest;
