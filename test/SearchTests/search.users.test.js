/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import User from '../../server/models/user.model';
import {dropDatabase, createUser} from '../helper';

chai.use(chaiHttp);
chai.should();

const searchUserTests = () => {
  describe('Auth password tests', () => {
    describe('GET avatar basics (testing size query parameter) and using /api/users/:userID/avatar', () => {
      const agent = chai.request.agent(app);
      let userToken0;
      before(async () => {
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userToken0 = user.access_token;
        user = await createUser(UserData[1]);
        user = await createUser(UserData[2]);
      });
      after(async () => {
        await dropDatabase();
      });
      it('Basic (empty, missing, and strings should succeed)', async () => {
        return agent
            .post(`/api/search/users?access_token=${userToken0}`)
            .send({search: ''})
            .then(async (res) => {
              res.status.should.eql(200);
              return agent
                  .post(`/api/search/users?access_token=${userToken0}`)
                  .send({wrong: ''})
                  .then(async (res) => {
                    res.status.should.eql(200);
                    return agent
                        .post(`/api/search/users?access_token=${userToken0}`)
                        .send({search: UserData[0].username})
                        .then(async (res) => {
                          res.status.should.eql(200);
                          res.status.body.data.length.eql(1);
                        });
                  });
            });
      });
      it('Not logged in (should fail)', async () => {
        return agent
            .post(`/api/search/users`)
            .send({search: 'name'})
            .then(async (res) => {
              res.status.should.eql(401);
            });
      });
      it('Bad Permissions (should fail)', async () => {
        const role = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate(
            {username: UserData[0].username},
            {permissions: role._id},
            {new: true},
        );
        return agent
            .post(`/api/search/users?access_token=${userToken0}`)
            .send({search: UserData[0].username})
            .then(async (res) => {
              res.status.should.eql(403);
            });
      });
    });
  });
};

export default searchUserTests;
