/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData} from '../../development/post.data';
import User from '../../server/models/user.model';
import RBAC from '../../server/models/rbac.model';
import Media from '../../server/models/media.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';
const fs = require('fs').promises;
import s3Services from '../../server/services/S3.services';
import fetch from 'node-fetch';
import {dropDatabase, bufferEquality, createUser} from '../helper';
import _ from 'lodash';

chai.use(chaiHttp);
chai.should();

const image1 = process.cwd() + '/test/resources/profile1.png';
const image2 = process.cwd() + '/test/resources/profile2.jpg';
const textfile = process.cwd() + '/test/resources/profile3.txt';
const video = process.cwd() + '/test/resources/sample_vid.mp4';


const onFailureToCreate = async (res, statusCode, errorMessage) => {
  res.body.error.should.include(errorMessage);
  res.status.should.eql(statusCode);
  const numMedia = await Media.countDocuments();
  numMedia.should.eql(0);
  const numPosts = await Post.countDocuments();
  numPosts.should.eql(0);
};


const onSuccessToCreate = async (res, userId) => {
  res.status.should.eql(200);
  const numMedia = await Media.countDocuments({'uploadedBy': userId});
  numMedia.should.eql(1);
  const numPosts = await Post.countDocuments({'postedBy': userId});
  numPosts.should.eql(1);
  const media = await Media.find({'uploadedBy': userId});
  return s3Services.fileExistsS3(media[0].key);
};

const onSuccessToCleanup = async (key) => {
  const numMedia = await Media.countDocuments();
  numMedia.should.eql(0);
  const numPosts = await Post.countDocuments();
  numPosts.should.eql(0);
  return s3Services.fileExistsS3(key).catch((err)=>{
    err.statusCode.should.eql(404);
  });
};

const onSuccessToGetSinglePost = async (res, userID) => {
  res.status.should.eql(200);
  res.body.should.have.property('_id');
  res.body.should.have.property('caption');
  res.body.should.have.property('tags');
  res.body.should.have.property('type');
  res.body.should.have.property('content');
  res.body.should.have.property('postedBy');
  res.body.should.have.property('createdAt');
  res.body.should.have.property('updatedAt');
};

