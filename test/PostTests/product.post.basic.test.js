/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import _ from 'lodash';
import fetch from 'node-fetch';
const fs = require('fs').promises;


import User from '../../server/models/user.model';
import Employee from '../../server/models/employee.model';
import RBAC from '../../server/models/rbac.model';
import Organization from '../../server/models/organization.model';
import Media from '../../server/models/media.model';
import Post from '../../server/models/post.model';
import ProductPost from '../../server/models/posts/product.post.model';


import {UserData} from '../../development/user.data';
import {PostData} from '../../development/post.data';
import {OrganizationData} from '../../development/organization.data';
import {ProductData, getProductConstructor} from '../../development/product.data';
import {EmployeeData, getEmployeeConstructor} from '../../development/employee.data';

import {dropDatabase, createUser, createEmployee, loginAdminEmployee, createOrg, createProductPostAgent} from '../helper';
import S3Services from '../../server/services/S3.services';
import StaticStrings from '../../config/StaticStrings';

chai.use(chaiHttp);
chai.should();

const image1 = process.cwd() + '/test/resources/profile1.png';
const image2 = process.cwd() + '/test/resources/profile2.jpg';
const textfile = process.cwd() + '/test/resources/profile3.txt';
const video = process.cwd() + '/test/resources/sample_vid.mp4';

const onSuccessToCreate = async (res, userId) => {
  res.status.should.eql(200);
  const numMedia = await Media.countDocuments({'uploadedBy': userId});
  numMedia.should.eql(1);
  const numPosts = await Post.countDocuments({'postedBy': userId});
  numPosts.should.eql(1);
  const media = await Media.find({'uploadedBy': userId});
  return S3Services.fileExistsS3(media[0].key);
};

