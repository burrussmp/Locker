// Import the dependencies for testing
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';

import StaticStrings from '../config/StaticStrings';
import User from '../server/models/user.model';
// Configure chai
chai.use(chaiHttp);
chai.should();

const auth_tests = () => {
        before(async () =>{
            await drop_database();
        });
        it(`Check if User Collection Empty`, (done) => {
            chai.request(app)
                .get('/api/users')
                .end(async (err, res) => {
                if (err){
                    console.log(err);
                }
                res.should.have.status(200);
                res.body.should.have.lengthOf(0)
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
                    res.body.message.should.eql(StaticStrings.SignedUpSuccess);
                    done();
                });
        });
        describe('Login', () => {
            it('Correct login (using username)', (done) => {
                let user = UserData[0];
                let login_user = {
                    login: user.username,
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.should.have.property('user');
                        done();
                    });
            });
            it('Correct login (using phone number)', (done) => {
                let user = UserData[0];
                let login_user = {
                    login: user.phone_number,
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.should.have.property('user');
                        done();
                    });
            });
            it('Correct login (using email)', (done) => {
                let user = UserData[0];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.should.have.property('user');
                        done();
                    });
            });
            it("Missing 'login' field of req", (done) => {
                let user = UserData[0];
                let login_user = {
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.MissingLogin);
                        done();
                    });
            });
            it("Missing 'password' field of req", (done) => {
                let user = UserData[0];
                let login_user = {
                    login: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.MissingPassword);
                        done();
                    });
            });
            it("Correct username but no matching", (done) => {
                let user = UserData[0];
                let login_user = {
                    login: "somecrazyusername",
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(404);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.UserNotFound);
                        done();
                    });
            });
            it("Correct email but no matching", (done) => {
                let user = UserData[0];
                let login_user = {
                    login: "crazy@mail.com",
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(404);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.UserNotFound);
                        done();
                    });
            });
            it("Correct phone number but no matching", (done) => {
                let user = UserData[0];
                let login_user = {
                    login: "204-323-3421",
                    password: user.password
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(404);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.UserNotFound);
                        done();
                    });
            });
            it("Invalid password", (done) => {
                let user = UserData[0];
                let login_user = {
                    login: user.username,
                    password: "INVALID"
                };
                chai.request(app)
                    .post('/auth/login')
                    .type('form')
                    .send(login_user)
                    .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(401);
                        res.body.error.should.be.eql(StaticStrings.LoginErrors.InvalidPassword);
                        done();
                    });
            });
            describe('Check password authentication', () => {
                it('Should authenticate', async ()=>{
                    let userA = UserData[2];
                    let user = new User(userA);
                    user = await user.save();
                    user.authenticate(userA.password).should.be.true;
                })
                it('Should not authenticate', async ()=>{
                    let user = await User.findOne({username:UserData[0].username})
                    user.authenticate('SomeDumbPassword').should.be.false;
                    await drop_database();
                })       
            });
        });
        describe('Logout', () => {
            it("Correct logout", (done) => {
                chai.request(app)
                    .get('/auth/logout')
                    .end(async (err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        res.body.message.should.be.eql(StaticStrings.LoggedOutSuccess);
                        await drop_database();
                        done();
                    });
            });
        });
}

export default auth_tests;