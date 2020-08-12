// Import the dependencies for testing
process.env.NODE_ENV = 'development';
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';

// Configure chai
chai.use(chaiHttp);
chai.should();

/*
* Tests
    PATH: /api/users
        1. Get empty user list
        2. Sign up a new user
        3. Get new user and check fields
*/


(async () => await drop_database())();
describe('Users', () => {
    describe('/GET User', () => {
        it('GET empty user list', (done) => {
          chai.request(app)
              .get('/api/users')
              .end((err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                done();
              });
        });
        it('CREATE new user', (done) => {
            let user = UserData[0];
            chai.request(app)
                .post('/api/users')
                .type('form')
                .send(user)
                .end((err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(200);
                    res.body.message.should.be.a('string');
                done();
                });
          });
          it('GET new user and check fields', (done) => {
            let user = UserData[0];
            chai.request(app)
                .get('/api/users')
                .end((err, res) => {
                      if (err){
                          console.log(err);
                      }
                      res.should.have.status(200);
                      res.body.should.be.a('array');
                      res.body[0].name.should.eql(user.name);
                      res.body[0].email.should.eql(user.email);
                      res.body[0].should.have.property('created');
                  done();
                });
          });
    });
});
