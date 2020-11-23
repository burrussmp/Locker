/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {dropDatabase, createUser, getAccessToken} from '../helper';
import User from '../../server/models/user.model';
import RBAC from '../../server/models/rbac.model';
import StaticStrings from '../../config/StaticStrings';
chai.use(chaiHttp);
chai.should();

const changePasswordTest = () => {
  describe('Password Update Tests', ()=>{
    describe('PUT /api/users/:userId/password', ()=>{
      let id0; let id1;
      const agent = chai.request.agent(app);
      const validPassword = 'myNewPassword12$';
      const invalidPassword = 'bad';
      let accessToken0;
      before( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        accessToken0 = user.access_token;
        user = await createUser(UserData[1]);
        id1 = user._id;
      });
      after( async ()=>{
        await dropDatabase();
      });
      it('Not owner (should fail)', async ()=>{
        return agent.put(`/api/users/${id1}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/password`)
            .send({
              'old_password': UserData[0].password,
              'password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('User does not exists (should fail)', async ()=>{
        return agent.put(`/api/users/fdafd/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': validPassword,
            })
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              await dropDatabase();
              let user = await createUser(UserData[0]);
              id0 = user._id;
              accessToken0 = user.access_token;
              user = await createUser(UserData[1]);
              id1 = user._id;
            });
      });
      it('/PUT w/ old password doesn\'t match current password (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[1].password,
              'password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordUpdateIncorrectError);
            });
      });
      it('/PUT missing old password (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' old_password');
            });
      });
      it('/PUT missing new password (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': validPassword,
            })
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.eql(StaticStrings.BadRequestFieldsNeeded + ' password');
            });
      });
      it('/PUT try to update with same, old password (should be fine)', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': UserData[0].password,
            })
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordUpdateSame);
            });
      });
      it('/PUT invalid new password (should fail)', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': invalidPassword,
            })
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordTooShort);
            });
      });
      it('/PUT tries to update different field other than password', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': invalidPassword,
              'username': 'Changethis',
            })
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.eql(StaticStrings.BadRequestInvalidFields + ' username');
            });
      });
      it('/PUT new password is valid, old password is correct, so password should update and we can login with new password', async ()=>{
        return agent.put(`/api/users/${id0}/password?access_token=${accessToken0}`)
            .send({
              'old_password': UserData[0].password,
              'password': validPassword,
            })
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UpdatedPasswordSuccess);
              const login = {
                login: UserData[0].username,
                password: validPassword,
              };
              return getAccessToken(login);
            });
      });
    });
  });
};

export default changePasswordTest;
