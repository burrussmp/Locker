import chai, { should }  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import Image from '../../server/models/image.model';
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../../server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

const avatar_test = () => {
    describe("PATH: /api/users/:userId/avatar",()=>{
        describe("POST /api/users/:userId/avatar", ()=>{
            let id0,id1;
            let agent = chai.request.agent(app);
            let user = UserData[0];
            let login_user = {
                login: user.email,
                password: user.password
            };
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save()
                return agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(2);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                });            
            });
            it("Successfully post an image (png); then delete it from S3 and MongoDB", async()=>{
                return agent.post('/auth/login').send(login_user).then(async (res) => {
                    res.body.should.have.property('token');
                    let id = id0;
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        user.should.have.property('profile_photo');
                        user.profile_photo.should.have.property('key');
                        let image = await Image.findOne({"key":user.profile_photo.key});
                        image.uploadedBy.toString().should.eql(id);
                        let key = image.key;
                        return S3_Services.fileExistsS3(key).then(data=>{
                            data.Metadata.type.should.eql('profile_photo');
                            data.Metadata.user_id.should.eql(id);
                            data.Metadata.user_id.should.eql(user._id.toString());
                        })
                        // console.log(err)
                        // data.Metadata.type.should.eql('profile_photo');
                        // data.Metadata.user_id.should.eql("fdafd");
                        // data.Metadata.user_id.should.eql(user._id.toString());
                        // let key = image.key;
                        // console.log('here')

                            // return S3_Services.deleteImageS3(key,async (err)=>{
                            //     console.log('hi')
                            //     (err == undefined || err == null).should.be.true;
                            //     image = await Image.findOne({"key":key});
                            //     (image == undefined || image == null).should.be.false;
                            //     return S3_Services.fileExistsS3(key, (err,data)=>{
                            //         console.log(err.message);
                            //         console.log(data);
                            //     })
                            // });
                    })
                });
            });
            // it("Successfully post an image (jpg)", async()=>{
            //     return agent.post('/auth/login').send(login_user).then((res) => {
            //         res.body.should.have.property('token');
            //         let id = id0;
            //         return agent.post(`/api/users/${id}/avatar`)
            //         .set('Authorization',`Bearer ${res.body.token}`)
            //         .attach('image', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
            //         .then(async (res)=>{
            //             res.status.should.eql(200);
            //             res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
            //             let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
            //             user.should.have.property('profile_photo');
            //             user.profile_photo.should.have.property('key');
            //             let image = await Image.findOne({"key":user.profile_photo.key});
            //             image.uploadedBy.toString().should.eql(id);
            //             image.key.should.eql(user.profile_photo.key);
            //             return S3_Services.fileExistsS3(image.key,(err,data)=>{
            //                 (err == undefined || err == null).should.be.true
            //                 data.Metadata.type.should.eql('profile_photo');
            //                 data.Metadata.user_id.should.eql(id);
            //                 data.Metadata.user_id.should.eql(user._id.toString());
            //             })
            //         });
            //     });
            // });
            it("Empty field (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', null, 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
                    });
                });
            })
            it("Not owner (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id1}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError);
                    });
                });
            })
            it("User not found (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/somedummy/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.UserNotFoundError);
                    });
                });
            })
            it("Check permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:read"]},{new:true});
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                    });
                });
            });
            it("Not an image file (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('image', process.cwd()+'/test/resources/profile3.txt', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(422);
                        res.body.error.should.eql(StaticStrings.S3ServiceErrors.InvalidImageMimeType)
                    });
                });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.post(`/api/users/${id0}/avatar`)
                .attach('image', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });

        });
    })
}

export default avatar_test;
