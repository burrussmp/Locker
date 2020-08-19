import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import StaticStrings from '../../config/StaticStrings';
chai.use(chaiHttp);
chai.should();

const profile_test = () => {
    describe("PATH: '/api/users/:userId'", ()=>{
        describe("Failure cases", ()=>{
            before( async () =>{
                await drop_database();
                let userA = UserData[1];
                let user = new User(userA);
                user = await user.save();
                let user2 = new User(UserData[0]);
                user2 = await user2.save()
            });
            after(async () =>{
                await drop_database();
            })
            let agent = chai.request.agent(app);
            it("/GET Attempt w/out login", (done)=>{
                agent.get('/api/users')
                .then((res) => {
                    res.body.length.should.be.at.least(1);
                    res.body[0].should.have.property('_id');
                    let id = res.body[0]._id;
                    agent.get(`/api/users/${id}`)
                    .end((err,res) => {
                        res.should.have.status(401);
                        res.body.error.should.be.eql(StaticStrings.UnauthorizedMissingTokenError);
                        done();
                    });
                });
            });
            it("/GET Attempt w/ incorrect login", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        return agent.get(`/api/users/wrong`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(404);
                                res.body.error.should.be.eql(StaticStrings.UserNotFoundError);
                                done()
                            })
                    });
            });
            it("/PUT Attempt to modify resource not owned", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                User.findOne({"username":UserData[0].username},(err,doc) =>{
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            agent.put(`/api/users/${doc._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .send({first_name:'new_first_name'})
                                .then((res)=>{
                                    res.should.have.status(403);
                                    res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                                    done();
                                })
                        });
                })
            });
            it("/DELETE Attempt to delete resource not owned", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                User.findOne({"username":UserData[0].username},(err,doc) =>{
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            agent.delete(`/api/users/${doc._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .then((res)=>{
                                    res.should.have.status(403);
                                    res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                                    done();
                                })
                        });
                })
            });
            it("/GET Attempt w/ incorrect privileges (none)", async ()=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                await User.findOneAndUpdate({'username':user.username},{'permissions':[]},{new:true});
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.user.should.have.property('_id');
                        return agent.get(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(403);
                                res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                            })
                    });
            });
            it("/PUT Attempt w/ incorrect privileges (user:read)", async ()=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:read"]},{new:true});
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.user.should.have.property('_id');
                        return agent.delete(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(403);
                                res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                            })
                    });
            });
        });
        describe("GET/PUT/DELETE /api/users/:userId", ()=>{
            beforeEach( async () =>{
                await drop_database();
                let userA = UserData[1];
                let user = new User(userA);
                user = await user.save();
            });
            after(async () =>{
                await drop_database();
            })
            let agent = chai.request.agent(app);
            let user = UserData[1];
            let login_user = {
                login: user.email,
                password: user.password
            };
            it("/GET w/ correct privileges", async ()=>{
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        return agent.get(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(200);
                            })
                    });
            });
            it("/DELETE w/ correct privileges", async ()=>{
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            return agent.delete(`/api/users/${res.body.user._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .then((res)=>{
                                    res.body.username.should.eql(user.username);
                                    return agent.get('/api/users')
                                        .then(res=>{
                                            res.body.length.should.eql(0);
                                        })
                                });
                        });
                });
            });
            it("/PUT w/ correct privileges", async ()=>{
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'username':'new_username','first_name':'new_firstname'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.status.should.eql(200);
                                res.body.username.should.eql('new_username');
                                res.body.first_name.should.eql('new_firstname')
                            });
                });
                });
            });
            it("/PUT w/ same username (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'username':'new_username'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.status.should.eql(400);
                                res.body.error.should.eql(StaticStrings.UserModelErrors.UsernameAlreadyExists);
                            });
                    });
                });
            });
            it("/PUT w/ invalid email (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'email':'error'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.UserModelErrors.InvalidEmail);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT w/ old password doesn't match current password (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error','old_password':'old'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.PasswordUpdateIncorrectError);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT missing old password (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.PasswordUpdateMissingError);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT new password is invalid (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error','old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordTooShort);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT not allowed to update hashed_password (should fail)", async ()=>{          
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'hashed_password':'myNewPassword12$','bad_key':123,'old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                res.body.error.should.be.eql(`${StaticStrings.UserControllerErrors.BadRequestInvalidFields} 'hashed_password,bad_key'`)
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT new password is valid, old password is correct, so password should update", async ()=>{
                let user_new_pass = await User.findOne({'username':UserData[1].username});
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'myNewPassword12$','old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                user_new_pass = await User.findOne({'username':UserData[1].username});
                                user_new_pass.authenticate('myNewPassword12$').should.be.true;
                                res.status.should.eql(200);
                            });
                    });
                });
            });
            it("/PUT all possible mutable fields (except password and photo)", (done)=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'male',
                    'email' : 'new@mail.com',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                    'phone_number': '345-323-3421'
                }
                agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        agent.put(`/api/users/${res.body.user._id}`)
                            .send(data)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                let info = await User.findOne({'username':'test'}).select(Object.keys(data));
                                for (let key of Object.keys(data)){
                                    info[key].should.eql(data[key]);
                                }
                                res.status.should.eql(200);
                                done()
                            });
                    });
                });
            });
            it("/PUT all possible mutable fields (except password and photo), but invalid gender", (done)=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'fdafas',
                    'email' : 'new@mail.com',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                    'phone_number': '345-323-3421'
                }
                agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        agent.put(`/api/users/${res.body.user._id}`)
                            .send(data)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                res.status.should.eql(400);
                                res.body.error.should.eql(StaticStrings.UserModelErrors.InvalidGender)
                                done()
                            });
                    });
                });
            });
        });
    });
}

export default profile_test;