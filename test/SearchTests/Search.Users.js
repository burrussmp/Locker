import chai from "chai";
import chaiHttp from "chai-http";
import { app } from "../../server/server";
import { UserData } from "../../development/user.data";
import User from "../../server/models/user.model";
import { drop_database, createUser } from "../helper";

chai.use(chaiHttp);
chai.should();

const auth_password_tests = () => {
  describe("Auth password tests", () => {
    describe("GET avatar basics (testing size query parameter) and using /api/users/:userID/avatar", () => {
      let userId0, userId1, userId2;
      let agent = chai.request.agent(app);
      let userToken0, userToken1;
      before(async () => {
        await drop_database();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        user = await createUser(UserData[1]);
        userId1 = user._id;
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userId2 = user._id;
      });
      after(async () => {
        await drop_database();
      });
      it("Basic (empty, missing, and strings should succeed)", async () => {
        return agent
          .post(`/api/search/users?access_token=${userToken0}`)
          .send({ search: "" })
          .then(async (res) => {
            res.status.should.eql(200);
            return agent
              .post(`/api/search/users?access_token=${userToken0}`)
              .send({ wrong: "" })
              .then(async (res) => {
                res.status.should.eql(200);
                return agent
                  .post(`/api/search/users?access_token=${userToken0}`)
                  .send({ search: UserData[0].username })
                  .then(async (res) => {
                    res.status.should.eql(200);
                    res.status.body.data.length.eql(1);
                  });
              });
          });
      });
      it("Not logged in (should fail)", async () => {
        return agent
          .post(`/api/search/users`)
          .send({ search: "name" })
          .then(async (res) => {
            res.status.should.eql(401);
          });
      });
      it("Bad Permissions (should fail)", async () => {
        let role = await RBAC.findOne({'role': 'na'});
        await User.findOneAndUpdate(
          { username: UserData[0].username },
          { permissions: role._id },
          { new: true }
        );
        return agent
          .post(`/api/search/users?access_token=${userToken0}`)
          .send({ search: UserData[0].username })
          .then(async (res) => {
            res.status.should.eql(403);
          });
      });
    });
  });
};

export default auth_password_tests;
