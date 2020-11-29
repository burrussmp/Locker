/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import Media from '../../server/models/media.model';
import User from '../../server/models/user.model';
import StaticStrings from '../../config/StaticStrings';
const fs = require('fs').promises;
import S3Services from '../../server/services/S3.services';
import fetch from 'node-fetch';
import {dropDatabase, bufferEquality, createUser} from '../helper';

chai.use(chaiHttp);
chai.should();

const image1 = process.cwd() + '/test/resources/profile1.png';

const mediaTestBasics = () => {
  describe('Media test basics', () => {
    describe('GET avatar basics (testing size query parameter) and using /api/users/:userID/avatar', () => {
      let userId0; let Key;
      const agent = chai.request.agent(app);
      let userToken0;
      before(async () => {
        try {
          await dropDatabase();
          const cursor = Media.find().cursor();
          for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            await doc.deleteOne();
          }
          const user = await createUser(UserData[0]);
          userId0 = user._id;
          userToken0 = user.access_token;
          await agent
              .post(`/api/users/${userId0}/avatar?access_token=${userToken0}`)
              .attach('media', image1);

          const userDoc = await User.findById(userId0).populate('profile_photo').exec();
          Key = userDoc.profile_photo.key;
        } catch (err) {
          console.log(err);
        }
      });
      after(async () => {
        await dropDatabase();
        const cursor = Media.find().cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
          await doc.deleteOne();
        }
      });
      it('GET profile photo', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}`,
        )
            .then((res) => res.blob())
            .then(async (res) => {
              const buffer = await res.arrayBuffer();
              return fs.readFile(image1).then((data) => {
                bufferEquality(data, buffer).should.be.true;
              });
            });
      });
      it('Adjust the size of the profile to small for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=small`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(1);
          const resizedMedia = media.resized_keys[0];
          await S3Services.fileExistsS3(Key);
          await S3Services.fileExistsS3(resizedMedia);
        });
      });
      it('Adjust the size of the profile to medium for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=medium`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(2);
        });
      });
      it('Adjust the size of the profile to large for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=large`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(3);
        });
      });
      it('Adjust the size of the profile to xlarge for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=xlarge`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
        });
      });
      it('Query parameter \'media_type\' should have no affect for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=xlarge&media_type=ContentType`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
          const listS3 = await S3Services.listObjectsS3();
          listS3.Contents.length.should.eql(5);
        });
      });
      it('Update profile (should remove all in S3 but one i.e. one we just updated) for /api/users/:userId/avatar', async () => {
        await agent
            .post(`/api/users/${userId0}/avatar?access_token=${userToken0}`)
            .attach('media', image1);
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const listS3 = await S3Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
          const medias = await Media.find();
          medias.length.should.eql(1);
          Key = medias[0].key;
        });
      });
      it('Incorrect query parameter \'size\' should fail for /api/users/:userId/avatar', async () => {
        return fetch(
            `http://localhost:3000/api/users/${userId0}/avatar?access_token=${userToken0}&size=BAD`,
        ).then(async (res) => {
          res.status.should.eql(400);
          const body = await res.json();
          body.error.should.eql(
              StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid,
          );
        });
      });
      it('Incorrect query parameter \'size\' should fail for /api/media/', async () => {
        return fetch(
            `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=BAD`,
        ).then(async (res) => {
          res.status.should.eql(400);
          const body = await res.json();
          body.error.should.eql(
              StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid,
          );
          const listS3 = await S3Services.listObjectsS3();
          listS3.Contents.length.should.eql(1);
        });
      });
      it('Adjust the size of the profile to small for /api/media/', async () => {
        return fetch(
            `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(1);
          const resizedMedia = media.resized_keys[0];
          await S3Services.fileExistsS3(Key);
          await S3Services.fileExistsS3(resizedMedia);
        });
      });
      it('Adjust the size of the profile to medium for /api/media/', async () => {
        return fetch(
            `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=medium`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(2);
        });
      });
      it('Adjust the size of the profile to large for /api/media/', async () => {
        return fetch(
            `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=large`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(3);
        });
      });
      it('Adjust the size of the profile to xlarge for /api/media/', async () => {
        return fetch(
            `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=xlarge`,
        ).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
        });
      });
    });
    // describe('GET Content Post media', () => {
    //   let Key; let Key2;
    //   const agent = chai.request.agent(app);
    //   let userToken0;
    //   before(async () => {
    //     await dropDatabase();
    //     const user = await createUser(UserData[0]);
    //     userToken0 = user.access_token;
    //     await agent
    //         .post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
    //         .attach('media', image1)
    //         .field(PostData[0])
    //         .then(async (res) => {
    //           await agent
    //               .get(`/api/posts/${res.body._id}?access_token=${userToken0}`)
    //               .then((res) => {
    //                 Key = res.body.content.media.key;
    //               });
    //         });
    //     await agent
    //         .post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
    //         .attach('media', video)
    //         .field(PostData[0])
    //         .then(async (res) => {
    //           await agent
    //               .get(`/api/posts/${res.body._id}?access_token=${userToken0}`)
    //               .then((res) => {
    //                 Key2 = res.body.content.media.key;
    //               });
    //         });
    //   });
    //   after(async () => {
    //     await dropDatabase();
    //   });
    //   it('See if you can get an image w/out any query parameters (should be fine)', async () => {
    //     return fetch(
    //         `http://localhost:3000/api/media/${Key}?access_token=${userToken0}`,
    //     ).then(async (res) => {
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('See if you can get a video w/out any query parameters (should be fine)', async () => {
    //     return fetch(
    //         `http://localhost:3000/api/media/${Key2}?access_token=${userToken0}`,
    //     ).then(async (res) => {
    //       res.status.should.eql(200);
    //     });
    //   });
    //   it('Try to resize a non-image (should fail)', async () => {
    //     return fetch(
    //         `http://localhost:3000/api/media/${Key2}?access_token=${userToken0}&size=small`,
    //     ).then(async (res) => {
    //       res.status.should.eql(400);
    //       const body = await res.json();
    //       body.error.should.eql(
    //           StaticStrings.MediaControllerErrors.CannotResizeNotImage,
    //       );
    //       const listS3 = await S3Services.listObjectsS3();
    //       listS3.Contents.length.should.eql(2);
    //     });
    //   });
    //   it('Try to resize an image (should be fine)', async () => {
    //     return fetch(
    //         `http://localhost:3000/api/media/${Key}?access_token=${userToken0}&size=small`,
    //     ).then(async (res) => {
    //       res.status.should.eql(200);
    //       const listS3 = await S3Services.listObjectsS3();
    //       listS3.Contents.length.should.eql(3);
    //     });
    //   });
    // });
  });
};

export default mediaTestBasics;
