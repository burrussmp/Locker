/* eslint-disable max-len */
const fs = require('fs').promises;
import chai from 'chai';
import chaiHttp from 'chai-http';
import fetch from 'node-fetch';
import {app} from '@server/server';

import Media from '@server/models/media.model';
import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';

import S3Services from '@server/services/S3.services';
import StaticStrings from '@config/StaticStrings';


import {UserData} from '@development/user.data';
import {ProductData} from '@development/product.data';

import {bufferEquality, dropDatabase, createUser, loginAdminEmployee, createProductPostAgent} from '@test/helper';


chai.use(chaiHttp);
chai.should();

const image1 = process.cwd() + '/test/resources/profile1.png';

const mediaTestBasics = () => {
  describe('Media test basics', () => {
    describe('GET avatar basics (testing size query parameter) and using /api/users/:userID/avatar', () => {
      let user; let Key;
      const agent = chai.request.agent(app);
      before(async () => {
        try {
          await dropDatabase();
          user = await createUser(UserData[0]);
          await agent.post(`/api/users/${user._id}/avatar?access_token=${user.access_token}`).attach('media', image1);

          const userDoc = await User.findById(user._id).populate('profile_photo').exec();
          Key = userDoc.profile_photo.key;
        } catch (err) {
          console.log(err);
        }
      });
      after(async () => {
        await dropDatabase();
      });
      it('GET profile photo', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}`).then((res) => res.blob()).then(async (res) => {
          const buffer = await res.arrayBuffer();
          return fs.readFile(image1).then((data) => {
            bufferEquality(data, buffer).should.be.true;
          });
        });
      });
      it('Adjust the size of the profile to small for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=small`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(1);
          const resizedMedia = media.resized_keys[0];
          await S3Services.fileExistsS3(Key);
          await S3Services.fileExistsS3(resizedMedia);
        });
      });
      it('Adjust the size of the profile to medium for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=medium`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(2);
        });
      });
      it('Adjust the size of the profile to large for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=large`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(3);
        });
      });
      it('Adjust the size of the profile to xlarge for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=xlarge`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
        });
      });
      it('Query parameter \'media_type\' should have no affect for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=xlarge&media_type=ContentType`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
        });
      });
      it('Update profile (should remove all in S3 but one i.e. one we just updated) for /api/users/:userId/avatar', async () => {
        await agent.post(`/api/users/${user._id}/avatar?access_token=${user.access_token}`).attach('media', image1);
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({uploadedBy: user._id});
          Key = media.key;
        });
      });
      it('Incorrect query parameter \'size\' should fail for /api/users/:userId/avatar', async () => {
        return fetch(`http://localhost:3000/api/users/${user._id}/avatar?access_token=${user.access_token}&size=BAD`).then(async (res) => {
          res.status.should.eql(400);
          const body = await res.json();
          body.error.should.eql(StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(0);
        });
      });
      it('Incorrect query parameter \'size\' should fail for /api/media/', async () => {
        return fetch(`http://localhost:3000/api/media/${Key}?access_token=${user.access_token}&size=BAD`).then(async (res) => {
          res.status.should.eql(400);
          const body = await res.json();
          body.error.should.eql(StaticStrings.MediaControllerErrors.SizeQueryParameterInvalid);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(0);
        });
      });
      it('Adjust the size of the profile to small for /api/media/', async () => {
        return fetch(`http://localhost:3000/api/media/${Key}?access_token=${user.access_token}&size=small`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(1);
          const resizedMedia = media.resized_keys[0];
          await S3Services.fileExistsS3(Key);
          await S3Services.fileExistsS3(resizedMedia);
        });
      });
      it('Adjust the size of the profile to medium for /api/media/', async () => {
        return fetch(`http://localhost:3000/api/media/${Key}?access_token=${user.access_token}&size=medium`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(2);
        });
      });
      it('Adjust the size of the profile to large for /api/media/', async () => {
        return fetch(`http://localhost:3000/api/media/${Key}?access_token=${user.access_token}&size=large`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(3);
        });
      });
      it('Adjust the size of the profile to xlarge for /api/media/', async () => {
        return fetch(`http://localhost:3000/api/media/${Key}?access_token=${user.access_token}&size=xlarge`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: Key});
          media.resized_keys.length.should.eql(4);
        });
      });
    });
    describe('GET Product Post media', () => {
      const agent = chai.request.agent(app);
      let admin; let imageKey; let videoKey;
      beforeEach(async () => {
        await dropDatabase();
        admin = await loginAdminEmployee();
        const anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[1]));
        newProductData.organization = anyOrg._id.toString();
        const product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        const reqBody = {product: product._id};
        const post = await agent.post(`/api/posts?access_token=${admin.access_token}&type=Product`).send(reqBody).then((res)=>res.body);
        const postDetails = await agent.get(`/api/posts/${post._id}?access_token=${admin.access_token}`).then((res)=>res.body);
        imageKey = postDetails.content.product.media.key;
        videoKey = postDetails.content.product.additional_media[1].key;
      });
      after(async () => {
        await dropDatabase();
      });
      it('See if you can get an image w/out any query parameters (should be fine)', async () => {
        return fetch(`http://localhost:3000/api/media/${imageKey}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('See if you can get a video w/out any query parameters (should be fine)', async () => {
        return fetch(`http://localhost:3000/api/media/${videoKey}?access_token=${admin.access_token}`).then(async (res) => {
          res.status.should.eql(200);
        });
      });
      it('Try to resize a non-image (should fail)', async () => {
        return fetch(`http://localhost:3000/api/media/${videoKey}?access_token=${admin.access_token}&size=small`).then(async (res) => {
          res.status.should.eql(400);
          const body = await res.json();
          body.error.should.eql(StaticStrings.MediaControllerErrors.CannotResizeNotImage);
          const media = await Media.findOne({key: videoKey});
          media.resized_keys.length.should.eql(0);
        });
      });
      it('Try to resize an image (should be fine)', async () => {
        return fetch(`http://localhost:3000/api/media/${imageKey}?access_token=${admin.access_token}&size=small`).then(async (res) => {
          res.status.should.eql(200);
          const media = await Media.findOne({key: imageKey});
          media.resized_keys.length.should.eql(1);
          return S3Services.fileExistsS3(media.resized_keys[0]);
        });
      });
      it('Try to resize an image where media type is not supported (should be fine)', async () => {
        await Media.findOneAndUpdate({key: imageKey}, {type: '404'});
        return fetch(`http://localhost:3000/api/media/${imageKey}?access_token=${admin.access_token}&size=small`).then(async (res) => {
          res.status.should.eql(422);
          const body = await res.json();
          body.error.should.eql(StaticStrings.MediaControllerErrors.MediaTypeNotImplementedResize);
        });
      });
    });
  });
};

export default mediaTestBasics;
