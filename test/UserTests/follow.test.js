import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import StaticStrings from '../../config/StaticStrings';

chai.use(chaiHttp);
chai.should();

const follow_test = () => {
    describe("Follows/Following Test", ()=>{
        let id0,id1,id2;
        let agent = chai.request.agent(app);
        let token0,token1;
        describe('GET /api/users/:userID/follow', ()=>{
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                user = new User(UserData[2]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    id2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    token0 = res.body.token;
                });
                await agent.post('/auth/login').send({
                    login: UserData[1].email,
                    password: UserData[1].password
                }).then((res) => {
                    token1 = res.body.token;
                });  
            });
            it("Get someone else's follower/following (should succeed) and be empty",async ()=>{
                return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.followers.length.should.eql(0);
                    res.body.following.length.should.eql(0);
                });
            });
            it("Get own follower/following (should succeed) and be empty",async ()=>{
                return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.followers.length.should.eql(0);
                    res.body.following.length.should.eql(0);
                });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.get(`/api/users/${id0}/follow`)
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it("User does not exists (should fail)",async ()=>{
                return agent.get(`/api/users/kjfksdjfkl/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserNotFoundError)
                });
            });
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':[]},{new:true});
                return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
        });
        describe('PUT /api/users/:userID/follow', ()=>{
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                user = new User(UserData[2]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    id2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    token0 = res.body.token;
                });
                await agent.post('/auth/login').send({
                    login: UserData[1].email,
                    password: UserData[1].password
                }).then((res) => {
                    token1 = res.body.token;
                });  
            });
            it("Follow someone else (both should properly update)",async ()=>{
                return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.AddedFollowerSuccess);
                    return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                    .then(res=>{
                        res.status.should.eql(200);
                        res.body.followers.length.should.eql(1);
                        res.body.followers[0].should.have.property('_id');
                        res.body.following.length.should.eql(0);
                        id0.should.eql(res.body.followers[0]._id);
                        return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.followers.length.should.eql(0);
                            res.body.following.length.should.eql(1);
                            id1.should.eql(res.body.following[0]._id);
                        });
                    });
                });
            });
            it("Follow twice (should be the same as once and succeed)",async ()=>{
                return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                    .then(res=>{
                        return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.followers.length.should.eql(1);
                            res.body.following.length.should.eql(0);
                        });
                    });
                });
            });
            it("Attempt to follow self (should fail)",async ()=>{
                return agent.put(`/api/users/${id0}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.UserControllerErrors.FollowSelfError)
                });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.put(`/api/users/${id1}/follow`)
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it("User does not exists (should fail)",async ()=>{
                return agent.put(`/api/users/kjfksdjfkl/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserNotFoundError)
                });
            });
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':[]},{new:true});
                return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
        });
        describe('DELETE /api/users/:userID/follow', ()=>{
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                user = new User(UserData[2]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    id2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    token0 = res.body.token;
                });
                await agent.post('/auth/login').send({
                    login: UserData[1].email,
                    password: UserData[1].password
                }).then((res) => {
                    token1 = res.body.token;
                });  
            });
            it("Follow someone else and then unfollow them (both should update)",async ()=>{
                return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
                    .then(res=>{
                        res.body.message.should.eql(StaticStrings.RemovedFollowerSuccess)
                        return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.followers.length.should.eql(0);
                            res.body.following.length.should.eql(0);
                            return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                            .then(res=>{
                                res.status.should.eql(200);
                                res.body.followers.length.should.eql(0);
                                res.body.following.length.should.eql(0);
                            });
                        });
                    });
                });
            });
            it("Unfollow before following (should succeed)",async ()=>{
                return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200)
                    return agent.put(`/api/users/${id1}/follow?access_token=${token0}`)
                    .then(res=>{
                        return agent.get(`/api/users/${id1}/follow?access_token=${token0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.followers.length.should.eql(1);
                            res.body.following.length.should.eql(0);
                        });
                    });
                });
            });
            it("Attempt to unfollow self (should fail)",async ()=>{
                return agent.delete(`/api/users/${id0}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.UserControllerErrors.UnfollowSelfError)
                });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.delete(`/api/users/${id1}/follow`)
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it("User does not exists (should fail)",async ()=>{
                return agent.delete(`/api/users/kjfksdjfkl/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserNotFoundError)
                });
            });
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':[]},{new:true});
                return agent.delete(`/api/users/${id1}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
        });
        describe('Scenario: User A follows User B and User C and then deletes their account', ()=>{
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                user = new User(UserData[2]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    id2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    token0 = res.body.token;
                });
                await agent.post('/auth/login').send({
                    login: UserData[1].email,
                    password: UserData[1].password
                }).then((res) => {
                    token1 = res.body.token;
                });
                await agent.put(`/api/users/${id1}/follow?access_token=${token0}`);
                await agent.put(`/api/users/${id2}/follow?access_token=${token0}`)
            });
            it("Circular references properly removed", async()=>{
                return agent.get(`/api/users/${id0}/follow?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.following.length.should.eql(2);
                    return agent.delete(`/api/users/${id0}?access_token=${token0}`)
                    .then(res=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/users/${id1}/follow?access_token=${token1}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.following.length.should.eql(0);
                            res.body.followers.length.should.eql(0);
                            return agent.get(`/api/users/${id2}/follow?access_token=${token1}`)
                            .then(res=>{
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
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                user = new User(UserData[2]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    id2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    token0 = res.body.token;
                });
            });
            it("Circular references properly removed", async()=>{
                return agent.delete(`/api/users/${id0}?access_token=${token0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    return agent.get(`/api/users/${id1}?access_token=${token0}`)
                    .then(res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.TokenIsNotValid);
                    });
                });
            });
        });
    });
};

export default follow_test;