/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData} from '../../development/post.data';
import User from '../../server/models/user.model';
import RBAC from '../../server/models/rbac.model';
import StaticStrings from '../../config/StaticStrings';
import {dropDatabase, createUser} from '../helper';
import mongoose from 'mongoose';

const ReactionTypes = mongoose.models.Post.schema.tree.reactions[0].tree.type.enum.values;

const image1 = process.cwd() + '/test/resources/profile1.png';
const video = process.cwd() + '/test/resources/sample_vid.mp4';


chai.use(chaiHttp);
chai.should();


const reactionTest = () => {
  describe('Reactions Test', ()=>{
    describe('GET/POST /api/posts/:postId/comments', ()=>{
      let userId0;
      const agent = chai.request.agent(app);
      let userToken0; let userToken1;
      let postId0;
      before(async ()=>{
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
              postId0 = res.body._id;
            });
        await agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
            .attach('media', video)
            .field(PostData[1])
            .then((res)=>{
              res.status.should.eql(200);
            });
      });
      after(async ()=>{
        await dropDatabase();
      });
      it('See if all valid reactions work', async ()=>{
        for (const reaction of ReactionTypes) {
          return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
              .send({reaction: reaction})
              .then(async (res)=>{
                res.status.should.eql(200);
                res.body.should.have.property('_id');
                return agent.get(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
                    .then(async (res)=>{
                      res.status.should.eql(200);
                      res.body.selected.should.be.eql(reaction);
                      for (const reaction2 of ReactionTypes) {
                                reaction2==reaction ? res.body[reaction2].should.eql(1) : res.body[reaction2].should.eql(0);
                      }
                    });
              });
        }
      });
      it('Check if \'selected\' false at first', async ()=>{
        for (const reaction of ReactionTypes) {
          return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
              .send({reaction: reaction})
              .then(async (res)=>{
                res.status.should.eql(200);
                res.body.should.have.property('_id');
                return agent.get(`/api/posts/${postId0}/reaction?access_token=${userToken1}`)
                    .then(async (res)=>{
                      res.status.should.eql(200);
                      res.body.selected.should.be.false;
                    });
              });
        }
      });
      it('Invalid reaction (should fail)', async ()=>{
        return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
            .send({reaction: 'invalid'})
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.PostModelErrors.InvalidReaction);
            });
      });
      it('Invalid reaction (empty string) (should fail)', async ()=>{
        return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
            .send({reaction: ''})
            .then(async (res)=>{
              res.status.should.eql(400);
              res.body.error.should.eql(StaticStrings.PostModelErrors.InvalidReaction);
            });
      });
      it('Delete before reaction (should fail)', async ()=>{
        return agent.delete(`/api/posts/${postId0}/reaction?access_token=${userToken0}`).then(()=>{
          return agent.delete(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
              .then(async (res)=>{
                res.status.should.eql(404);
                res.body.error.should.eql(StaticStrings.PostModelErrors.NoReactionToDelete);
              });
        });
      });
      it('React, delete, and check if selected adjusted (should be fine)', async ()=>{
        return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
            .send({reaction: 'like'})
            .then(async (res)=>{
              res.status.should.eql(200);
              return agent.delete(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
                  .then(async (res)=>{
                    res.status.should.eql(200);
                    return agent.get(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
                        .then(async (res)=>{
                          res.status.should.eql(200);
                          res.body.selected.should.be.false;
                        });
                  });
            });
      });
      it('Bad Permissions (should fail)', async ()=>{
        const role = await RBAC.findOne({'role': 'na'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': role._id}, {new: true});
        return agent.put(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
            .send({reaction: 'like'})
            .then(async (res)=>{
              res.status.should.eql(403);
              return agent.delete(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
                  .then(async (res)=>{
                    res.status.should.eql(403);
                    return agent.get(`/api/posts/${postId0}/reaction?access_token=${userToken0}`)
                        .then(async (res)=>{
                          res.status.should.eql(403);
                        });
                  });
            });
      });
      it('Not logged in (should fail)', async ()=>{
        return agent.put(`/api/posts/${postId0}/reaction?access_token=${userId0}`)
            .send({reaction: 'like'})
            .then(async (res)=>{
              res.status.should.eql(401);
              return agent.delete(`/api/posts/${postId0}/reaction?access_token=${userId0}`)
                  .then(async (res)=>{
                    res.status.should.eql(401);
                    return agent.get(`/api/posts/${postId0}/reaction?access_token=${userId0}`)
                        .then(async (res)=>{
                          res.status.should.eql(401);
                        });
                  });
            });
      });
      it('Post not found (should fail)', async ()=>{
        return agent.put(`/api/posts/${userId0}/reaction?access_token=${userToken0}`)
            .send({reaction: 'like'})
            .then(async (res)=>{
              res.status.should.eql(404);
              return agent.delete(`/api/posts/${userId0}/reaction?access_token=${userToken0}`)
                  .then(async (res)=>{
                    res.status.should.eql(404);
                    return agent.get(`/api/posts/${userId0}/reaction?access_token=${userToken0}`)
                        .then(async (res)=>{
                          res.status.should.eql(404);
                        });
                  });
            });
      });
    });
  });
};

export default reactionTest;
