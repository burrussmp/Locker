// Import the dependencies for testing
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';
import User from '../server/models/user.model';
import StaticStrings from '../config/StaticStrings';

// Configure chai
chai.use(chaiHttp);
chai.should();

function main(){
    describe('Users', () => {
        before(async () =>{
            await drop_database();
        });
        describe('/GET /api/users', () => {
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
                        res.body.message.should.be.a('string');
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
                    'hello&'
                ];
                let invalid_reasons = [
                    StaticStrings.UserModelErrors.UsernameExceedLength,
                    StaticStrings.UserModelErrors.UsernameRequired,
                    StaticStrings.UserModelErrors.UsernameRequired,
                    StaticStrings.UserModelErrors.InvalidUsername
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

    describe("PATH: '/api/users/:userId'", ()=>{
        describe("Failure cases", ()=>{
            before( async () =>{
                await drop_database();
                let userA = UserData[1];
                let user = new User(userA);
                user = await user.save();
                let user2 = new User(UserData[0]);
                user2 = await user2.save()
            });
            after(async () =>{
                await drop_database();
            })
            let agent = chai.request.agent(app);
            it("/GET Attempt w/out login", (done)=>{
                agent.get('/api/users')
                .then((res) => {
                    res.body.length.should.be.at.least(1);
                    res.body[0].should.have.property('_id');
                    let id = res.body[0]._id;
                    agent.get(`/api/users/${id}`)
                    .end((err,res) => {
                        res.should.have.status(401);
                        res.body.error.should.be.eql(StaticStrings.UnauthorizedMissingTokenError);
                        done();
                    });
                });
            });
            it("/GET Attempt w/ incorrect login", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        return agent.get(`/api/users/wrong`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(404);
                                res.body.error.should.be.eql(StaticStrings.UserNotFoundError);
                                done()
                            })
                    });
            });
            it("/PUT Attempt to modify resource not owned", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                User.findOne({"username":UserData[0].username},(err,doc) =>{
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            agent.put(`/api/users/${doc._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .send({first_name:'new_first_name'})
                                .then((res)=>{
                                    res.should.have.status(403);
                                    res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                                    done();
                                })
                        });
                })
            });
            it("/DELETE Attempt to delete resource not owned", (done)=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                User.findOne({"username":UserData[0].username},(err,doc) =>{
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            agent.delete(`/api/users/${doc._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .then((res)=>{
                                    res.should.have.status(403);
                                    res.body.error.should.be.eql(StaticStrings.NotOwnerError);
                                    done();
                                })
                        });
                })
            });
            it("/GET Attempt w/ incorrect privileges (none)", async ()=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                await User.findOneAndUpdate({'username':user.username},{'permissions':[]},{new:true});
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.user.should.have.property('_id');
                        return agent.get(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(403);
                                res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                            })
                    });
            });
            it("/PUT Attempt w/ incorrect privileges (user:read)", async ()=>{
                let user = UserData[1];
                let login_user = {
                    login: user.email,
                    password: user.password
                };
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:read"]},{new:true});
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        res.body.user.should.have.property('_id');
                        return agent.delete(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(403);
                                res.body.error.should.be.eql(StaticStrings.InsufficientPermissionsError);
                            })
                    });
            });
        });
        describe("GET/PUT/DELETE /api/users/:userId", ()=>{
            beforeEach( async () =>{
                await drop_database();
                let userA = UserData[1];
                let user = new User(userA);
                user = await user.save();
            });
            after(async () =>{
                await drop_database();
            })
            let agent = chai.request.agent(app);
            let user = UserData[1];
            let login_user = {
                login: user.email,
                password: user.password
            };
            it("/GET w/ correct privileges", async ()=>{
                return agent.post('/auth/login')
                    .send(login_user)
                    .then((res) => {
                        return agent.get(`/api/users/${res.body.user._id}`)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.should.have.status(200);
                            })
                    });
            });
            it("/DELETE w/ correct privileges", async ()=>{
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                            return agent.delete(`/api/users/${res.body.user._id}`)
                                .set('Authorization',`Bearer ${res.body.token}`)
                                .then((res)=>{
                                    res.body.username.should.eql(user.username);
                                    return agent.get('/api/users')
                                        .then(res=>{
                                            res.body.length.should.eql(0);
                                        })
                                });
                        });
                });
            });
            it("/PUT w/ correct privileges", async ()=>{
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'username':'new_username','first_name':'new_firstname'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.status.should.eql(200);
                                res.body.username.should.eql('new_username');
                                res.body.first_name.should.eql('new_firstname')
                            });
                });
                });
            });
            it("/PUT w/ same username (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'username':'new_username'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.status.should.eql(400);
                                res.body.error.should.eql(StaticStrings.UserModelErrors.UsernameAlreadyExists);
                            });
                    });
                });
            });
            it("/PUT w/ invalid email (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'email':'error'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.UserModelErrors.InvalidEmail);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT w/ old password doesn't match current password (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error','old_password':'old'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.PasswordUpdateIncorrectError);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT missing old password (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error'})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.PasswordUpdateMissingError);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT new password is invalid (should fail)", async ()=>{
                let userA = UserData[2];
                userA.username = 'new_username';
                let user = new User(userA);
                user = await user.save();                
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(2);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'error','old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then((res)=>{
                                res.body.error.should.eql(StaticStrings.UserModelErrors.PasswordTooShort);
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT not allowed to update hashed_password (should fail)", async ()=>{          
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'hashed_password':'myNewPassword12$','bad_key':123,'old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                res.body.error.should.be.eql(`${StaticStrings.UserControllerErrors.BadRequestInvalidFields} 'hashed_password,bad_key'`)
                                res.status.should.eql(400);
                            });
                    });
                });
            });
            it("/PUT new password is valid, old password is correct, so password should update", async ()=>{
                let user_new_pass = await User.findOne({'username':UserData[1].username});
                return agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    return agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        return agent.put(`/api/users/${res.body.user._id}`)
                            .send({'password':'myNewPassword12$','old_password':UserData[1].password})
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                user_new_pass = await User.findOne({'username':UserData[1].username});
                                user_new_pass.authenticate('myNewPassword12$').should.be.true;
                                res.status.should.eql(200);
                            });
                    });
                });
            });
            it("/PUT all possible mutable fields (except password and photo)", (done)=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'male',
                    'email' : 'new@mail.com',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                    'phone_number': '345-323-3421'
                }
                agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        agent.put(`/api/users/${res.body.user._id}`)
                            .send(data)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                let info = await User.findOne({'username':'test'}).select(Object.keys(data));
                                for (let key of Object.keys(data)){
                                    info[key].should.eql(data[key]);
                                }
                                res.status.should.eql(200);
                                done()
                            });
                    });
                });
            });
            it("/PUT all possible mutable fields (except password and photo), but invalid gender", (done)=>{
                let data = {
                    'first_name': 'test',
                    'last_name' : 'test',
                    'username' : 'test',
                    'gender' : 'fdafas',
                    'email' : 'new@mail.com',
                    'date_of_birth' : new Date(2006,6,18,18,7),
                    'about':'test',
                    'phone_number': '345-323-3421'
                }
                agent.get('/api/users')
                    .then(res=>{
                    res.body.length.should.eql(1);
                    agent.post('/auth/login')
                        .send(login_user)
                        .then((res) => {
                        agent.put(`/api/users/${res.body.user._id}`)
                            .send(data)
                            .set('Authorization',`Bearer ${res.body.token}`)
                            .then(async (res)=>{
                                res.status.should.eql(400);
                                res.body.error.should.eql(StaticStrings.UserModelErrors.InvalidGender)
                                done()
                            });
                    });
                });
            });
        });
    });
}

export default main;