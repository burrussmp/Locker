/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
const fs = require('fs').promises;
import fetch from 'node-fetch';
import {app} from '@server/server';
import {UserData} from '@development/user.data';
import {dropDatabase, bufferEquality, createUser} from '@test/helper';
import User from '@server/models/user.model';
import RBAC from '@server/models/rbac.model';
import Media from '@server/models/media.model';
import StaticStrings from '@config/StaticStrings';
import S3Services from '@server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

const defaultProfilePhoto = '/client/assets/images/profile-pic.png';

const avatarTest = () => {
  describe('Profile Photo', ()=>{
    describe('POST /api/users/:userId/avatar', ()=>{
      let id0; let id1;
      let accessToken0; let accessToken1;
      const agent = chai.request.agent(app);
      const user = UserData[0];
      beforeEach( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        accessToken0 = user.access_token;
        user = await createUser(UserData[1]);
        accessToken1 = user.access_token;
        id1 = user._id;
        return agent.get('/api/users').then((res)=>{
          res.body.length.should.eql(2);
          res.body[0].username.should.eql(UserData[0].username);
        });
      });
      afterEach(async ()=>{
        // cleanup
        const users = await User.find();
        for (const user of users) {
          await user.deleteOne();
        }
      });
      it('Successfully post an avatar (png); then delete it from S3 and MongoDB', async ()=>{
        const id = id0;
        return agent.post(`/api/users/${id0}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png')
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
              user.should.have.property('profile_photo');
              user.profile_photo.should.have.property('key');
              let image = await Media.findOne({'key': user.profile_photo.key});
              image.mimetype.should.eql('image/png');
              image.uploadedBy.toString().should.eql(id);
              const key = image.key;
              return S3Services.fileExistsS3(key).then((data)=>{
                data.Metadata.type.should.eql('Avatar');
                data.Metadata.uploader.should.eql(id);
                data.Metadata.uploader.should.eql(user._id.toString());
                return S3Services.deleteMediaS3(key).then(async ()=> {
                  image = await Media.findOne({'key': key});
                  (image == undefined || image == null).should.be.true;
                  return S3Services.fileExistsS3(key).catch((err)=>{
                    err.should.exist;
                  });
                });
              });
            });
      });
      it('Successfully post an image (jpg)', async ()=>{
        const id = id0;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
              user.should.have.property('profile_photo');
              user.profile_photo.should.have.property('key');
              let image = await Media.findOne({'key': user.profile_photo.key});
              image.mimetype.should.eql('image/jpeg');
              image.uploadedBy.toString().should.eql(id);
              const key = image.key;
              return S3Services.fileExistsS3(key).then((data)=>{
                data.Metadata.type.should.eql('Avatar');
                data.Metadata.uploader.should.eql(id);
                data.Metadata.uploader.should.eql(user._id.toString());
                return S3Services.deleteMediaS3(key).then(async ()=> {
                  image = await Media.findOne({'key': key});
                  (image == undefined || image == null).should.be.true;
                  return S3Services.fileExistsS3(key).catch((err)=>{
                    err.should.exist;
                  });
                });
              });
            });
      });
      it('delete a user and then see if cleaned up in S3', async ()=>{
        const id = id0;
        const token = accessToken0;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
            .then(async (res)=>{
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
              const image = await Media.findOne({'key': user.profile_photo.key});
              image.mimetype.should.eql('image/jpeg');
              const key = image.key;
              return agent.delete(`/api/users/${id}?access_token=${token}`).then((res)=>{
                return S3Services.fileExistsS3(key).catch((err)=>{
                  (err==null || err==undefined).should.be.false;
                  err.statusCode.should.eql(404);
                });
              });
            });
      });
      it('Empty field (should fail)', async ()=>{
        return agent.post(`/api/users/${id0}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', null, 'profile_photo')
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.BadRequestMissingFile);
            });
      });
      it('Not owner (should fail)', async ()=>{
        return agent.post(`/api/users/${id1}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
            });
      });
      it('User not found (should fail)', async ()=>{
        return agent.post(`/api/users/somedummy/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': user.username}, {'permissions': NARole._id}, {new: true});
        return agent.post(`/api/users/${id0}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              const UserRole = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': user.username}, {'permissions': UserRole._id}, {new: true});
            });
      });
      it('Not an image file (should fail)', async ()=>{
        return agent.post(`/api/users/${id0}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .attach('media', process.cwd()+'/test/resources/profile3.txt', 'profile_photo')
            .then((res)=>{
              res.status.should.eql(422);
              res.body.error.should.include(StaticStrings.S3ServiceErrors.InvalidImageMimeType);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.post(`/api/users/${id0}/avatar`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Check if overwrite works (upload twice). This checks if MongoDB and S3 have been cleaned. Old entry should be gone', async ()=>{
        const id = id0;
        const token = accessToken0;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${token}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
              const image = await Media.findOne({'key': user.profile_photo.key});
              const key = image.key;
              return S3Services.fileExistsS3(key).then(()=>{
                return agent.post(`/api/users/${id}/avatar`)
                    .set('Authorization', `Bearer ${token}`)
                    .attach('media', process.cwd()+'/test/resources/profile2.jpg', 'profile_photo')
                    .then(async ()=>{
                      const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
                      const image = await Media.findOne({'key': user.profile_photo.key});
                      const oldImage = await Media.findOne({'key': key});
                      (oldImage == null || oldImage == undefined).should.be.true;
                      const key2 = image.key;
                      key.should.not.eql(key2);
                      return S3Services.fileExistsS3(key2).then(async ()=>{
                        return S3Services.fileExistsS3(key).catch(async (err)=>{
                          (err == null || err == undefined).should.be.false;
                        });
                      });
                    });
              });
            });
      });
      it('Check if two users upload; there should be an 2 entries in MongoDB and both files should exist in S3 bucket', async ()=>{
        const id = id0;
        const id2 = id1;
        const token = accessToken0;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${token}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
              const image = await Media.findOne({'key': user.profile_photo.key});
              const key = image.key;
              return agent.post(`/api/users/${id2}/avatar`).set('Authorization', `Bearer ${accessToken1}`)
                  .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                  .then(async (res)=>{
                    const user2 = await User.findById({'_id': id2}).populate('profile_photo', 'key').exec();
                    const image2 = await Media.findOne({'key': user2.profile_photo.key});
                    const key2 = image2.key;
                    key2.should.not.eql(key);
                    return S3Services.fileExistsS3(key2).then(async ()=>{
                      return S3Services.fileExistsS3(key).catch(async (err)=>{
                        (err == null || err == undefined).should.be.true;
                      });
                    });
                  });
            });
      });
    });
    describe('GET /api/users/:userId/avatar', ()=>{
      let id0; let id1;
      let accessToken0;
      const agent = chai.request.agent(app);
      const user = UserData[0];
      beforeEach( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        accessToken0 = user.access_token;
        user = await createUser(UserData[1]);
        id1 = user._id;
        return agent.get('/api/users').then((res)=>{
          res.body.length.should.eql(2);
          res.body[0].username.should.eql(UserData[0].username);
        });
      });
      afterEach(async ()=>{
        // cleanup
        const users = await User.find();
        for (const user of users) {
          await user.deleteOne();
        }
      });
      it('Get default profile', async ()=>{
        const id = id0;
        const token = accessToken0;
        return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
          method: 'get',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }).then((res)=>res.blob())
            .then(async (res)=>{
              const buffer = await res.arrayBuffer();
              return fs.readFile(process.cwd()+defaultProfilePhoto).then((data)=>{
                bufferEquality(data, buffer).should.be.true;
              });
            });
      });
      it('Not owner (should succeed)', async ()=>{
        return agent.get(`/api/users/${id1}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.get(`/api/users/${id1}/avatar`).then((res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('User not found (should fail)', async ()=>{
        return agent.get(`/api/users/somedummy/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': user.username}, {'permissions': NARole._id}, {new: true});
        return agent.get(`/api/users/${id0}/avatar`)
            .set('Authorization', `Bearer ${accessToken0}`)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
      it('Post new image, check if correctly updated, delete, check if default set to user', async ()=>{
        const id = id0;
        const token = accessToken0;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${token}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
                method: 'get',
                headers: {
                  'content-type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
              }).then((res)=>res.blob())
                  .then(async (res)=>{
                    const buffer = await res.arrayBuffer();
                    return fs.readFile(process.cwd()+'/test/resources/profile1.png').then((data)=>{
                      bufferEquality(data, buffer).should.be.true;
                      return agent.delete(`/api/users/${id}/avatar`)
                          .set('Authorization', `Bearer ${token}`)
                          .then(async (res)=>{
                            res.status.should.eql(200);
                            res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess);
                            return fetch(`http://localhost:3000/api/users/${id}/avatar`, {
                              method: 'get',
                              headers: {
                                'content-type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              credentials: 'include',
                            }).then((res)=>res.blob())
                                .then(async (res)=>{
                                  const buffer = await res.arrayBuffer();
                                  return fs.readFile(process.cwd()+defaultProfilePhoto).then((data)=>{
                                    bufferEquality(data, buffer).should.be.true;
                                  });
                                });
                          });
                    });
                  });
            });
      });
    });
    describe('/DELETE /api/users/:userId/avatar (A user has a non-default photo to begin each test)', ()=>{
      let id0; let id1;
      let accessToken0;
      const agent = chai.request.agent(app);
      const user = UserData[0];
      const loginUser = {
        login: user.email,
        password: user.password,
      };
      let token;
      beforeEach( async () =>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        id0 = user._id;
        accessToken0 = user.access_token;
        user = await createUser(UserData[1]);
        id1 = user._id;
        await agent.get('/api/users').then((res)=>{
          res.body.length.should.eql(2);
          res.body[0].username.should.eql(UserData[0].username);
        });
        await agent.post('/auth/login').send(loginUser).then((res) => {
          const id = id0;
          token = accessToken0;
          return agent.post(`/api/users/${id}/avatar`).set('Authorization', `Bearer ${token}`).attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo');
        });
      });
      afterEach(async ()=>{
        // cleanup
        const users = await User.find();
        for (const user of users) {
          await user.deleteOne();
        }
      });
      it('Delete twice (first succeeds and second fails)', async ()=>{
        const id = id0;
        const mToken = token;
        return agent.delete(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${mToken}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess);
              return agent.delete(`/api/users/${id}/avatar`)
                  .set('Authorization', `Bearer ${mToken}`)
                  .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
                  .then(async (res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.UserControllerErrors.ProfilePhotoNotFound);
                  });
            });
      });
      it('Delete user and see if S3 gets cleaned up correctly', async ()=>{
        const id = id0;
        const mToken = token;
        return agent.post(`/api/users/${id}/avatar`)
            .set('Authorization', `Bearer ${mToken}`)
            .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UploadProfilePhotoSuccess);
              const image = await Media.findOne({uploadedBy: id});
              const key = image.key;
              return agent.delete(`/api/users/${id}`)
                  .set('Authorization', `Bearer ${mToken}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    return S3Services.fileExistsS3(key).catch(async (err)=>{
                      err.statusCode.should.eql(404);
                      const image = await Media.findOne({'key': key});
                      (image == null || image == undefined).should.be.true;
                    });
                  });
            });
      });
      it('Not owner (should fail)', async ()=>{
        const mToken = token;
        return agent.delete(`/api/users/${id1}/avatar`).set('Authorization', `Bearer ${mToken}`)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.NotOwnerError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.delete(`/api/users/${id0}/avatar`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('User does not exists (should fail)', async ()=>{
        const mToken = token;
        return agent.delete(`/api/users/somewrongthing/avatar`).set('Authorization', `Bearer ${mToken}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.UserNotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': user.username}, {'permissions': NARole._id}, {new: true});
        const id = id0;
        const mToken = token;
        return agent.delete(`/api/users/${id}/avatar`).set('Authorization', `Bearer ${mToken}`).then((res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Delete and check MongoDB and S3 to see if cleaned up', async ()=>{
        const id = id0;
        const mToken = token;
        const user = await User.findById({'_id': id}).populate('profile_photo', 'key').exec();
        const key = user.profile_photo.key;
        const image = await Media.findOne({'key': key});
        (image == null || image == undefined).should.be.false;
        return S3Services.fileExistsS3(key).then(async ()=>{
          return agent.delete(`/api/users/${id}/avatar`)
              .set('Authorization', `Bearer ${mToken}`)
              .attach('media', process.cwd()+'/test/resources/profile1.png', 'profile_photo')
              .then(async (res)=>{
                res.status.should.eql(200);
                res.body.message.should.eql(StaticStrings.RemoveProfilePhotoSuccess);
                return S3Services.fileExistsS3(key).catch(async (err)=>{
                  err.statusCode.should.eql(404);
                  const image = await Media.findOne({'key': key});
                  (image == null || image == undefined).should.be.true;
                });
              });
        });
      });
    });
  });
};

export default avatarTest;
