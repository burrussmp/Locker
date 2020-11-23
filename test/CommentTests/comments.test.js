import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData,ReactionData} from '../../development/post.data';
import {CommentData} from '../../development/comments.data';
import User from '../../server/models/user.model';
import Comment from '../../server/models/comment.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';
import {dropDatabase, createUser} from  '../helper';
import _ from 'lodash';
import permissions from '../../server/permissions';

let image1 = process.cwd() + '/test/resources/profile1.png';
let video = process.cwd() + '/test/resources/sample_vid.mp4';


chai.use(chaiHttp);
chai.should();

const comments_test = () => {
    describe("Comments Test",()=>{
        describe("GET/POST /api/posts/:postId/comments",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            let postId0,postId1;
            before (async()=>{
                await dropDatabase();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;  
                await agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[0])
                    .then((res)=>{
                        res.status.should.eql(200);
                        postId0 = res.body._id;
                    })
                await agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",video)
                    .field(PostData[1])
                    .then((res)=>{
                        res.status.should.eql(200);
                        postId1 = res.body._id;
                    })
            });
            afterEach(async()=>{ 
                let comments = await Comment.find();
                for (let comment of comments){
                    await comment.deleteOne();
                }
            });
            after(async()=>{
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
            })
            it("Create two comments by two different users, check if the post has two comments with the right content from the right user",async()=>{
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text: CommentData[0].text})
                    .then(async res=>{
                        res.status.should.eql(200);
                        let comment_id_1 = res.body._id;
                        return agent.post(`/api/${postId0}/comments?access_token=${userToken1}`)
                        .send({text: CommentData[1].text})
                        .then(async res=>{
                            res.status.should.eql(200);
                            let comment_id_2 = res.body._id;
                            return agent.get(`/api/${postId0}/comments?access_token=${userToken1}`)
                            .then(async res=>{
                                res.status.should.eql(200);
                                res.body[0]._id.should.eql(comment_id_1);
                                res.body[1]._id.should.eql(comment_id_2)
                                let comment1 = await Comment.findById(comment_id_1);
                                let comment2 = await Comment.findById(comment_id_2);
                                comment1.postedBy.toString().should.eql(userId0);
                                comment2.postedBy.toString().should.eql(userId1);
                                comment1.text.should.eql(CommentData[0].text);
                                comment2.text.should.eql(CommentData[1].text)
                                let post = await Post.findById(postId0);
                                post.comments.length.should.eql(2);
                                post.comments[0].should.eql(comment1._id);
                                post.comments[1].should.eql(comment2._id);
                        });       
                    });  
                });  
            })
            it("Create two comments by same user, check if the post has two comments with the right content from the right user",async()=>{
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text: CommentData[2].text})
                    .then(async res=>{
                        res.status.should.eql(200);
                        let comment_id_1 = res.body._id;
                        return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                        .send({text: CommentData[3].text})
                        .then(async res=>{
                            res.status.should.eql(200);
                            let comment_id_2 = res.body._id;
                            return agent.get(`/api/${postId0}/comments?access_token=${userToken1}`)
                            .then(async res=>{
                                res.status.should.eql(200);
                                res.body[0]._id.should.eql(comment_id_1);
                                res.body[1]._id.should.eql(comment_id_2)
                                let comment1 = await Comment.findById(comment_id_1);
                                let comment2 = await Comment.findById(comment_id_2);
                                comment1.postedBy.toString().should.eql(userId0);
                                comment2.postedBy.toString().should.eql(userId0);
                                comment1.text.should.eql(CommentData[2].text);
                                comment2.text.should.eql(CommentData[3].text)
                                let post = await Post.findById(postId0);
                                post.comments.length.should.eql(2);
                                post.comments[0].should.eql(comment1._id);
                                post.comments[1].should.eql(comment2._id);
                        });       
                    });  
                });  
            })
            it("Too long of comment (should fail)",async()=>{
                let comment_text = new Array(302).join('a');
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:comment_text})
                    .then(async res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.MaxCommentSizeError);        
                });  
            })
            it("Empty comment (should fail)",async()=>{
                let comment_text = "";
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:comment_text})
                    .then(async res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);        
                });  
            })
            it("Comment text is all spaces (should fail)",async()=>{
                let comment_text = "   ";
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:comment_text})
                    .then(async res=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);        
                });  
            })
            it("No comments (should succeed but be empty)",async()=>{
                let comment_text = "   ";
                return agent.get(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.length.should.eql(0);        
                });  
            })
            it("No comments (should succeed but be empty)",async()=>{
                let comment_text = "   ";
                return agent.get(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.length.should.eql(0);        
                });  
            })
            it("No comments (should succeed but be empty)",async()=>{
                return agent.get(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.length.should.eql(0);        
                });  
            })
            it("Post doesn't exist (should fail)",async()=>{
                return agent.post(`/api/${userId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[0].text})
                    .then(async res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);        
                        return agent.get(`/api/${userId0}/comments?access_token=${userToken0}`)
                        .then(async res=>{
                            res.status.should.eql(404);
                            res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);        
                    });      
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.post(`/api/${postId0}/comments`)
                    .send({text:CommentData[0].text})
                    .then(async res=>{
                        res.status.should.eql(401);
                        return agent.get(`/api/${postId0}/comments`)
                        .then(async res=>{
                            res.status.should.eql(401);
                    });      
                });  
            })
            it("No permissions (should fail)",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[0].text})
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);        
                        return agent.get(`/api/${postId1}/comments?access_token=${userToken0}`)
                        .then(async res=>{
                            res.status.should.eql(403);
                            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                            await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});        
                    });      
                });  
            })
            it("User gets removed but their comments should exist",async()=>{
                return agent.post(`/api/${postId1}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[0].text})
                    .then(async res=>{
                        res.status.should.eql(200);
                        return agent.delete(`/api/users/${userId0}?access_token=${userToken0}`)
                        .then(async res=>{
                            res.status.should.eql(200);
                            let num_comments = await Comment.countDocuments();
                            num_comments.should.eql(1);
                    });   
                });  
            })
        })
        describe("DELETE/GET /api/comments/:commentId",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            let postId0;
            let commentId0,commentId1,commentId2;
            before (async()=>{
                await dropDatabase();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;  
                await agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                .attach("media",image1)
                .field(PostData[0])
                .then((res)=>{
                    res.status.should.eql(200);
                    postId0 = res.body._id;
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken1}`)
                    .send({text:CommentData[0].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                        commentId0 = res.body._id;
                    })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                        commentId1 = res.body._id;
                    })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken1}`)
                    .send({text:"delete this one"})
                    .then((res)=>{
                        res.status.should.eql(200);
                        commentId2 = res.body._id;
                    })
                await agent.put(`/api/${commentId0}/likes?access_token=${userToken1}`)
                    .then((res)=>{
                        res.status.should.eql(200);
                    })     
                });
            after(async()=>{
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
                let comments = await Comment.find();
                for (let comment of comments){
                    await comment.deleteOne();
                }
                await dropDatabase()
            })
            it("Delete twice (first succeeds and second 404s)",async()=>{
                return agent.delete(`/api/comments/${commentId2}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.should.have.property('_id')
                        return agent.delete(`/api/comments/${commentId2}?access_token=${userToken1}`)
                        .then(async res=>{
                            res.status.should.eql(404);
                            res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                    });   
                });  
            })
            it("Bad ID for comment (404 errors)",async()=>{
                return agent.delete(`/api/comments/${userId0}?access_token=${userToken0}`)
                        .then(async res=>{
                            res.status.should.eql(404);
                            res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                    });   
            })
            it("Not logged in (should fail)",async()=>{
                return agent.delete(`/api/comments/${commentId1}`)
                    .then(async res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError) 
                });  
            })
            it("Owner of post but not comment (should fail)",async()=>{
                return agent.delete(`/api/comments/${commentId0}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.NotOwnerError) 
                });  
            })
            it("Delete comment as owner of comment but not post, then repost comment and like it (should succeed)",async()=>{
                return agent.delete(`/api/comments/${commentId0}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        return agent.post(`/api/${postId0}/comments?access_token=${userToken1}`)
                        .send({text:CommentData[0].text})
                        .then((res)=>{
                            res.status.should.eql(200);
                            commentId0 = res.body._id;
                            return agent.put(`/api/${commentId0}/likes?access_token=${userToken1}`)
                            .then((res)=>{
                                res.status.should.eql(200);
                            })     
                        });
                    }) 
                });  
            it("Bad Permissions (should fail)",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.delete(`/api/comments/${commentId1}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError) 
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                });  
            })
            it("Get comment that you haven't liked and see if it shows that (should succeed)",async()=>{
                return agent.get(`/api/comments/${commentId0}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[0].text);
                        res.body.postedBy.toString().should.eql(userId1);
                        res.body.liked.should.be.false;
                        res.body.likes.should.eql(1);
                });  
            });
            it("Get comment that no one has liked (should succeed)",async()=>{
                return agent.get(`/api/comments/${commentId1}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[1].text);
                        res.body.postedBy.toString().should.eql(userId0);
                        res.body.liked.should.be.false;
                        res.body.likes.should.eql(0);
                });  
            });
            it("Get comment that you have liked (should succeed)",async()=>{
                return agent.get(`/api/comments/${commentId0}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[0].text);
                        res.body.postedBy.toString().should.eql(userId1);
                        res.body.liked.should.be.true;
                        res.body.likes.should.eql(1);
                });  
            });
            it("Bad IDS (404 errors)",async()=>{
                    return agent.get(`/api/comments/${userId0}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError)
                });  
            });
            it("Not logged in (should fail)",async()=>{
                return agent.get(`/api/comments/${commentId0}?access_token=${userId0}`)
                    .then(async res=>{
                        res.status.should.eql(401);
                    });  
            });
            it("No permissions",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.get(`/api/comments/${commentId0}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });  
            });
        });
    })
}

export default comments_test;