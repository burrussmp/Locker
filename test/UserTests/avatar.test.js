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

const avatar_test = () => {
    describe("PATH: /api/users/:userId/avatar",()=>{
        describe("POST /api/users/:userId/avatar", ()=>{
            before( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save()
            });
            let id0,id1;
            let agent = chai.request.agent(app);
            let user = UserData[0];
            let login_user = {
                login: user.email,
                password: user.password
            };
            it("Set up",(done)=>{
                agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(2);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                    done();
                });
            });
            it("Empty field (should fail)",(done)=>{
                agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', null, 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
                        done();
                    });
                });
            })
            it("Wrong key (should fail)",(done)=>{
                agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    agent.post(`/api/users/${id1}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                        done();
                    });
                });
            })
            it("Not an image file (should fail)",(done)=>{
                agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile3.txt', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(422);
                        res.body.error.should.eql(StaticStrings.S3ServiceErrors.InvalidImageMimeType)
                    });
                });
            })

        });
    })
}

export default avatar_test;