const contentPostTestBasics = () => {
  describe('Content Post Test Basics', ()=>{
    describe('POST/GET \'/api/posts\'', ()=>{
      let userId0; let userId1;
      const agent = chai.request.agent(app);
      let userToken0; let userToken1;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        user = await createUser(UserData[1]);
        userId1 = user._id;
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
      });
      afterEach(async ()=>{
        const posts = await Post.find();
        for (const post of posts) {
          await post.deleteOne();
        }
      });
      it('Create a content post and see if media matches in S3! (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then(async (res)=>{
              await onSuccessToCreate(res, userId0);
              const postID = res.body._id;
              return agent.get(`/api/posts/${postID}?access_token=${userToken0}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    const key = res.body.content.media.key;
                    return fetch(`http://localhost:3000/api/media/${key}?access_token=${userToken0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          return res.blob();
                        })
                        .then(async (res)=>{
                          const buffer = await res.arrayBuffer();
                          return fs.readFile(image1).then((data)=>{
                            bufferEquality(data, buffer).should.be.true;
                          });
                        });
                  });
            });
      });
      it('Permissions: Insufficient (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        let role = await RBAC.findOne({'role': 'na'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 403, StaticStrings.InsufficientPermissionsError);
              role = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
            });
      });
      it('Not logged in: (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        return agent.post(`/api/posts?type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 401, StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Query: Incorrect type (not implemented) (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        return agent.post(`/api/posts?access_token=${userToken0}&type=NotImplememted`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 501, StaticStrings.NotImplementedError);
            });
      });
      it('Price field: Less than zero (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.price = -0.1;
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.PriceNotNonnegative);
            });
      });
      it('Price field (Missing): (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        delete postData['price'];
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.ContentPostErrors.PriceRequired);
            });
      });
      it('Price field: zero (should be fine)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.price = 0.0;
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onSuccessToCreate(res, userId0);
            });
      });
      it('Caption field: Too long (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.caption = new Array(302).join('a');
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.MaxCaptionSizeError);
            });
      });
      it('Caption field: Too long (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.caption = new Array(302).join('a');
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.MaxCaptionSizeError);
            });
      });
      it('Media field: Incorrect field name (not \'media\') (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('Something', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.S3ServiceErrors.BadRequestWrongKey);
            });
      });
      it('Media field: Wrong type of file (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', textfile)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 422, StaticStrings.S3ServiceErrors.InvalidMediaMimeType);
            });
      });
      it('Media field: No file (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media')
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.S3ServiceErrors.BadRequestMissingFile);
            });
      });
      it('Tag field: Too many tags (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.tags = 'tag,tag,tag,tag,tag,tag,tag,tag';
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.MaximumNumberOfTags);
            });
      });
      it('Tag field: A tag is too long (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.tags = 'taggggggggggggggggggggggggggggggggggg';
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.MaxLengthTag);
            });
      });
      it('Tag field: Cannot have anything besides letters (should fail)', async ()=>{
        const postData = JSON.parse(JSON.stringify(PostData[0]));
        postData.tags = 'tag1,tag2';
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(postData)
            .then(async (res)=>{
              await onFailureToCreate(res, 400, StaticStrings.PostModelErrors.TagMustBeAlphabetical);
            });
      });
      it('Create a content post with a video (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', video)
            .field(PostData[0])
            .then(async (res)=>{
              await onSuccessToCreate(res, userId0);
              const postID = res.body._id;
              return agent.get(`/api/posts?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.length.should.eql(1);
                    res.body[0]._id.should.eql(postID);
                  });
            });
      });
      it('Create two posts with different users (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then(async (res)=>{
              return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                  .attach('media', image2)
                  .field(PostData[0])
                  .then(async (res)=>{
                    return agent.get(`/api/posts?access_token=${userToken0}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.length.should.eql(2);
                        });
                  });
            });
      });
      it('Clean up: User is deleted and so is media', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', video)
            .field(PostData[0])
            .then(async (res)=>{
              const media = await Media.findOne({'uploadedBy': userId0});
              const key = media.key;
              return agent.delete(`/api/users/${userId0}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    return onSuccessToCleanup(key);
                  });
            });
      });
      it('Clean up: Post is deleted and media is cleaned up', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', video)
            .field(PostData[0])
            .then(async (res)=>{
              const media = await Media.findOne({'uploadedBy': userId1});
              const key = media.key;
              return agent.delete(`/api/users/${userId1}?access_token=${userToken1}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    return onSuccessToCleanup(key);
                  });
            });
      });
    });
    describe('GET/DELETE \'/api/posts/:postId\'', ()=>{
      let userId0; let userId1; let userId2;
      const agent = chai.request.agent(app);
      let userToken0; let userToken1;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        user = await createUser(UserData[1]);
        userId1 = user._id;
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userId2 = user._id;
      });
      afterEach(async ()=>{
        const posts = await Post.find();
        for (const post of posts) {
          await post.deleteOne();
        }
      });
      it('Retrieve existing post (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[2])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    return onSuccessToGetSinglePost(res, userId0);
                  });
            });
      });
      it('Create two and retrieve second with first user (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                  .attach('media', image1)
                  .field(PostData[1])
                  .then(async (res)=>{
                    const postId = res.body._id;
                    return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                        .then((res)=>{
                          return onSuccessToGetSinglePost(res, userId1);
                        });
                  });
            });
      });
      it('Permissions: Insufficient (should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              const postId = res.body._id;
              let role = await RBAC.findOne({'role': 'na'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    role = await RBAC.findOne({'role': 'user'});
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
                  });
            });
      });
      it('Not logged in: (should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              const postId = res.body._id;
              return agent.get(`/api/posts/${postId}`)
                  .then((res)=>{
                    res.status.should.eql(401);
                  });
            });
      });
      it('Not found: (should fail)', async ()=>{
        return agent.get(`/api/posts/${userId2}?access_token=${userToken0}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
            });
      });
      it('Delete post (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              const media = await Media.findOne({'uploadedBy': userId1});
              const key = media.key;
              return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    return onSuccessToCleanup(key);
                  });
            });
      });
      it('Delete post twice (Second should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                        .then((res)=>{
                          res.status.should.eql(404);
                          res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
                        });
                  });
            });
      });
      it('Try to delete post you don\'t own: (Second should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              return agent.delete(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.NotOwnerError);
                  });
            });
      });
      it('Delete, not logged in: (Second should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              return agent.delete(`/api/posts/${postId}`)
                  .then((res)=>{
                    res.status.should.eql(401);
                  });
            });
      });
      it('Delete, bad permissions: (Second should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              const postId = res.body._id;
              let role = await RBAC.findOne({'role': 'na'});
              await User.findOneAndUpdate({'username': UserData[1].username}, {'permissions': role._id}, {new: true});
              return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    role = await RBAC.findOne({'role': 'user'});
                    await User.findOneAndUpdate({'username': UserData[1].username}, {'permissions': role._id}, {new: true});
                  });
            });
      });
      it('Delete, wrong ID: (Second should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[1])
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/posts/${userId2}?access_token=${userToken1}`)
                  .then((res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
                  });
            });
      });
    });
    describe('PUT \'/api/posts/:postId\'', ()=>{
      let userId0;
      const agent = chai.request.agent(app);
      let userToken0; let userToken1;
      let postId;
      beforeEach(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        userToken0 = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        await agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              postId = res.body._id;
            });
      });
      afterEach(async ()=>{
        const posts = await Post.find();
        for (const post of posts) {
          await post.deleteOne();
        }
      });
      it('Successfully edit caption and tags (should succeed)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'goodtag,anothertag,finaltag';
        const tagOut = ['goodtag', 'anothertag', 'finaltag'];
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.caption.should.eql(newCaption);
                    _.isEqual(res.body.tags, tagOut).should.be.true;
                  });
            });
      });
      it('Empty new caption (should succeed and remove caption)', async ()=>{
        const newCaption = '';
        const newTags = 'goodtag,anothertag,finaltag';
        const tagOut = ['goodtag', 'anothertag', 'finaltag'];
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.caption.should.eql(newCaption);
                    _.isEqual(res.body.tags, tagOut).should.be.true;
                  });
            });
      });
      it('Validation still works: very long caption (should fail)', async ()=>{
        const newCaption = new Array(302).join('a');
        const newTags = 'goodtag,anothertag,finaltag';
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
            });
      });
      it('Empty tags (should succeed and remove tags)', async ()=>{
        const newCaption = 'new caption';
        const newTags = '';
        const tagOut = [];
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.caption.should.eql(newCaption);
                    _.isEqual(res.body.tags, tagOut).should.be.true;
                  });
            });
      });
      it('Tags have additional, unneeded comma (should succeed and ignore that tag)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,';
        const tagOut = ['a', 'b'];
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.caption.should.eql(newCaption);
                    _.isEqual(res.body.tags, tagOut).should.be.true;
                  });
            });
      });
      it('One tag is all spaces (should succeed and ignore that tag)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,   ';
        const tagOut = ['a', 'b'];
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body.caption.should.eql(newCaption);
                    _.isEqual(res.body.tags, tagOut).should.be.true;
                  });
            });
      });
      it('Tags are not alphabetic (should fail)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,a1';
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(400);
            });
      });
      it('Not owner: (should fail)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,c';
        return agent.put(`/api/posts/${postId}?access_token=${userToken1}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(403);
            });
      });
      it('Not logged in: (should fail)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,c';
        return agent.put(`/api/posts/${postId}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Insufficient permissions: (should fail)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,c';
        let role = await RBAC.findOne({'role': 'na'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
        return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              role = await RBAC.findOne({'role': 'user'});
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
            });
      });
      it('Wrong post id: (should fail w/ 404)', async ()=>{
        const newCaption = 'new caption';
        const newTags = 'a,b,c';
        return agent.put(`/api/posts/${userId0}?access_token=${userToken0}`)
            .send({tags: newTags, caption: newCaption})
            .then(async (res)=>{
              res.status.should.eql(404);
            });
      });
    });
  });
};

export default contentPostTestBasics;
