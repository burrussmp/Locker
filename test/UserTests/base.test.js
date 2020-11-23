/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {dropDatabase, createUser} from '../helper';
import StaticStrings from '../../config/StaticStrings';

// Configure chai
chai.use(chaiHttp);
chai.should();

const baseTest = () => {
  describe('Create and list all users', ()=>{
    describe('/GET /api/users', () => {
      before(async ()=>{
        await dropDatabase();
      });
      it(`Check if User Collection Empty`, (done) => {
        chai.request(app)
            .get('/api/users')
            .end(async (err, res) => {
              res.should.have.status(200);
              res.body.should.have.lengthOf(0);
              done();
            });
      });
      it('GET empty user list', (done) => {
        chai.request(app)
            .get('/api/users')
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.should.have.lengthOf(0);
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
      it('GET new user and check fields', (done) => {
        chai.request(app)
            .get('/api/users')
            .end(async (err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.should.have.lengthOf(1);
              res.body[0].should.have.property('_id');
              res.body[0].should.have.property('createdAt');
              res.body[0].should.have.property('updatedAt');
              // prepare for next check
              await dropDatabase();
              await createUser(UserData[0]);
              await createUser(UserData[1]);
              await createUser(UserData[2]);
              done();
            });
      });
      it('GET list of users', (done) => {
        chai.request(app)
            .get('/api/users')
            .end(async (err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.should.have.lengthOf(3);
              await dropDatabase();
              done();
            });
      });
    });
    describe('/POST /api/users', () => {
      describe('Create USER', () => {
        const userA = UserData[0];
        const userB = UserData[1];
        it('CREATE a user', (done) => {
          chai.request(app)
              .post('/api/users')
              .send(userA)
              .end((err, res) => {
                res.should.have.status(200);
                done();
              });
        });
        describe('Check username', () => {
          const uniqueFields = ['username'];
          for (let i = 0; i < uniqueFields.length; ++i) {
            const field = uniqueFields[i];
            const userC = JSON.parse(JSON.stringify(userB));
            userC[field] = userA[field];
            it(`CREATE a user w/ same ${field} (should fail mode)`, (done) => {
              chai.request(app)
                  .post('/api/users')
                  .send(userC)
                  .end((err, res) => {
                    res.should.have.status(400);
                    done();
                  });
            });
          }
        });
        describe('Check required fields', () => {
          const requiredFields = ['username', 'email', 'password', 'phone_number'];
          const suspectedError = ['Username', 'Email', 'Password', 'PhoneNumber'];
          for (let i = 0; i < requiredFields.length; ++i) {
            const requiredField = requiredFields[i];
            const userE = JSON.parse(JSON.stringify(userB));
            delete userE[requiredField];
            it(`CREATE a user w/out ${requiredField} (should fail)`, (done) => {
              chai.request(app)
                  .post('/api/users')
                  .send(userE)
                  .end((err, res) => {
                    res.should.have.status(400);
                    res.body.error.should.eql(StaticStrings.UserModelErrors[`${suspectedError[i]}Required`]);
                    done();
                  });
            });
          }
        });
      });
      describe('Check username validation', () => {
        before(async ()=>{
          await dropDatabase();
        });
        const userB = UserData[1];
        const invalidUsernames = [
          'thisusernameisnottoolongyetbutifikeepaddinglettersitwillbe',
          '',
          '  ',
          'hello&',
        ];
        const invalidReasons = [
          StaticStrings.UserModelErrors.UsernameExceedLength,
          StaticStrings.UserModelErrors.UsernameRequired,
          StaticStrings.UserModelErrors.UsernameRequired,
          StaticStrings.UserModelErrors.InvalidUsername,
        ];
        const validUsernames = ['short', 'with_underscore', 'with_number_31', '1hasthecorrectnumberofcharacters'];
        for (let i = 0; i < invalidUsernames.length; ++i) {
          const invalidUsername = invalidUsernames[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.username = invalidUsername;
          it(`CREATE user with invalid username test ${i+1}: username = ${invalidUsername}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.error.should.eql(`${invalidReasons[i]}`);
                  done();
                });
          });
        }
        for (let i = 0; i < validUsernames.length; ++i) {
          const validUsername = validUsernames[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.username = validUsername;
          it(`CREATE user with valid username test ${i+1}: username = ${validUsername}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end(async (err, res) => {
                  res.should.have.status(200);
                  await dropDatabase();
                  done();
                });
          });
        }
        it(`Check if User Collection Empty`, (done) => {
          chai.request(app)
              .get('/api/users')
              .end(async (err, res) => {
                res.should.have.status(200);
                res.body.should.have.lengthOf(0);
                done();
              });
        });
      });
      describe('Check email validation', () => {
        const userB = UserData[1];
        const invalid = [
          'withoutatsign',
          '',
          ' ',
          '@nothingbefore.com',
        ];
        const valid = ['me@gmail.com', '123mpb@gmail.com', 'other@mail.com', 'someone@domain-my.com'];
        for (let i = 0; i < invalid.length; ++i) {
          const inv = invalid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.email = inv;
          it(`CREATE user with invalid email test ${i+1}: email = ${inv}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end((err, res) => {
                  res.should.have.status(400);
                  done();
                });
          });
        }
        for (let i = 0; i < valid.length; ++i) {
          const val = valid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.email = val;
          it(`CREATE user with valid email test ${i+1}: email = ${val}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end(async (err, res) => {
                  res.should.have.status(200);
                  await dropDatabase();
                  done();
                });
          });
        }
        it(`Check if User Collection Empty`, (done) => {
          chai.request(app)
              .get('/api/users')
              .end(async (err, res) => {
                res.should.have.status(200);
                res.body.should.have.lengthOf(0);
                done();
              });
        });
      });

      describe('Check phone number validation', () => {
        const userB = UserData[1];
        const invalid = ['502689128a22', 'fafs', '3421', '############', ''];
        const valid = ['+15026891243', '+16052322342', '+15333431342'];
        for (let i = 0; i < invalid.length; ++i) {
          const inv = invalid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.phone_number = inv;
          it(`CREATE user with invalid phone number test ${i+1}: phone # = ${inv}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end((err, res) => {
                  res.body.error.toLowerCase().should.include('phone');
                  res.should.have.status(400);
                  done();
                });
          });
        }
        for (let i = 0; i < valid.length; ++i) {
          const val = valid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.phone_number = val;
          it(`CREATE user with valid phone number test ${i+1}: phone # = ${val}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end(async (err, res) => {
                  res.should.have.status(200);
                  await dropDatabase();
                  done();
                });
          });
        }
        it(`Check if User Collection Empty`, (done) => {
          chai.request(app)
              .get('/api/users')
              .end(async (err, res) => {
                res.should.have.status(200);
                res.body.should.have.lengthOf(0);
                done();
              });
        });
      });
      describe('Check password validation', () => {
        const userB = UserData[1];
        const invalid = ['less7',
          'NoNumeric$',
          'NoSpecialSymbol123',
          'NOLOWERCASE123#',
          'asd421434143#',
          ' ',
          ''];
        const reasons = [StaticStrings.UserModelErrors.PasswordTooShort,
          StaticStrings.UserModelErrors.PasswordNoNumbers,
          StaticStrings.UserModelErrors.PasswordNoSpecial,
          StaticStrings.UserModelErrors.PasswordNoLowercase,
          StaticStrings.UserModelErrors.PasswordNoUppercase,
          StaticStrings.UserModelErrors.PasswordRequired,
          StaticStrings.UserModelErrors.PasswordRequired];
        const valid = ['AValidPassword123#',
          '1#tValid',
          '1@tValid',
          '1!tValid',
          '1$tValid',
          '1%tValid',
          '1^tValid'];
        for (let i = 0; i < invalid.length; ++i) {
          const inv = invalid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.password = inv;
          it(`CREATE user with invalid password test ${i+1}: password = ${inv}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.error.should.eql(`${reasons[i]}`);
                  done();
                });
          });
        }
        for (let i = 0; i < valid.length; ++i) {
          const val = valid[i];
          const userC = JSON.parse(JSON.stringify(userB));
          userC.password = val;
          it(`CREATE user with valid password test ${i+1}: password = ${val}`, (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userC)
                .end(async (err, res) => {
                  res.should.have.status(200);
                  await dropDatabase();
                  done();
                });
          });
        }
        it(`Check if User Collection Empty`, (done) => {
          chai.request(app)
              .get('/api/users')
              .end(async (err, res) => {
                res.should.have.status(200);
                res.body.should.have.lengthOf(0);
                done();
              });
        });
      });
    });
  });
};

export default baseTest;

