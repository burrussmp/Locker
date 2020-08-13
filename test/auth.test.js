// Import the dependencies for testing
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';
import User from '../server/models/user.model';

// Configure chai
chai.use(chaiHttp);
chai.should();

(async () => await drop_database())();

describe('User Auth', () => {
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
                res.body.message.should.be.a('string');
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
                    res.body.error.should.be.eql('Missing username, phone number, or email');
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
                    res.body.error.should.be.eql('Missing password');
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
                    res.should.have.status(401);
                    res.body.error.should.be.eql('User not found');
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
                    res.should.have.status(401);
                    res.body.error.should.be.eql('User not found');
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
                    res.should.have.status(401);
                    res.body.error.should.be.eql('User not found');
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
                    res.body.error.should.be.eql('Invalid password');
                    done();
                });
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
                    res.body.message.should.be.eql('Logged out');
                    await drop_database();
                    done();
                });
        });
    });
 
});