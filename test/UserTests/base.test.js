import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../../server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

const base_test = () => {
    describe('Create and list all users',()=>{
       describe('/GET /api/users', () => {
            before(async()=>{
                await drop_database()
            })
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
                        res.body[0].username.should.eql(user.username);
                        res.body[0].should.have.property('_id');
                        res.body[0].should.have.property('createdAt');
                        res.body[0].should.have.property('updatedAt');
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
                        done();
                    });
                });
                describe('Check unique fields', () => {
                    let unique_fields = ['username','email','phone_number'];
                    let unique_response = ['Username','Email','PhoneNumber']
                    for (let i = 0; i < unique_fields.length;++i){
                        let field = unique_fields[i];
                        let userC = JSON.parse(JSON.stringify(userB))
                        userC[field] = userA[field];
                        it(`CREATE a user w/ same ${field} (should fail)`, (done) => {
                            chai.request(app)
                                .post('/api/users')
                                .send(userC)
                                .end((err, res) => {
                                if (err){
                                    console.log(err);
                                }
                                res.should.have.status(400);
                                res.body.error.should.eql(StaticStrings.UserModelErrors[`${unique_response[i]}AlreadyExists`]);
                                done();
                                });
                        });
                    }
                });
                it("Create with incorrect field (EVIL) should fail", (done)=>{
                    let user = UserData[0];
                    user.evil = "MWAHAHAH"
                    chai.request(app)
                        .post('/api/users')
                        .type('form')
                        .send(user)
                        .end((err, res) => {
                            if (err){
                                console.log(err);
                            }
                            res.should.have.status(400);
                            res.body.error.should.be.a('string');
                            done();
                        });
                });
                describe('Check required fields', () => {
                    let required_fields = ['username','email','first_name','last_name','password','phone_number'];
                    let suspected_error = ['Username','Email','FirstName','LastName','Password','PhoneNumber']
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
                                res.body.error.should.eql(StaticStrings.UserModelErrors[`${suspected_error[i]}Required`]);
                                done();
                            });
                        });            
                    }
                });
            });
            describe('Check username validation', () => {
                let userB = UserData[1];
                let invalid_usernames = [
                    'thisusernameisnottoolongyetbutifikeepaddinglettersitwillbe',
                    '',
                    '  ',
                    'hello&',
                ];
                let invalid_reasons = [
                    StaticStrings.UserModelErrors.UsernameExceedLength,
                    StaticStrings.UserModelErrors.UsernameRequired,
                    StaticStrings.UserModelErrors.UsernameRequired,
                    StaticStrings.UserModelErrors.InvalidUsername,
                ]
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
            });
            describe('Check email validation', () => {
                let userB = UserData[1];
                let invalid = [
                    'withoutatsign',
                    'without@dotcom',
                    '',
                    ' ',
                    '@nothingbefore.com'
                ];
                let reasons = [StaticStrings.UserModelErrors.InvalidEmail,
                    StaticStrings.UserModelErrors.InvalidEmail,
                    'Email is required',
                    'Email is required',
                    StaticStrings.UserModelErrors.InvalidEmail
                ]
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
            });

            describe('Check phone number validation', () => {
                let userB = UserData[1];
                let invalid = ['502689128a22','fafs','3421','############',''];
                let reasons = [StaticStrings.UserModelErrors.InvalidPhoneNumber,
                    StaticStrings.UserModelErrors.InvalidPhoneNumber,
                    StaticStrings.UserModelErrors.InvalidPhoneNumber,
                    StaticStrings.UserModelErrors.InvalidPhoneNumber,
                    StaticStrings.UserModelErrors.PhoneNumberRequired
                ]
                let valid = ['502-689-1243','605-232-2342','533-343-1342']
                for (let i = 0; i < invalid.length; ++i){
                    let inv = invalid[i];
                    let userC = JSON.parse(JSON.stringify(userB))
                    userC.phone_number = inv;
                    it(`CREATE user with invalid phone number test ${i+1}: phone # = ${inv}`, (done) => {
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
                    userC.phone_number = val;
                    it(`CREATE user with valid phone number test ${i+1}: phone # = ${val}`, (done) => {
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
            });
            describe('Check password validation', () => {
                let userB = UserData[1];
                let invalid = [ 'less7',
                                'NoNumeric$',
                                'NoSpecialSymbol123;',
                                'NOLOWERCASE123#',
                                'asd421434143#',
                                ' ',
                                ''];
                let reasons = [ StaticStrings.UserModelErrors.PasswordTooShort,
                                StaticStrings.UserModelErrors.PasswordNoNumbers,
                                StaticStrings.UserModelErrors.PasswordNoSpecial,
                                StaticStrings.UserModelErrors.PasswordNoLowercase,
                                StaticStrings.UserModelErrors.PasswordNoUppercase,
                                StaticStrings.UserModelErrors.PasswordRequired,
                                StaticStrings.UserModelErrors.PasswordRequired,]
                let valid = ['AValidPassword123#',
                    '1#tValid',
                    '1@tValid',
                    '1!tValid',
                    '1$tValid',
                    '1%tValid',
                    '1^tValid']
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
            });
        });
    });
}

export default base_test;

