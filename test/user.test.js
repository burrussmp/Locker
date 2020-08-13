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
describe('Users', () => {
    describe('/GET /api/users', () => {
        it('GET empty user list', (done) => {
          chai.request(app)
              .get('/api/users')
              .end((err, res) => {
                if (err){
                    console.log(err);
                }
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.should.have.lengthOf(0);
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
                .end(async (err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.lengthOf(1);
                    res.body[0].first_name.should.be.a('string');
                    res.body[0].last_name.should.be.a('string');
                    res.body[0].email.should.be.a('string');
                    res.body[0].first_name.should.eql(user.first_name);
                    res.body[0].last_name.should.eql(user.last_name);
                    res.body[0].username.should.eql(user.username);
                    res.body[0].email.should.eql(user.email);
                    res.body[0].should.have.property('created');
                    res.body[0].should.have.property('updated');
                    // prepare for next check
                    await drop_database()
                    await User.create(UserData.slice(0,3))
                    done();
                });
          });
          it('GET list of users', (done) => {
            chai.request(app)
                .get('/api/users')
                .end(async (err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.lengthOf(3);
                    await drop_database()
                    done();
                });
          });
    });
    describe('/POST /api/users', () => {
        describe('Create USER', () => {
            let userA = UserData[0];
            let userB = UserData[1];
            it('CREATE a user', (done) => {
            chai.request(app)
                .post('/api/users')
                .send(userA)
                .end((err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(200);
                    res.body.message.should.be.a('string');
                    done();
                });
            });
            let userC = JSON.parse(JSON.stringify(userB))
            userC.username = userA.username;
            it('CREATE a user w/ same username (should fail)', (done) => {
                chai.request(app)
                    .post('/api/users')
                    .send(userC)
                    .end((err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(400);
                    res.body.error.should.eql('Username already exists');
                    done();
                    });
            });
            let userD = JSON.parse(JSON.stringify(userB))
            userD.email = userA.email;
            it('CREATE a user w/ same email (should fail)', (done) => {
                chai.request(app)
                    .post('/api/users')
                    .send(userD)
                    .end((err, res) => {
                    if (err){
                        console.log(err);
                    }
                    res.should.have.status(400);
                    res.body.error.should.eql('Email already exists');
                    done();
                });
            });
            let required_fields = ['username','email','first_name','last_name','password'];
            let suspected_error = ['Username','Email','First name','Last name','Password']
            for (let i = 0; i < required_fields.length; ++i){
                let required_field = required_fields[i];
                let userE = JSON.parse(JSON.stringify(userB))
                delete userE[required_field];
                it(`CREATE a user w/out ${required_field} (should fail)`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userE)
                        .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.eql(`${suspected_error[i]} is required`);
                        done();
                    });
                });            
            }
        });
        describe('Check username validation', () => {
            let userB = UserData[1];
            let invalid_usernames = ['thisusernameisnottoolongyetbutifikeepaddinglettersitwillbe','','  ','hello&'];
            let invalid_reasons = ['Username must be less than 32 characters','Username is required','Username is required','Valid alphanumeric username (underscores allowed) required']
            let valid_usernames = ['short','with_underscore','with_number_31','1hasthecorrectnumberofcharacters']
            for (let i = 0; i < invalid_usernames.length; ++i){
                let invalid_username = invalid_usernames[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.username = invalid_username;
                it(`CREATE user with invalid username test ${i+1}: username = ${invalid_username}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.eql(`${invalid_reasons[i]}`);
                        done();
                    });
                });
            }
            for (let i = 0; i < valid_usernames.length; ++i){
                let valid_username = valid_usernames[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.username = valid_username;
                it(`CREATE user with valid username test ${i+1}: username = ${valid_username}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end(async (err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        await drop_database()
                        done();
                    });
                });      
            }
            it(`Check if Empty`, (done) => {
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
        });
        describe('Check email validation', () => {
            let userB = UserData[1];
            let invalid = ['withoutatsign','without@dotcom','',' ','@nothingbefore.com'];
            let reasons = ['Valid email is required','Valid email is required','Email is required','Email is required','Valid email is required']
            let valid = ['me@gmail.com','123mpb@gmail.com','other@mail.com','someone@domain-my.com']
            for (let i = 0; i < invalid.length; ++i){
                let inv = invalid[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.email = inv;
                it(`CREATE user with invalid email test ${i+1}: email = ${inv}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.eql(`${reasons[i]}`);
                        done();
                    });
                });
            }
            for (let i = 0; i < valid.length; ++i){
                let val = valid[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.email = val;
                it(`CREATE user with valid email test ${i+1}: email = ${val}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end(async (err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        await drop_database()
                        done();
                    });
                });      
            }
            it(`Check if Empty`, (done) => {
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
        });
        describe('Check password validation', () => {
            let userB = UserData[1];
            let invalid = [ 'less7',
                            'NoNumeric$',
                            'NoSpecialSymbol123',
                            'NOLOWERCASE123#',
                            'asd421434143#',
                            ' ',
                            ''];
            let reasons = [ 'Password length must be > 7',
                            'Password must contain at least one numeric character',
                            'Password must contain at least one of: @, !, #, $, % or ^',
                            'Password must contain at least one lowercase character',
                            'Password must contain at least one uppercase character',
                            "Password is required",
                            "Password is required"]
            let valid = ['AValidPassword123#','1#tValid']
            for (let i = 0; i < invalid.length; ++i){
                let inv = invalid[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.password = inv;
                it(`CREATE user with invalid password test ${i+1}: password = ${inv}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end((err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(400);
                        res.body.error.should.eql(`${reasons[i]}`);
                        done();
                    });
                });
            }
            for (let i = 0; i < valid.length; ++i){
                let val = valid[i];
                let userC = JSON.parse(JSON.stringify(userB))
                userC.password = val;
                it(`CREATE user with valid password test ${i+1}: password = ${val}`, (done) => {
                    chai.request(app)
                        .post('/api/users')
                        .send(userC)
                        .end(async (err, res) => {
                        if (err){
                            console.log(err);
                        }
                        res.should.have.status(200);
                        await drop_database()
                        done();
                    });
                });
            }  
            it(`Check if Empty`, (done) => {
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
        });
    });
    describe('Check password authentication', () => {
        it('Should authenticate', async ()=>{
            let userA = UserData[0];
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
