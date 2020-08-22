import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import StaticStrings from '../../config/StaticStrings';
chai.use(chaiHttp);
chai.should();

const change_password_test = () => {
    describe("Password Update Tests", ()=>{
        describe('PUT /api/users/:userId/password', ()=>{
            let id0,id1;
            let agent = chai.request.agent(app);
            let login_user = {
                login: UserData[0].email,
                password: UserData[0].password
            };
            let token;
            let valid_password = "myNewPassword12$";
            let invalid_password = "bad";
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save();
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(2);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                });
                await agent.post('/auth/login').send(login_user).then((res) => {
                    token = res.body.token;
                });  
            });
            it("Not owner (should fail)",async ()=>{
                return agent.put(`/api/users/${id1}/password?access_token=${token}`)
                    .send({
                        'old_password' : UserData[0].password,
                        'password' : valid_password
                    })
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError)
                    });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.put(`/api/users/${id0}/password`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it("User does not exists (should fail)",async ()=>{
                return agent.put(`/api/users/fdafd/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserNotFoundError)
                });
            });
            it("Invalid permissions (should fail)", async()=>{
                let user = await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
            it("/PUT w/ old password doesn't match current password (should fail)", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[1].password,
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordUpdateIncorrectError)
                });
            });
            it("/PUT missing old password (should fail)", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' old_password')
                });
            });
            it("/PUT missing new password (should fail)", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : valid_password
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' password')
                });
            });
            it("/PUT try to update with same, old password (should fail)", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : UserData[0].password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordUpdateSame)
                });
            });
            it("/PUT invalid new password (should fail)", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : invalid_password
                })
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordTooShort)
                });
            });
            it("/PUT tries to update different field other than password", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : invalid_password,
                    'username' : 'Changethis'
                })
                .then(res=>{
                    res.status.should.eql(422);
                    res.body.error.should.eql(StaticStrings.BadRequestInvalidFields + ' username')
                });
            });
            it("/PUT new password is valid, old password is correct, so password should update", async ()=>{
                return agent.put(`/api/users/${id0}/password?access_token=${token}`)
                .send({
                    'old_password' : UserData[0].password,
                    'password' : valid_password,
                })
                .then(async res=>{
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.UpdatedPasswordSuccess)
                    let user_new_pass = await User.findOne({'username':UserData[0].username});
                    user_new_pass.authenticate(valid_password).should.be.true;
                });
            });
        });
    });
}

export default change_password_test;