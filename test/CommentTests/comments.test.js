import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData,ReactionData} from '../../development/post.data';
import {CommentData} from '../../development/comments.data';
import User from '../../server/models/user.model';
import Media from '../../server/models/media.model';
import Comment from '../../server/models/comment.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';
import {drop_database} from  '../helper';
import _ from 'lodash';

let image1 = process.cwd() + '/test/resources/profile1.png';
let image2 = process.cwd() + '/test/resources/profile2.jpg';
let textfile = process.cwd() + '/test/resources/profile3.txt';
let video = process.cwd() + '/test/resources/sample_vid.mp4';


chai.use(chaiHttp);
chai.should();

const comments_test = () => {
    describe("Comments Test",()=>{
        // describe("GET/POST /api/posts/:postId/comments",()=>{
        //     let userId0,userId1,userId2;
        //     let agent = chai.request.agent(app);
        //     let userToken0,userToken1;
        //     let postId0,postId1;
        //     beforeEach(async()=>{
        //         await drop_database();
        //         for (let user of UserData){
        //             let new_user = new User(user);
        //             await new_user.save()
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
        //             userToken0 = res.body.token;
        //         });
        //         await agent.post('/auth/login').send({
        //             login: UserData[1].email,
        //             password: UserData[1].password
        //         }).then((res) => {
        //             userToken1 = res.body.token;
        //         });
        //         await agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
        //             .attach("media",image1)
        //             .field(PostData[0])
        //             .then((res)=>{
        //                 res.status.should.eql(200);
        //                 postId0 = res.body._id;
        //             })
        //         await agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
        //             .attach("media",video)
        //             .field(PostData[1])
        //             .then((res)=>{
        //                 res.status.should.eql(200);
        //                 postId1 = res.body._id;
        //             })
        //     });
        //     afterEach(async()=>{ 
        //         let posts = await Post.find();
        //         for (let post of posts){
        //             await post.deleteOne();
        //         }
        //         let comments = await Comment.find();
        //         for (let comment of comments){
        //             await comment.deleteOne();
        //         }
        //     });
            // it("Create two comments by two different users, check if the post has two comments with the right content from the right user",async()=>{
            //     return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .send({text: CommentData[0].text})
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             let comment_id_1 = res.body._id;
            //             return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken1}`)
            //             .send({text: CommentData[1].text})
            //             .then(async res=>{
            //                 res.status.should.eql(200);
            //                 let comment_id_2 = res.body._id;
            //                 return agent.get(`/api/posts/${postId0}/comments?access_token=${userToken1}`)
            //                 .then(async res=>{
            //                     res.status.should.eql(200);
            //                     res.body.data[0]._id.should.eql(comment_id_1);
            //                     res.body.data[1]._id.should.eql(comment_id_2)
            //                     let comment1 = await Comment.findById(comment_id_1);
            //                     let comment2 = await Comment.findById(comment_id_2);
            //                     comment1.postedBy.toString().should.eql(userId0);
            //                     comment2.postedBy.toString().should.eql(userId1);
            //                     comment1.text.should.eql(CommentData[0].text);
            //                     comment2.text.should.eql(CommentData[1].text)
            //                     let post = await Post.findById(postId0);
            //                     post.comments[0].should.eql(comment1._id);
            //                     post.comments[1].should.eql(comment2._id);
            //             });       
            //         });  
            //     });  
            // })
            // it("Create two comments by same, check if the post has two comments with the right content from the right user",async()=>{
            //     return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .send({text: CommentData[2].text})
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             let comment_id_1 = res.body._id;
            //             return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //             .send({text: CommentData[3].text})
            //             .then(async res=>{
            //                 res.status.should.eql(200);
            //                 let comment_id_2 = res.body._id;
            //                 return agent.get(`/api/posts/${postId0}/comments?access_token=${userToken1}`)
            //                 .then(async res=>{
            //                     res.status.should.eql(200);
            //                     res.body.data[0]._id.should.eql(comment_id_1);
            //                     res.body.data[1]._id.should.eql(comment_id_2)
            //                     let comment1 = await Comment.findById(comment_id_1);
            //                     let comment2 = await Comment.findById(comment_id_2);
            //                     comment1.postedBy.toString().should.eql(userId0);
            //                     comment2.postedBy.toString().should.eql(userId0);
            //                     comment1.text.should.eql(CommentData[2].text);
            //                     comment2.text.should.eql(CommentData[3].text)
            //                     let post = await Post.findById(postId0);
            //                     post.comments[0].should.eql(comment1._id);
            //                     post.comments[1].should.eql(comment2._id);
            //             });       
            //         });  
            //     });  
            // })
            // it("Too long of comment (should fail)",async()=>{
            //     let comment_text = new Array(302).join('a');
            //     return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .send({text:comment_text})
            //         .then(async res=>{
            //             res.status.should.eql(400);
            //             res.body.error.should.eql(StaticStrings.CommentModelErrors.MaxCommentSizeError);        
            //     });  
            // })
            // it("Empty comment (should fail)",async()=>{
            //     let comment_text = "";
            //     return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .send({text:comment_text})
            //         .then(async res=>{
            //             res.status.should.eql(400);
            //             res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);        
            //     });  
            // })
            // it("Comment text is all spaces (should fail)",async()=>{
            //     let comment_text = "   ";
            //     return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .send({text:comment_text})
            //         .then(async res=>{
            //             res.status.should.eql(400);
            //             res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentTextRequired);        
            //     });  
            // })
            // it("No comments (should succeed but be empty)",async()=>{
            //     let comment_text = "   ";
            //     return agent.get(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             res.body.data.length.should.eql(0);        
            //     });  
            // })
            // it("No comments (should succeed but be empty)",async()=>{
            //     let comment_text = "   ";
            //     return agent.get(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             res.body.data.length.should.eql(0);        
            //     });  
            // })
            // it("No comments (should succeed but be empty)",async()=>{
            //     return agent.get(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             res.body.data.length.should.eql(0);        
            //     });  
            // })
        //     it("Post doesn't exist (should fail)",async()=>{
        //         return agent.post(`/api/posts/${userId0}/comments?access_token=${userToken0}`)
        //             .send({text:CommentData[0].text})
        //             .then(async res=>{
        //                 res.status.should.eql(404);
        //                 res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);        
        //                 return agent.get(`/api/posts/${userId0}/comments?access_token=${userToken0}`)
        //                 .then(async res=>{
        //                     res.status.should.eql(404);
        //                     res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);        
        //             });      
        //         });  
        //     })
        //     it("Not logged in (should fail)",async()=>{
        //         return agent.post(`/api/posts/${postId0}/comments`)
        //             .send({text:CommentData[0].text})
        //             .then(async res=>{
        //                 res.status.should.eql(401);
        //                 return agent.get(`/api/posts/${postId0}/comments`)
        //                 .then(async res=>{
        //                     res.status.should.eql(401);
        //             });      
        //         });  
        //     })
        //     it("No permissions (should fail)",async()=>{
        //         await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
        //         return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
        //             .send({text:CommentData[0].text})
        //             .then(async res=>{
        //                 res.status.should.eql(403);
        //                 res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);        
        //                 return agent.get(`/api/posts/${postId1}/comments?access_token=${userToken0}`)
        //                 .then(async res=>{
        //                     res.status.should.eql(403);
        //                     res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);        
        //             });      
        //         });  
        //     })
        //     it("User gets removed but their comments should exist",async()=>{
        //         return agent.post(`/api/posts/${postId1}/comments?access_token=${userToken0}`)
        //             .send({text:CommentData[0].text})
        //             .then(async res=>{
        //                 res.status.should.eql(200);
        //                 return agent.delete(`/api/users/${userId0}?access_token=${userToken0}`)
        //                 .then(async res=>{
        //                     res.status.should.eql(200);
        //                     let num_comments = await Comment.countDocuments();
        //                     num_comments.should.eql(1);
        //             });   
        //         });  
        //     })
        // })
        describe("DELETE/GET /api/posts/:postId/comments/:commentId",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            let postId0;
            let commentId0,commentId1;
            beforeEach(async()=>{
                await drop_database();
                for (let user of UserData){
                    let new_user = new User(user);
                    await new_user.save()
                }
                await agent.get('/api/users').then(res=>{
                    res.body.length.should.eql(3);
                    res.body[0].username.should.eql(UserData[0].username)
                    userId0 = res.body[0]._id;
                    userId1 = res.body[1]._id;
                    userId2 = res.body[2]._id
                });
                await agent.post('/auth/login').send({
                    login: UserData[0].email,
                    password: UserData[0].password
                }).then((res) => {
                    userToken0 = res.body.token;
                });
                await agent.post('/auth/login').send({
                    login: UserData[1].email,
                    password: UserData[1].password
                }).then((res) => {
                    userToken1 = res.body.token;
                });
                await agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[0])
                    .then((res)=>{
                        res.status.should.eql(200);
                        postId0 = res.body._id;
                    })
                await agent.post(`/api/posts/${postId0}/comments?access_token=${userToken1}`)
                    .send({text:CommentData[0].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                        commentId0 = res.body._id;
                    })  
                await agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                        commentId1 = res.body._id;
                    })
                await agent.put(`/api/${commentId0}/likes?access_token=${userToken1}`)
                    .then((res)=>{
                        res.status.should.eql(200);
                    })     
                });
            afterEach(async()=>{ 
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
                let comments = await Comment.find();
                for (let comment of comments){
                    await comment.deleteOne();
                }
            });
            // it("Delete twice (first succeeds and second 404s)",async()=>{
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId1}?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //             res.body.should.have.property('_id')
            //             return agent.delete(`/api/posts/${postId0}/comments/${commentId1}?access_token=${userToken0}`)
            //             .then(async res=>{
            //                 res.status.should.eql(404);
            //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
            //         });   
            //     });  
            // })
            // it("Bad ID for post and comment (2 404 errors)",async()=>{
            //     return agent.delete(`/api/posts/${userId0}/comments/${commentId1}?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(404);
            //             res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError)
            //             return agent.delete(`/api/posts/${postId0}/comments/${userId0}?access_token=${userToken0}`)
            //             .then(async res=>{
            //                 res.status.should.eql(404);
            //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
            //         });   
            //     });  
            // })
            // it("Not logged in (should fail)",async()=>{
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId1}`)
            //         .then(async res=>{
            //             res.status.should.eql(401);
            //             res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError) 
            //     });  
            // })
            // it("Owner of post but not comment (should fail)",async()=>{
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(403);
            //             res.body.error.should.eql(StaticStrings.NotOwnerError) 
            //     });  
            // })
            // it("Owner of comment but not post (should succeed)",async()=>{
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userToken1}`)
            //         .then(async res=>{
            //             res.status.should.eql(200);
            //     });  
            // })
            // it("Bad Permissions (should fail)",async()=>{
            //     await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId1}?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(403);
            //             res.body.error.should.eql(StaticStrings.InsufficientPermissionsError) 
            //     });  
            // })
            // it("Bad Permissions (should fail)",async()=>{
            //     await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
            //     return agent.delete(`/api/posts/${postId0}/comments/${commentId1}?access_token=${userToken0}`)
            //         .then(async res=>{
            //             res.status.should.eql(403);
            //             res.body.error.should.eql(StaticStrings.InsufficientPermissionsError) 
            //     });  
            // })
            it("Get comment that you haven't liked and see if it shows that (should succeed)",async()=>{
                return agent.get(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[0].text);
                        res.body.postedBy.toString().should.eql(userId1);
                        res.body.liked.should.be.false;
                        res.body.likes.should.eql(1);
                });  
            });
            it("Get comment that no one has liked (should succeed)",async()=>{
                return agent.get(`/api/posts/${postId0}/comments/${commentId1}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[1].text);
                        res.body.postedBy.toString().should.eql(userId0);
                        res.body.liked.should.be.false;
                        res.body.likes.should.eql(0);
                });  
            });
            it("Get comment that you have liked (should succeed)",async()=>{
                return agent.get(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql(CommentData[0].text);
                        res.body.postedBy.toString().should.eql(userId1);
                        res.body.liked.should.be.true;
                        res.body.likes.should.eql(1);
                });  
            });
            it("Bad IDS (2 404 errors)",async()=>{
                return agent.get(`/api/posts/${userId0}/comments/${commentId0}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError)
                        return agent.get(`/api/posts/${postId0}/comments/${userId0}?access_token=${userToken1}`)
                        .then(async res=>{
                            res.status.should.eql(404);
                            res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError)
                    });  
                });  
            });
            it("Not logged in (should fail)",async()=>{
                return agent.get(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userId0}`)
                    .then(async res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                    });  
            });
            it("No permissions",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.get(`/api/posts/${postId0}/comments/${commentId0}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                    });  
            });
        });
    })
}

export default comments_test;