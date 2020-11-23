import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {dropDatabase, createUser,getAccessToken} from  '../helper';
import User from '../../server/models/user.model';
import RBAC from '../../server/models/rbac.model';
import StaticStrings from '../../config/StaticStrings';
chai.use(chaiHttp);
chai.should();

const profile_test = () => {
    describe("Profile Tests'", ()=>{
        describe("Failure cases", ()=>{
            let id0,id1;
            let access_token0,access_token1;
            before( async () =>{
                await dropDatabase();
                let user = await createUser(UserData[0]);
                id0 = user._id;
                access_token0 = user.access_token;
                user = await createUser(UserData[1]);
                id1 = user._id;
                access_token1 = user.access_token;
            });
            after(async () =>{
                await dropDatabase();
            })
            let agent = chai.request.agent(app);
            it("/GET Attempt w/out login", async ()=>{
                return agent.get('/api/users')
                .then((res) => {
                    res.body.length.should.be.at.least(1);
                    res.body[0].should.have.property('_id');
                    return agent.get(`/api/users/${id0}`)
                    .then((res) => {
                        res.should.have.status(401);
                        res.body.error.should.be.eql(StaticStrings.UnauthorizedMissingTokenError);
                    });
                });
            });
            it("/GET Attempt where user ID doesn't exist", async ()=>{
                return agent.get(`/api/users/wrong`)
                    .set('Authorization',`Bearer ${access_token0}`)
                    .then((res)=>{
                        res.should.have.status(404);
                        res.body.error.should.be.eql(StaticStrings.UserNotFoundError);
                    })
            });
            it("/PUT Attempt to modify resource not owned", async ()=>{
                return agent.put(`/api/users/${id0}`)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .send({first_name:'new_first_name'})
                    .then((res)=>{
                        res.should.have.status(403);
                        res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                    })
            });
            it("/DELETE Attempt to delete resource not owned", async ()=>{
                return agent.delete(`/api/users/${id0}`)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.should.have.status(403);
                        res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                    })
            });
            it("/GET Attempt w/ incorrect privileges (none)", async ()=>{
                const na_role = await RBAC.findOne({'role':'none'});
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions': na_role._id},{new:true});
                return agent.get(`/api/users/${id0}`)
                    .set('Authorization',`Bearer ${access_token0}`)
                    .then((res)=>{
                        res.should.have.status(403);
                        res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                    })
            });
            it("/PUT Attempt w/ incorrect privileges (user:read)", async ()=>{
                const na_role = await RBAC.findOne({'role':'none'});
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions': na_role._id},{new:true});
                return agent.delete(`/api/users/${id0}`)
                    .set('Authorization',`Bearer ${access_token0}`)
                    .then((res)=>{
                        res.should.have.status(403);
                        res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                    })
            });
        });
        describe("GET/PUT/DELETE /api/users/:userId", ()=>{
            let id1;
            let access_token1;
            before( async () =>{
                await dropDatabase();
                let user = await createUser(UserData[1]);
                id1 = user._id;
                access_token1 = user.access_token;
            });
            after(async () =>{
                await dropDatabase();
            })
            let agent = chai.request.agent(app);
            it("/GET w/ correct privileges", async ()=>{
                return agent.get(`/api/users/${id1}`)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.should.have.status(200);
                    })
            });
            it("/DELETE w/ correct privileges", async ()=>{
            return agent.delete(`/api/users/${id1}`)
                .set('Authorization',`Bearer ${access_token1}`)
                .then((res)=>{
                    res.status.should.eql(200);
                    return agent.get('/api/users')
                        .then(res=>{
                            res.body.length.should.eql(0);
                        })
                });
            });
            it("/PUT w/ correct privileges", async ()=>{
            let user = await createUser(UserData[1]);
            id1 = user._id;
            access_token1 = user.access_token;
            return agent.put(`/api/users/${id1}`)
                .send({'username':'new_username','first_name':'new_firstname'})
                .set('Authorization',`Bearer ${access_token1}`)
                .then((res)=>{
                    res.status.should.eql(200);
                    res.body.username.should.eql('new_username');
                    res.body.first_name.should.eql('new_firstname')
                });
            });
            it("/PUT w/ same username (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'bad';
                await createUser(userA);
                return agent.put(`/api/users/${id1}`)
                    .send({'username':'bad'})
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.status.should.eql(400);
                    });
            });
            it("/PUT update user name and try to login with new username (should succeed)", async ()=>{
                return agent.put(`/api/users/${id1}`)
                    .send({'username':'different'})
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.status.should.eql(200);
                        let data = {
                            login: 'different',
                            password: UserData[1].password
                        }
                        return getAccessToken(data);
                    });
            });
            it("/PUT update email and try to login with new email (should succeed)", async ()=>{
                return agent.put(`/api/users/${id1}`)
                    .send({'email':'test@gmail.com'})
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.status.should.eql(200);
                        let data = {
                            login: 'test@gmail.com',
                            password: UserData[1].password
                        }
                        return getAccessToken(data);
                    });
            });
            it("/PUT update phone number and try to login with new # (should succeed)", async ()=>{
                return agent.put(`/api/users/${id1}`)
                    .send({'phone_number':'+12345678900'})
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then((res)=>{
                        res.status.should.eql(200);
                        let data = {
                            login: '+12345678900',
                            password: UserData[1].password
                        }
                        return getAccessToken(data);
                    });
            });
            it("/PUT w/ invalid email (should fail)", async ()=>{
            return agent.put(`/api/users/${id1}`)
                .send({'email':'error'})
                .set('Authorization',`Bearer ${access_token1}`)
                .then((res)=>{
                    res.body.error.toLowerCase().should.include('email');
                    res.status.should.eql(400);
                });                
            });
            it("/PUT all possible mutable fields (except password and photo)", async ()=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'male',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                }
                return agent.put(`/api/users/${id1}`)
                    .send(data)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then(async (res)=>{
                        let info = await User.findOne({'username':'test'}).select(Object.keys(data));
                        for (let key of Object.keys(data)){
                            info[key].should.eql(data[key]);
                        }
                        res.status.should.eql(200);
                    });
            });
            it("/PUT all possible mutable fields (except password and photo), but invalid gender", async ()=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'fdafas',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                }
                return agent.put(`/api/users/${id1}`)
                    .send(data)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then(async (res)=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.UserModelErrors.InvalidGender)
                    });
            });
            it("/PUT with incorrect field (password) should fail", async ()=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                    'password' : 'MWAHAHAH'

                }
                return agent.put(`/api/users/${id1}`)
                    .send(data)
                    .set('Authorization',`Bearer ${access_token1}`)
                    .then(async (res)=>{
                        res.status.should.eql(422);
                        res.body.error.should.eql(StaticStrings.BadRequestInvalidFields + ' password')
                    });
            });
        });
    });
}

export default profile_test;