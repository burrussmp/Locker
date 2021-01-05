/* eslint-disable max-len */
// Import the dependencies for testing
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';
import {UserData} from '@development/user.data';
import {dropDatabase, createUser} from '@test/helper';
import StaticStrings from '@config/StaticStrings';


// Configure chai
chai.use(chaiHttp);
chai.should();

const authTests = () => {
  before(async () =>{
    await dropDatabase();
    await createUser(UserData[1]);
    await createUser(UserData[2]);
  });
  after(async () =>{
    // await dropDatabase();
  });
  it(`Check if User Collection Has 2 users`, (done) => {
    chai.request(app)
        .get('/api/users')
        .end(async (err, res) => {
          res.should.have.status(200);
          res.body.should.have.lengthOf(2);
          done();
        });
  });
  it('CREATE new user', (done) => {
    const user = UserData[0];
    chai.request(app)
        .post('/api/users')
        .type('form')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
  });
  describe('Login', () => {
    it('Correct login (using username)', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: user.username,
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
    });
    it('Correct login (using phone number)', (done) => {
      const user = UserData[1];
      const loginUser = {
        login: user.phone_number,
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
    });
    it('Correct login (using email)', (done) => {
      const user = UserData[2];
      const loginUser = {
        login: user.email,
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
    });
    it('Missing \'login\' field of req', (done) => {
      const user = UserData[2];
      const loginUser = {
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.error.should.be.eql(StaticStrings.LoginErrors.MissingLogin);
            done();
          });
    });
    it('Missing \'password\' field of req', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.error.should.be.eql(StaticStrings.LoginErrors.MissingPassword);
            done();
          });
    });
    it('Correct username but no matching', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: 'badname',
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
    });
    it('Correct email but no matching', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: 'crazy@mail.com',
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
    });
    it('Correct phone number but no matching', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: '204-323-3421',
        password: user.password,
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
    });
    it('Invalid password', (done) => {
      const user = UserData[0];
      const loginUser = {
        login: user.username,
        password: 'INVALID',
      };
      chai.request(app)
          .post('/auth/login')
          .type('form')
          .send(loginUser)
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
    });
  });
  describe('Logout', () => {
    it('Correct logout', (done) => {
      chai.request(app)
          .get('/auth/logout')
          .end(async (err, res) => {
            res.should.have.status(200);
            res.body.message.should.be.eql(StaticStrings.LoggedOutSuccess);
            done();
          });
    });
  });
};

export default authTests;
