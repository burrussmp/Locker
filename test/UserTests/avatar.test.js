import chai, { should }  from 'chai';
import chaiHttp from 'chai-http';
const fs = require('fs').promises
import fetch from 'node-fetch';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data'
import {drop_database,buffer_equality} from  '../helper';
import User from '../../server/models/user.model';
import Media from '../../server/models/media.model';
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../../server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

const default_profile_photo = '/client/assets/images/profile-pic.png'

const avatar_test = () => {
    describe("Profile Photo",()=>{
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
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        user.should.have.property('profile_photo');
                        user.profile_photo.should.have.property('key');
                        let image = await Media.findOne({"key":user.profile_photo.key});
                        image.mimetype.should.eql('image/png');
                        image.uploadedBy.toString().should.eql(id);
                        let key = image.key;
                        return S3_Services.fileExistsS3(key).then(data=>{
                            data.Metadata.type.should.eql('profile_photo');
                            data.Metadata.user_id.should.eql(id);
                            data.Metadata.user_id.should.eql(user._id.toString());
                            return S3_Services.deleteMediaS3(key).then(async ()=> {
                                image = await Media.findOne({"key":key});
                                (image == undefined || image == null).should.be.true;
                                return S3_Services.fileExistsS3(key).catch(err=>{
                                    err.should.exist;
                                })
                            })
                        })
                    })
                });
            }).timeout(3000);
            it("Successfully post an image (jpg)", async()=>{
                return agent.post('/auth/login').send(login_user).then(async (res) => {
                    res.body.should.have.property('token');
                    let id = id0;
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        user.should.have.property('profile_photo');
                        user.profile_photo.should.have.property('key');
                        let image = await Media.findOne({"key":user.profile_photo.key});
                        image.mimetype.should.eql('image/jpeg');
                        image.uploadedBy.toString().should.eql(id);
                        let key = image.key;
                        return S3_Services.fileExistsS3(key).then(data=>{
                            data.Metadata.type.should.eql('profile_photo');
                            data.Metadata.user_id.should.eql(id);
                            data.Metadata.user_id.should.eql(user._id.toString());
                            return S3_Services.deleteMediaS3(key).then(async ()=> {
                                image = await Media.findOne({"key":key});
                                (image == undefined || image == null).should.be.true;
                                return S3_Services.fileExistsS3(key).catch(err=>{
                                    err.should.exist;
                                })
                            })
                        })
                    })
                });
            }).timeout(3000);
            it("delete a user and then see if cleaned up in S3", async()=>{
                return agent.post('/auth/login').send(login_user).then(async (res) => {
                    let id = id0;
                    let token = res.body.token;
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
                    .then(async (res)=>{
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        let image = await Media.findOne({"key":user.profile_photo.key});
                        image.mimetype.should.eql('image/jpeg');
                        let key = image.key;
                        return agent.delete(`/api/users/${id}?access_token=${token}`).then(res=>{
                            return S3_Services.fileExistsS3(key).catch(err=>{
                                (err==null || err==undefined).should.be.false;
                                err.statusCode.should.eql(404)
                            })
                        });
                    })
                });
            }).timeout(3000);
            it("Empty field (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('profile_photo', null, 'profile_photo')
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
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
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
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.UserNotFoundError);
                    });
                });
            })
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:read"]},{new:true});
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.post(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
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
                    .attach('profile_photo', process.cwd()+'/test/resources/profile3.txt', 'profile_photo')
                    .then(res=>{
                        res.status.should.eql(422);
                        res.body.error.should.eql(StaticStrings.S3ServiceErrors.InvalidImageMimeType)
                    });
                });
            });
            it("Not logged in (should fail)",async ()=>{
                return agent.post(`/api/users/${id0}/avatar`)
                .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            });
            it("Check if overwrite works (upload twice). This checks if MongoDB and S3 have been cleaned. Old entry should be gone", async()=>{
                return agent.post('/auth/login').send(login_user).then(async (res) => {
                    res.body.should.have.property('token');
                    let id = id0;
                    let token = res.body.token;                    
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        let image = await Media.findOne({"key":user.profile_photo.key});
                        let key = image.key;
                        return S3_Services.fileExistsS3(key).then(()=>{
                            return agent.post(`/api/users/${id}/avatar`)
                            .set('Authorization',`Bearer ${token}`)
                            .attach('profile_photo', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
                            .then(async ()=>{
                                let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                                let image = await Media.findOne({"key":user.profile_photo.key});
                                let old_image = await Media.findOne({"key":key});
                                (old_image == null || old_image == undefined).should.be.true;
                                let key2 = image.key;
                                key.should.not.eql(key2);
                                let all_images = await Media.countDocuments();
                                all_images.should.eql(1);
                                return S3_Services.fileExistsS3(key2).then(async()=>{
                                    return S3_Services.fileExistsS3(key).catch(async err=>{
                                        (err == null || err == undefined).should.be.false;
                                    })
                                })
                            })
                        })
                    })
                });
            }).timeout(3000);
            it("Check if two users upload; there should be an 2 entries in MongoDB and both files should exist in S3 bucket", async()=>{
                return agent.post('/auth/login').send(login_user).then(async (res) => {
                    res.body.should.have.property('token');
                    let id = id0;
                    let id2 = id1;
                    let token = res.body.token;                    
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        let user = await User.findById({"_id":id}).populate('profile_photo','key').exec()
                        let image = await Media.findOne({"key":user.profile_photo.key});
                        let key = image.key;
                        return agent.post('/auth/login').send({login:UserData[1].username,password:UserData[1].password}).then(async (res) => {                   
                            return agent.post(`/api/users/${id2}/avatar`).set('Authorization',`Bearer ${res.body.token}`)
                            .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                            .then(async (res)=>{
                                let user2 = await User.findById({"_id":id2}).populate('profile_photo','key').exec()
                                let image2 = await Media.findOne({"key":user2.profile_photo.key});
                                let key2 = image2.key;
                                key2.should.not.eql(key);
                                let all_images = await Media.countDocuments();
                                all_images.should.eql(2);
                                return S3_Services.fileExistsS3(key2).then(async()=>{
                                    return S3_Services.fileExistsS3(key).catch(async err=>{
                                        (err == null || err == undefined).should.be.true;
                                    })
                                })
                            })
                        })
                    })
                });
            }).timeout(3000);
        })
        describe("GET /api/users/:userId/avatar", ()=>{
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
            it("Get default profile",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    let id = id0;   
                    let token = res.body.token;
                    return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
                        method: 'get',
                        headers: {
                          'content-type': 'application/json',
                          'Authorization' : `Bearer ${token}`
                        },
                        credentials: "include"
                      }).then(res=>res.blob())
                        .then(async res=>{
                            let buffer = await res.arrayBuffer();
                            return fs.readFile(process.cwd()+default_profile_photo).then(data=>{
                                buffer_equality(data,buffer).should.be.true;
                            })
                        })
                    });
            })
            it("Not owner (should succeed)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.get(`/api/users/${id1}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .then(res=>{
                        res.status.should.eql(200);
                    });
                });
            })
            it("Not logged in (should fail)",async ()=>{
                return agent.get(`/api/users/${id1}/avatar`).then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });
            })
            it("User not found (should fail)",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.get(`/api/users/somedummy/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .then(res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.UserNotFoundError);
                    });
                });
            })
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:edit_content"]},{new:true});
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    return agent.get(`/api/users/${id0}/avatar`)
                    .set('Authorization',`Bearer ${res.body.token}`)
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                    });
                });
            });
            it("Post new image, check if correctly updated, delete, check if default set to user",async ()=>{
                return agent.post('/auth/login').send(login_user).then((res) => {
                    res.body.should.have.property('token');
                    let id = id0;
                    let token = res.body.token;
                    return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess)
                        return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
                            method: 'get',
                            headers: {
                                'content-type': 'application/json',
                                'Authorization' : `Bearer ${token}`
                            },
                            credentials: "include"
                            }).then(res=>res.blob())
                            .then(async res=>{
                                let buffer = await res.arrayBuffer();
                                return fs.readFile(process.cwd()+'/test/resources/profile1.png').then(data=>{
                                    buffer_equality(data,buffer).should.be.true;
                                    return agent.delete(`/api/users/${id}/avatar`)
                                    .set('Authorization',`Bearer ${token}`)
                                    .then(async (res)=>{
                                        res.status.should.eql(200);
                                        res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess)
                                        return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
                                            method: 'get',
                                            headers: {
                                                'content-type': 'application/json',
                                                'Authorization' : `Bearer ${token}`
                                            },
                                            credentials: "include"
                                            }).then(res=>res.blob())
                                            .then(async res=>{
                                                let buffer = await res.arrayBuffer();
                                                return fs.readFile(process.cwd()+default_profile_photo).then(data=>{
                                                    buffer_equality(data,buffer).should.be.true;
                                                })
                                            })
                                    });
                                })
                        })
                    });
                });
            }).timeout(6000);
        });
        describe("/DELETE /api/users/:userId/avatar (A user has a non-default photo to begin each test)",()=>{
            let id0,id1;
            let agent = chai.request.agent(app);
            let user = UserData[0];
            let login_user = {
                login: user.email,
                password: user.password
            };
            let token;
            beforeEach( async () =>{
                await drop_database();
                let user = new User(UserData[0]);
                await user.save();
                user = new User(UserData[1]);
                await user.save()
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(2);
                    res.body[0].username.should.eql(UserData[0].username)
                    id0 = res.body[0]._id;
                    id1 = res.body[1]._id;
                });
                await agent.post('/auth/login').send(login_user).then((res) => {
                    let id = id0;
                    token = res.body.token;
                    return agent.post(`/api/users/${id}/avatar`).set('Authorization',`Bearer ${token}`).attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                });    
            });
            it("Delete twice (first succeeds and second fails)",async ()=>{
                let id = id0;
                let m_token = token;
                return agent.delete(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${m_token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess)
                        return agent.delete(`/api/users/${id}/avatar`)
                            .set('Authorization',`Bearer ${m_token}`)
                            .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                            .then(async (res)=>{
                                res.status.should.eql(404);
                                res.body.error.should.eql(StaticStrings.UserControllerErrors.ProfilePhotoNotFound)
                    });
                });
            });
            it("Delete user and see if S3 gets cleaned up correctly",async ()=>{
                let id = id0;
                let m_token = token;
                return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization',`Bearer ${m_token}`)
                    .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess)
                        let image = await Media.findOne({uploadedBy:id});
                        let key = image.key;
                        return agent.delete(`/api/users/${id}`)
                            .set('Authorization',`Bearer ${m_token}`)
                            .then(async (res)=>{
                                res.status.should.eql(200);
                                return S3_Services.fileExistsS3(key).catch(async(err)=>{
                                    err.statusCode.should.eql(404);
                                    let image = await Media.findOne({'key':key});
                                    (image == null || image == undefined).should.be.true;
                                })
                    });
                });
            });
            it("Not owner (should fail)",async ()=>{
                let id = id0;
                let m_token = token;
                return agent.delete(`/api/users/${id1}/avatar`).set('Authorization',`Bearer ${m_token}`)
                    .then(res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError)
                    });
            });
            it("Not logged in (should fail)",async ()=>{
                let id = id0;
                let m_token = token;
                return agent.delete(`/api/users/${id0}/avatar`)
                    .then(res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                    });
            });
            it("User does not exists (should fail)",async ()=>{
                let id = id0;
                let m_token = token;
                return agent.delete(`/api/users/somewrongthing/avatar`).set('Authorization',`Bearer ${m_token}`)
                    .then(res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.UserNotFoundError)
                    });
            });
            it("Invalid permissions (should fail)", async()=>{
                await User.findOneAndUpdate({'username':user.username},{'permissions':["user:read"]},{new:true});
                let id = id0;
                let m_token = token;
                return agent.delete(`/api/users/${id}/avatar`).set('Authorization',`Bearer ${m_token}`).then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                });
            });
            it("Delete and check MongoDB and S3 to see if cleaned up",async ()=>{
                let id = id0;
                let m_token = token;
                let user = await User.findById({'_id':id}).populate('profile_photo','key').exec();
                let key = user.profile_photo.key;
                let image = await Media.findOne({'key':key});
                (image == null || image == undefined).should.be.false;
                return S3_Services.fileExistsS3(key).then(async()=>{
                    return agent.delete(`/api/users/${id}/avatar`)
                        .set('Authorization',`Bearer ${m_token}`)
                        .attach('profile_photo', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                        .then(async (res)=>{
                            res.status.should.eql(200);
                            res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess);
                            return S3_Services.fileExistsS3(key).catch(async(err)=>{
                                err.statusCode.should.eql(404);
                                let image = await Media.findOne({'key':key});
                                (image == null || image == undefined).should.be.true;
                            })
                    });
                });
            });
        });
    });
}

export default avatar_test;