const onSuccessToCleanup = async (key) => {
  const numMedia = await Media.countDocuments();
  numMedia.should.eql(0);
  const numPosts = await Post.countDocuments();
  numPosts.should.eql(0);
  return S3Services.fileExistsS3(key).catch((err)=>{
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

const productPostTestBasics = () => {
  describe('Product Post Test Basics', ()=>{
    describe('POST \'/api/posts\'', ()=>{
      let admin; let anyOrg; let product;
      const agent = chai.request.agent(app);
      let reqBody;
      beforeEach(async ()=>{
        await dropDatabase();
        admin = await loginAdminEmployee();
        anyOrg = await Organization.findOne();
        const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
        newProductData.organization = anyOrg._id.toString();
        product = await createProductPostAgent(agent, newProductData, admin.access_token).then((res)=>res.body);
        reqBody = {
          product: product._id,
          caption: newProductData.caption,
          tags: newProductData.tags,
        };
      });
      it('Create Product Post: Successfully create a product post and see if media matches in S3! (should succeed)', async ()=>{
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
          const postID = res.body._id;
          return agent.get(`/api/posts/${postID}?access_token=${admin.access_token}`).then(async (res)=>{
            res.status.should.eql(200);
          });
        });
      });
      it('Create Product Post: Insufficient permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'none'});
        await Employee.findByIdAndUpdate(admin.id, {'permissions': role._id});
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Product Post: Not logged in: (should fail)', async ()=>{
        return agent.post(`/api/posts?type=ProductPost`).send({'product': product._id}).then(async (res)=>{
          res.status.should.eql(401);
          res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Create Product Post: Incorrect query parameter \'type\' (not implemented) (should fail)', async ()=>{
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=NotImplememted`).send(reqBody).then(async (res)=>{
          res.status.should.eql(501);
          res.body.error.should.eql(StaticStrings.NotImplementedError);
        });
      });
      it('Create Product Post: Caption too long (should fail)', async ()=>{
        reqBody.caption = new Array(302).join('a');
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
        });
      });
      it('Create Product Post: Missing caption (should succceed)', async ()=>{
        delete reqBody.caption;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: Too many tags (should fail)', async ()=>{
        reqBody.tags = ['tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaximumNumberOfTags);
        });
      });
      it('Create Product Post: Tag field is too long (should fail)', async ()=>{
        reqBody.tags = ['taggggggggggggggggggggggggggggggggggg'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.MaxLengthTag);
        });
      });
      it('Create Product Post: Tag field cannot have anything besides letters (should fail)', async ()=>{
        reqBody.tags = ['tag1'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.eql(StaticStrings.PostModelErrors.TagMustBeAlphabetical);
        });
      });
      it('Create Product Post: Missing tags (should succceed)', async ()=>{
        delete reqBody.tags;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: \'product\' field missing (should fail)', async ()=>{
        delete reqBody.product;
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          res.body.error.should.include(StaticStrings.MissingRequiredField);
        });
      });
      it('Create Product Post: \'product\' not found (should fail)', async ()=>{
        reqBody.product = admin.id.toString();
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(404);
          res.body.error.should.eql(StaticStrings.ProductControllerErrors.NotFoundError);
        });
      });
      it('Create Product Post: \'product\' not a valid ID (should fail)', async ()=>{
        reqBody.product = 'an invalid ID';
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
        });
      });
      it('Create Product Post: Product model cleaned up when error in creating basic post model (should fail)', async ()=>{
        reqBody.tags = ['tags1'];
        return agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(400);
          const numProductPosts = await ProductPost.countDocuments();
          numProductPosts.should.eql(0);
        });
      });
      it('Create Product Post: Check if a user can create a product (should fail)', async ()=>{
        const user = await createUser(UserData[0]);
        return agent.post(`/api/posts?access_token=${user.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(403);
          res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
      it('Create Product Post: Check if a supervisor can create a product (should succeed)', async ()=>{
        const supervisor = await createEmployee(admin, getEmployeeConstructor(EmployeeData[0]));
        return agent.post(`/api/posts?access_token=${supervisor.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
      it('Create Product Post: Check if a employee can create a product (should succeed)', async ()=>{
        const employee = await createEmployee(admin, getEmployeeConstructor(EmployeeData[1]));
        return agent.post(`/api/posts?access_token=${employee.access_token}&type=ProductPost`).send(reqBody).then(async (res)=>{
          res.status.should.eql(200);
        });
      });
    });
    // describe('GET/DELETE \'/api/posts/:postId\'', ()=>{
    //   let userId0; let userId1; let userId2;
    //   const agent = chai.request.agent(app);
    //   let userToken0; let userToken1;
    //   before(async ()=>{
    //     await dropDatabase();
    //     let user = await createUser(UserData[0]);
    //     userId0 = user._id;
    //     userToken0 = user.access_token;
    //     user = await createUser(UserData[1]);
    //     userId1 = user._id;
    //     userToken1 = user.access_token;
    //     user = await createUser(UserData[2]);
    //     userId2 = user._id;
    //   });
    //   afterEach(async ()=>{
    //     const posts = await Post.find();
    //     for (const post of posts) {
    //       await post.deleteOne();
    //     }
    //   });
    //   it('Retrieve existing post (should succeed)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken0}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[2])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 return onSuccessToGetSinglePost(res, userId0);
    //               });
    //         });
    //   });
    //   it('Create two and retrieve second with first user (should succeed)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken0}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[0])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //               .attach('media', image1)
    //               .field(PostData[1])
    //               .then(async (res)=>{
    //                 const postId = res.body._id;
    //                 return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //                     .then((res)=>{
    //                       return onSuccessToGetSinglePost(res, userId1);
    //                     });
    //               });
    //         });
    //   });
    //   it('Permissions: Insufficient (should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken0}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           const postId = res.body._id;
    //           let role = await RBAC.findOne({'role': 'na'});
    //           await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then(async (res)=>{
    //                 res.status.should.eql(403);
    //                 role = await RBAC.findOne({'role': 'user'});
    //                 await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
    //               });
    //         });
    //   });
    //   it('Not logged in: (should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken0}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           const postId = res.body._id;
    //           return agent.get(`/api/posts/${postId}`)
    //               .then((res)=>{
    //                 res.status.should.eql(401);
    //               });
    //         });
    //   });
    //   it('Not found: (should fail)', async ()=>{
    //     return agent.get(`/api/posts/${userId2}?access_token=${userToken0}`)
    //         .then((res)=>{
    //           res.status.should.eql(404);
    //           res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
    //         });
    //   });
    //   it('Delete post (should succeed)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           const media = await Media.findOne({'uploadedBy': userId1});
    //           const key = media.key;
    //           return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 return onSuccessToCleanup(key);
    //               });
    //         });
    //   });
    //   it('Delete post twice (Second should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
    //                     .then((res)=>{
    //                       res.status.should.eql(404);
    //                       res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
    //                     });
    //               });
    //         });
    //   });
    //   it('Try to delete post you don\'t own: (Second should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           return agent.delete(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(403);
    //                 res.body.error.should.eql(StaticStrings.NotOwnerError);
    //               });
    //         });
    //   });
    //   it('Delete, not logged in: (Second should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           return agent.delete(`/api/posts/${postId}`)
    //               .then((res)=>{
    //                 res.status.should.eql(401);
    //               });
    //         });
    //   });
    //   it('Delete, bad permissions: (Second should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           const postId = res.body._id;
    //           let role = await RBAC.findOne({'role': 'na'});
    //           await User.findOneAndUpdate({'username': UserData[1].username}, {'permissions': role._id}, {new: true});
    //           return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
    //               .then(async (res)=>{
    //                 res.status.should.eql(403);
    //                 res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //                 role = await RBAC.findOne({'role': 'user'});
    //                 await User.findOneAndUpdate({'username': UserData[1].username}, {'permissions': role._id}, {new: true});
    //               });
    //         });
    //   });
    //   it('Delete, wrong ID: (Second should fail)', async ()=>{
    //     return agent.post(`/api/posts?access_token=${userToken1}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[1])
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.delete(`/api/posts/${userId2}?access_token=${userToken1}`)
    //               .then((res)=>{
    //                 res.status.should.eql(404);
    //                 res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
    //               });
    //         });
    //   });
    // });
    // describe('PUT \'/api/posts/:postId\'', ()=>{
    //   let userId0;
    //   const agent = chai.request.agent(app);
    //   let userToken0; let userToken1;
    //   let postId;
    //   beforeEach(async ()=>{
    //     await dropDatabase();
    //     let user = await createUser(UserData[0]);
    //     userId0 = user._id;
    //     userToken0 = user.access_token;
    //     user = await createUser(UserData[1]);
    //     userToken1 = user.access_token;
    //     user = await createUser(UserData[2]);
    //     await agent.post(`/api/posts?access_token=${userToken0}&type=ProductPost`)
    //         .attach('media', image1)
    //         .field(PostData[0])
    //         .then((res)=>{
    //           res.status.should.eql(200);
    //           postId = res.body._id;
    //         });
    //   });
    //   afterEach(async ()=>{
    //     const posts = await Post.find();
    //     for (const post of posts) {
    //       await post.deleteOne();
    //     }
    //   });
    //   it('Successfully edit caption and tags (should succeed)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'goodtag,anothertag,finaltag';
    //     const tagOut = ['goodtag', 'anothertag', 'finaltag'];
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 res.body.caption.should.eql(newCaption);
    //                 _.isEqual(res.body.tags, tagOut).should.be.true;
    //               });
    //         });
    //   });
    //   it('Empty new caption (should succeed and remove caption)', async ()=>{
    //     const newCaption = '';
    //     const newTags = 'goodtag,anothertag,finaltag';
    //     const tagOut = ['goodtag', 'anothertag', 'finaltag'];
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 res.body.caption.should.eql(newCaption);
    //                 _.isEqual(res.body.tags, tagOut).should.be.true;
    //               });
    //         });
    //   });
    //   it('Validation still works: very long caption (should fail)', async ()=>{
    //     const newCaption = new Array(302).join('a');
    //     const newTags = 'goodtag,anothertag,finaltag';
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(400);
    //           res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
    //         });
    //   });
    //   it('Empty tags (should succeed and remove tags)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = '';
    //     const tagOut = [];
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 res.body.caption.should.eql(newCaption);
    //                 _.isEqual(res.body.tags, tagOut).should.be.true;
    //               });
    //         });
    //   });
    //   it('Tags have additional, unneeded comma (should succeed and ignore that tag)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,';
    //     const tagOut = ['a', 'b'];
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 res.body.caption.should.eql(newCaption);
    //                 _.isEqual(res.body.tags, tagOut).should.be.true;
    //               });
    //         });
    //   });
    //   it('One tag is all spaces (should succeed and ignore that tag)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,   ';
    //     const tagOut = ['a', 'b'];
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(200);
    //           return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
    //               .then((res)=>{
    //                 res.status.should.eql(200);
    //                 res.body.caption.should.eql(newCaption);
    //                 _.isEqual(res.body.tags, tagOut).should.be.true;
    //               });
    //         });
    //   });
    //   it('Tags are not alphabetic (should fail)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,a1';
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(400);
    //         });
    //   });
    //   it('Not owner: (should fail)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,c';
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken1}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(403);
    //         });
    //   });
    //   it('Not logged in: (should fail)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,c';
    //     return agent.put(`/api/posts/${postId}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(401);
    //           res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
    //         });
    //   });
    //   it('Insufficient permissions: (should fail)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,c';
    //     let role = await RBAC.findOne({'role': 'na'});
    //     await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
    //     return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(403);
    //           res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //           role = await RBAC.findOne({'role': 'user'});
    //           await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
    //         });
    //   });
    //   it('Wrong post id: (should fail w/ 404)', async ()=>{
    //     const newCaption = 'new caption';
    //     const newTags = 'a,b,c';
    //     return agent.put(`/api/posts/${userId0}?access_token=${userToken0}`)
    //         .send({tags: newTags, caption: newCaption})
    //         .then(async (res)=>{
    //           res.status.should.eql(404);
    //         });
    //   });
    // });
  });
};

export default productPostTestBasics;
