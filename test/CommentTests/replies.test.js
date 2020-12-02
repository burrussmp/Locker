/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '@server/server';
import {CommentData} from '@development/comments.data';
import {UserData} from '@development/user.data';
import {dropDatabase, createUser} from '@test/helper';
import User from '@server/models/user.model';
import Comment from '@server/models/comment.model';
import StaticStrings from '@config/StaticStrings';
import {PostData} from '@development/post.data';
import permissions from '@server/permissions';

const image1 = process.cwd() + '/test/resources/profile1.png';

chai.use(chaiHttp);
chai.should();

const replyTest = () => {
  describe('Replies Test', ()=>{
    describe('GET \'/api/:commentId/replies\'', ()=>{
      let commentIDArray;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              console.log(res.body.error);
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: 'new text',
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('See if all replies are of the proper length', async ()=>{
        return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.length.should.eql(0);
              return agent.get(`/api/${commentIDArray[1]}/replies?access_token=${userToken1}`)
                  .then((res)=>{
                    res.status.should.eql(200);
                    res.body[0].should.have.property('text'); // the required
                    res.body[0].should.have.property('postedBy'); // the required
                    res.body[0].should.have.property('createdAt'); // the required
                    res.body[1].likes.should.eql(6);
                    res.body.length.should.eql(2);
                    return agent.get(`/api/${commentIDArray[2]}/replies?access_token=${userToken1}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.length.should.eql(4);
                        });
                  });
            });
      });
      it('If the comment doesn\'t exist, should get 404', async ()=>{
        return agent.get(`/api/mwahah/replies?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.get(`/api/${commentIDArray[1]}/replies`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Missing privileges', async ()=>{
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': []}, {new: true});
        return agent.get(`/api/${commentIDArray[1]}/replies?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
    });
    describe('POST \'/api/:commentId/replies\'', ()=>{
      let commentIDArray;
      let userId0;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: `Original reply ${i}`,
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      const newReply = 'This is a new reply';
      it('Correctly posts reply', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: newReply})
            .then((res)=>{
              res.status.should.eql(200);
              res.body.should.have.property('_id');
              return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${userToken1}`)
                  .then(async (res)=>{
                    const replyIndex = 0;
                    res.body.length.should.eql(1);
                    res.body[replyIndex].postedBy.should.eql(userId0);
                    res.body[replyIndex].text.should.eql(newReply);
                    res.body[replyIndex].likes.should.eql(replyIndex);
                    const id = res.body[replyIndex]._id;
                    return agent.delete(`/api/${commentIDArray[0]}/replies/${id}?access_token=${admin.access_token}`).then((res)=>{
                      res.status.should.eql(200);
                    });
                  });
            });
      });
      it('Extra field (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: newReply, dumb_field: 'hello'})
            .then((res)=>{
              res.status.should.eql(200);
              res.body.should.have.property('_id');
              return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${userToken1}`)
                  .then((res)=>{
                    const replyIndex = 0;
                    res.body.length.should.eql(1);
                    res.body[replyIndex].postedBy.should.eql(userId0);
                    res.body[replyIndex].text.should.eql(newReply);
                    res.body[replyIndex].likes.should.eql(0);
                    const id = res.body[replyIndex]._id;
                    return agent.delete(`/api/${commentIDArray[0]}/replies/${id}?access_token=${admin.access_token}`).then((res)=>{
                      res.status.should.eql(200);
                    });
                  });
            });
      });
      it('Missing text field (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({dumb_field: 'hello'})
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired);
              return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${userToken1}`)
                  .then((res)=>{
                    res.body.length.should.eql(0);
                  });
            });
      });
      it('Empty text field (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: ''})
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired);
              return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${userToken1}`)
                  .then((res)=>{
                    res.body.length.should.eql(0);
                  });
            });
      });
      it('Text field all spaces(should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: '  '})
            .then((res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired);
              return agent.get(`/api/${commentIDArray[0]}/replies?access_token=${userToken1}`)
                  .then((res)=>{
                    res.body.length.should.eql(0);
                  });
            });
      });
      it('If the comment doesn\'t exist, should get 404', async ()=>{
        return agent.post(`/api/mwahah/replies?access_token=${admin.access_token}`)
            .send({text: newReply})
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[1]}/replies`)
            .send({text: newReply})
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Missing privileges', async ()=>{
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': []}, {new: true});
        return agent.post(`/api/${commentIDArray[1]}/replies?access_token=${admin.access_token}`)
            .send({text: newReply})
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
            });
      });
    });
    describe('PUT/DELETE \'/api/:commentId/likes\'', ()=>{
      let commentIDArray;
      let userId0;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        userId0 = user._id;
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: `Original reply ${i}`,
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Like a comment twice (should succeed and only place 1 like)', async ()=>{
        return agent.put(`/api/${commentIDArray[0]}/likes?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
              return agent.put(`/api/${commentIDArray[0]}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.LikedCommentSuccess);
                    const comment = await Comment.findById(commentIDArray[0]);
                    comment.likes.length.should.eql(1);
                    comment.likes[0].toString().should.eql(userId0);
                  });
            });
      });
      it('Unlike a comment first (should do nothing)', async ()=>{
        return agent.delete(`/api/${commentIDArray[0]}/likes?access_token=${admin.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(200);
              res.body.message.should.eql(StaticStrings.UnlikedCommentSuccess);
              const comment = await Comment.findById(commentIDArray[0]);
              comment.likes.length.should.eql(0);
            });
      });
      it('Like a comment, then unlike the comment', async ()=>{
        return agent.put(`/api/${commentIDArray[0]}/likes?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/${commentIDArray[0]}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.UnlikedCommentSuccess);
                    const comment = await Comment.findById(commentIDArray[0]);
                    comment.likes.length.should.eql(0);
                  });
            });
      });
      it('If the comment doesn\'t exist, should get 404', async ()=>{
        return agent.put(`/api/mwahah/likes?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
              return agent.delete(`/api/mwahah/likes?access_token=${admin.access_token}`)
                  .then((res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.put(`/api/${commentIDArray[1]}/likes`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
              return agent.delete(`/api/${commentIDArray[1]}/likes`)
                  .then((res)=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                  });
            });
      });
      it('Missing privileges', async ()=>{
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': ['post:edit_content']}, {new: true});
        return agent.delete(`/api/${commentIDArray[1]}/likes?access_token=${admin.access_token}`)
            .then((res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
              return agent.put(`/api/${commentIDArray[1]}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
                  });
            });
      });
    });
    describe('GET \'/api/:commentId/replies/:replyId\'', ()=>{
      let commentIDArray;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: `Original reply ${i}`,
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Get a specific reply (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body.text.should.eql('What a reply!');
                  });
            });
      });
      it('Reply doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              return agent.get(`/api/${commentIDArray[0]}/replies/${'4314739849'}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
                  });
            });
      });
      it('Comment doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.get(`/api/${'jflksjflkdsjf'}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}`)
                  .then(async (res)=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                  });
            });
      });
      it('Missing privileges', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': ['post:edit_content']}, {new: true});
              return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
                  });
            });
      });
    });
    /**
         * * Purposefully commented out. This API no longer exists
         */
    // describe("PUT '/api/:commentId/replies/:replyId'",()=>{
    //     let commentIDArray;
    //     let userId0,userId1,userId2;
    //     let agent = chai.request.agent(app);
    //     let admin.access_token,userToken1;
    //     beforeEach(async()=>{
    //         await dropDatabase();
    //         await Setup();
    //         let numComments = await Comment.countDocuments();
    //         numComments.should.eql(UserData.length);
    //         commentIDArray = await Comment.find().select('_id').distinct('_id');
    //         let userIDArray = await User.find().select('_id').distinct('_id');
    //         // add some replies
    //         for (let i = 0; i < numComments; i++){
    //             for (let j = 0; j<i*2; j++){
    //             let likeArray = [];
    //                 for (let k = 0; k < (i+5)*j;k++){
    //                     likeArray.push(userIDArray[(j+1)%numComments]);
    //                 }
    //             await Comment.findOneAndUpdate(
    //                 {'_id':commentIDArray[i]},{$push: { replies:{
    //                     text: "new text",
    //                     postedBy: userIDArray[j%numComments],
    //                     likes: likeArray
    //                     }
    //                 }
    //                 },{runValidators:true,new:true});
    //             }
    //         }
    //         for (let i = 0; i < numComments; i++){
    //             let  comment = await Comment.findById({'_id':commentIDArray[i]});
    //             comment.replies.length.should.eql(i*2)
    //         }
    //         await agent.get('/api/users').then(res=>{
    //             res.body.length.should.eql(3);
    //             res.body[0].username.should.eql(UserData[0].username)
    //             userId0 = res.body[0]._id;
    //             userId1 = res.body[1]._id;
    //             userId2 = res.body[2]._id
    //         });
    //         await agent.post('/auth/login').send({
    //             login: UserData[0].email,
    //             password: UserData[0].password
    //         }).then((res) => {
    //             admin.access_token = res.body.access_token;
    //         });
    //         await agent.post('/auth/login').send({
    //             login: UserData[1].email,
    //             password: UserData[1].password
    //         }).then((res) => {
    //             userToken1 = res.body.access_token;
    //         });
    //     });
    //     it("Edit a reply (should succeed)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"What a reply!"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({text:"This should change!"})
    //             .then(async res=>{
    //                 res.status.should.eql(200);
    //                 res.body.text.should.eql("This should change!");
    //                 res.body.should.have.property('_id')
    //             });
    //         });
    //     })
    //     it("Try to edit reply of comment you own but didn't write the reply (should fail)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"What a reply!"})
    //         .then(async (res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             let comment = await Comment.findById(commentIDArray[0]);
    //             userId0.should.eql(comment.postedBy.toString());
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${userToken1}`)
    //             .send({text:"This should change!"})
    //             .then(async res=>{
    //                 res.status.should.eql(403);
    //                 res.body.error.should.eql(StaticStrings.NotOwnerError);
    //             });
    //         });
    //     })
    //     it("Edit a reply, but text is empty (should fail)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"What a reply!"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({text:"   "})
    //             .then(async res=>{
    //                 res.status.should.eql(400);
    //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired);
    //             });
    //         });
    //     });
    //     it("Edit a reply, but missing text field (should fail)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"What a reply!"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({other_field:""})
    //             .then(async res=>{
    //                 res.status.should.eql(400);
    //                 res.body.error.should.eql(StaticStrings.ReplyControllerErrors.MissingTextField);
    //             });
    //         });
    //     });
    //     it("Edit a reply, but text is too long (should fail)",async()=>{
    //         let new_text = new Array(122).join('a');
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"hi"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({text:new_text})
    //             .then(async res=>{
    //                 res.status.should.eql(400);
    //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.MaxCommentSizeError);
    //             });
    //         });
    //     })
    //     it("Reply doesn't exist (should get 404)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"hi"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${"dummy"}?access_token=${admin.access_token}`)
    //             .send({text:"new text"})
    //             .then(async res=>{
    //                 res.status.should.eql(404);
    //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
    //             });
    //         });
    //     })
    //     it("Comment doesn't exist (should get 404)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"hi"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${"dumb"}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({text:"new text"})
    //             .then(async res=>{
    //                 res.status.should.eql(404);
    //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
    //             });
    //         });
    //     })
    //     it("Not logged in (should fail)",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"hi"})
    //         .then((res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}`)
    //             .send({text:"new text"})
    //             .then(async res=>{
    //                 res.status.should.eql(401);
    //                 res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
    //             });
    //         });
    //     })
    //     it("Missing privileges",async()=>{
    //         return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
    //         .send({text:"hi"})
    //         .then(async (res)=>{
    //             res.status.should.eql(200);
    //             let replyId = res.body._id;
    //             await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
    //             return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
    //             .send({text:"new text"})
    //             .then(async res=>{
    //                 res.status.should.eql(403);
    //                 res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
    //             });
    //         });
    //     })
    // });
    describe('DELETE \'/api/:commentId/replies/:replyId\'', ()=>{
      let commentIDArray;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: `Original reply ${i}`,
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Delete a reply (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                        .then((res)=>{
                          res.status.should.eql(404);
                        });
                  });
            });
      });
      it('Try to delete reply of comment you own but didn\'t write the reply (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${userToken1}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                  });
            });
      });
      it('Reply doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/${commentIDArray[0]}/replies/${'dumb'}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('Comment doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${'dumb'}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}`)
                  .then(async (res)=>{
                    res.status.should.eql(401);
                  });
            });
      });
      it('Missing privileges', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': ['post:edit_content']}, {new: true});
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
                  });
            });
      });
    });
    describe('PUT/DELETE \'/api/:commentId/replies/:replyId/likes\'', ()=>{
      let commentIDArray;
      const agent = chai.request.agent(app);
      let admin.access_token; let userToken1; let userToken2;
      let post._id;
      before(async ()=>{
        await dropDatabase();
        let user = await createUser(UserData[0]);
        admin.access_token = user.access_token;
        user = await createUser(UserData[1]);
        userToken1 = user.access_token;
        user = await createUser(UserData[2]);
        userToken2=user.access_token;
        await agent.post(`/api/posts?access_token=${admin.access_token}&type=ProductPost`)
            .attach('media', image1)
            .field(PostData[0])
            .then((res)=>{
              res.status.should.eql(200);
              post._id = res.body._id;
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken1}`)
            .send({text: CommentData[0].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${admin.access_token}`)
            .send({text: CommentData[1].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        await agent.post(`/api/${post._id}/comments?access_token=${userToken2}`)
            .send({text: CommentData[2].text})
            .then((res)=>{
              res.status.should.eql(200);
            });
        commentIDArray = await Comment.find().select('_id').distinct('_id');
        const userIDArray = await User.find().select('_id').distinct('_id');
        const numComments = commentIDArray.length;
        // add some replies
        for (let i = 0; i < numComments; i++) {
          for (let j = 0; j<i*2; j++) {
            const likeArray = [];
            for (let k = 0; k < (i+5)*j; k++) {
              likeArray.push(userIDArray[(k+1)%numComments]);
            }
            await Comment.findOneAndUpdate(
                {'_id': commentIDArray[i]}, {$push: {replies: {
                  text: `Original reply ${i}`,
                  postedBy: userIDArray[j%numComments],
                  likes: likeArray,
                },
                },
                }, {runValidators: true, new: true});
          }
        }
        // check number of comment replies
        for (let i = 0; i < numComments; i++) {
          const comment = await Comment.findById({'_id': commentIDArray[i]});
          comment.replies.length.should.eql(i*2);
        }
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('Like a reply (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body._id.should.eql(replyId);
                    return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.likes.should.eql(1);
                        });
                  });
            });
      });
      it('Unlike a reply before liking (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body._id.should.eql(replyId);
                    return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                        .then((res)=>{
                          res.status.should.eql(200);
                          res.body.likes.should.eql(0);
                        });
                  });
            });
      });
      it('Like a reply twice (should only work once but succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(()=>{
                    return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                        .then(async (res)=>{
                          res.status.should.eql(200);
                          res.body._id.should.eql(replyId);
                          return agent.get(`/api/${commentIDArray[0]}/replies/${replyId}?access_token=${admin.access_token}`)
                              .then((res)=>{
                                res.status.should.eql(200);
                                res.body.likes.should.eql(1);
                              });
                        });
                  });
            });
      });
      it('Like a reply and then unlike (should succeed)', async ()=>{
        return agent.post(`/api/${commentIDArray[1]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.put(`/api/${commentIDArray[1]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(()=>{
                    return agent.delete(`/api/${commentIDArray[1]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                        .then(async (res)=>{
                          res.status.should.eql(200);
                          res.body._id.should.eql(replyId);
                          return agent.get(`/api/${commentIDArray[1]}/replies/${replyId}?access_token=${admin.access_token}`)
                              .then((res)=>{
                                res.status.should.eql(200);
                                res.body.likes.should.eql(0);
                              });
                        });
                  });
            });
      });
      it('(Like) Reply doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              return agent.put(`/api/${commentIDArray[0]}/replies/${'dumb'}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('(Like) Comment doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.put(`/api/${'Dumb'}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('(Like) Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=NotValid`)
                  .then(async (res)=>{
                    res.status.should.eql(401);
                  });
            });
      });
      it('(Like) Missing privileges', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': ['post:edit_content']}, {new: true});
              return agent.put(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
                  });
            });
      });
      it('(Unlike) Reply doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/${commentIDArray[0]}/replies/${'dumb'}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('(Unlike) Comment doesn\'t exist (should get 404)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${'Dumb'}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                  });
            });
      });
      it('(Unlike) Not logged in (should fail)', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then((res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=NotValid`)
                  .then(async (res)=>{
                    res.status.should.eql(401);
                  });
            });
      });
      it('(Unlike) Missing privileges', async ()=>{
        return agent.post(`/api/${commentIDArray[0]}/replies?access_token=${admin.access_token}`)
            .send({text: 'What a reply!'})
            .then(async (res)=>{
              res.status.should.eql(200);
              const replyId = res.body._id;
              await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': ['post:edit_content']}, {new: true});
              return agent.delete(`/api/${commentIDArray[0]}/replies/${replyId}/likes?access_token=${admin.access_token}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': permissions.get_permission_array('user')}, {new: true});
                  });
            });
      });
    });
  });
};

export default replyTest;
