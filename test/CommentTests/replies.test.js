import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {Setup,CommentData} from '../../development/comments.data';
import {UserData} from '../../development/user.data';
import {drop_database,createUser} from  '../helper';
import User from '../../server/models/user.model';
import Comment from '../../server/models/comment.model';
import StaticStrings from '../../config/StaticStrings';
import {PostData,ReactionData} from '../../development/post.data';
import permissions from '../../server/permissions';

let image1 = process.cwd() + '/test/resources/profile1.png';
let video = process.cwd() + '/test/resources/sample_vid.mp4';

chai.use(chaiHttp);
chai.should();

const reply_test = () => {
    describe("Replies Test", ()=>{
        describe("GET '/api/:commentId/replies'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: "new text",
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            it("See if all replies are of the proper length",async()=>{
                return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.length.should.eql(0);
                    return agent.get(`/api/${comment_id_array[1]}/replies?access_token=${userToken1}`)
                    .then(res=>{
                        // console.log(util.inspect(res.body, false, null, true /* enable colors */))
                        res.status.should.eql(200);
                        res.body[0].should.have.property('text'); // the required
                        res.body[0].should.have.property('postedBy'); // the required
                        res.body[0].should.have.property('createdAt'); // the required
                        res.body[1].likes.should.eql(6);
                        res.body.length.should.eql(2);
                        return agent.get(`/api/${comment_id_array[2]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.length.should.eql(4);
                        });
                    }); 
                });  
            })
            it("If the comment doesn't exist, should get 404",async()=>{
                return agent.get(`/api/mwahah/replies?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError); 
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.get(`/api/${comment_id_array[1]}/replies`)
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError); 
                });  
            })
            it("Missing privileges",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':[]},{new:true});
                return agent.get(`/api/${comment_id_array[1]}/replies?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError); 
                });  
            })
        })
        describe("POST '/api/:commentId/replies'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: `Original reply ${i}`,
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            let new_reply = "This is a new reply";
            it("Correctly posts reply",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text: new_reply})
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.should.have.property('_id')
                    return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken1}`)
                        .then(async res=>{
                            let reply_index = 0;
                            res.body.length.should.eql(1);
                            res.body[reply_index].postedBy.should.eql(userId0);
                            res.body[reply_index].text.should.eql(new_reply);
                            res.body[reply_index].likes.should.eql(reply_index);
                            let id = res.body[reply_index]._id;
                            return agent.delete(`/api/${comment_id_array[0]}/replies/${id}?access_token=${userToken0}`).then(res=>{
                                res.status.should.eql(200);
                            });
                        })
                });  
            })
            it("Extra field (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text: new_reply,dumb_field:"hello"})
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.should.have.property('_id')
                    return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            let reply_index = 0;
                            res.body.length.should.eql(1);
                            res.body[reply_index].postedBy.should.eql(userId0);
                            res.body[reply_index].text.should.eql(new_reply);
                            res.body[reply_index].likes.should.eql(0);
                            let id = res.body[reply_index]._id;
                            return agent.delete(`/api/${comment_id_array[0]}/replies/${id}?access_token=${userToken0}`).then(res=>{
                                res.status.should.eql(200);
                            });                        
                        })
                });  
            })
            it("Missing text field (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({dumb_field:"hello"})
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired)
                    return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            res.body.length.should.eql(0);
                        })
                });  
            })
            it("Empty text field (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:""})
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired)
                    return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            res.body.length.should.eql(0);
                        })
                });  
            })
            it("Text field all spaces(should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"  "})
                .then(res=>{
                    res.status.should.eql(400);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired)
                    return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            res.body.length.should.eql(0);
                        })
                });  
            })
            it("If the comment doesn't exist, should get 404",async()=>{
                return agent.post(`/api/mwahah/replies?access_token=${userToken0}`)
                .send({text: new_reply})
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError); 
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[1]}/replies`)
                .send({text: new_reply})
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError); 
                });  
            })
            it("Missing privileges",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':[]},{new:true});
                return agent.post(`/api/${comment_id_array[1]}/replies?access_token=${userToken0}`)
                .send({text: new_reply})
                .then(async res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                });  
            })
        });
        describe("PUT/DELETE '/api/:commentId/likes'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: `Original reply ${i}`,
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            it("Like a comment twice (should succeed and only place 1 like)",async()=>{
                return agent.put(`/api/${comment_id_array[0]}/likes?access_token=${userToken0}`)
                .then((res)=>{
                    res.status.should.eql(200);
                    return agent.put(`/api/${comment_id_array[0]}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.LikedCommentSuccess);
                        let comment = await Comment.findById(comment_id_array[0]);
                        comment.likes.length.should.eql(1);
                        comment.likes[0].toString().should.eql(userId0);
                    });
                });  
            })
            it("Unlike a comment first (should do nothing)",async()=>{
                return agent.delete(`/api/${comment_id_array[0]}/likes?access_token=${userToken0}`)
                .then(async (res)=>{
                    res.status.should.eql(200);
                    res.body.message.should.eql(StaticStrings.UnlikedCommentSuccess);
                    let comment = await Comment.findById(comment_id_array[0]);
                    comment.likes.length.should.eql(0);
                });  
            });
            it("Like a comment, then unlike the comment",async()=>{
                return agent.put(`/api/${comment_id_array[0]}/likes?access_token=${userToken0}`)
                .then((res)=>{
                    res.status.should.eql(200);
                    return agent.delete(`/api/${comment_id_array[0]}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.message.should.eql(StaticStrings.UnlikedCommentSuccess);
                        let comment = await Comment.findById(comment_id_array[0]);
                        comment.likes.length.should.eql(0);
                    });
                });  
            })
            it("If the comment doesn't exist, should get 404",async()=>{
                return agent.put(`/api/mwahah/likes?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                    return agent.delete(`/api/mwahah/likes?access_token=${userToken0}`)
                    .then(res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError); 
                    });  
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.put(`/api/${comment_id_array[1]}/likes`)
                .then(res=>{
                    res.status.should.eql(401);
                    res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                    return agent.delete(`/api/${comment_id_array[1]}/likes`)
                    .then(res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError); 
                    });  
                });  
            })
            it("Missing privileges",async()=>{
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
                return agent.delete(`/api/${comment_id_array[1]}/likes?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(403);
                    res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                    return agent.put(`/api/${comment_id_array[1]}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });  
                });  
            })
        });
        describe("GET '/api/:commentId/replies/:replyId'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: `Original reply ${i}`,
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            it("Get a specific reply (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body.text.should.eql("What a reply!");
                    });
                });  
            })
            it("Reply doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    return agent.get(`/api/${comment_id_array[0]}/replies/${"4314739849"}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
                    });
                });  
            })
            it("Comment doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.get(`/api/${"jflksjflkdsjf"}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                        res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
                    });
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}`)
                    .then(async res=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
                    });
                });  
            })
            it("Missing privileges",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then(async (res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
                    return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });
                });  
            })
        });
        /**
         * * Purposefully commented out. This API no longer exists
         */
        // describe("PUT '/api/:commentId/replies/:replyId'",()=>{
        //     let comment_id_array;
        //     let userId0,userId1,userId2;
        //     let agent = chai.request.agent(app);
        //     let userToken0,userToken1;
        //     beforeEach(async()=>{
        //         await drop_database();
        //         await Setup();
        //         let num_comments = await Comment.countDocuments();
        //         num_comments.should.eql(UserData.length);
        //         comment_id_array = await Comment.find().select('_id').distinct('_id');
        //         let user_id_array = await User.find().select('_id').distinct('_id');
        //         // add some replies
        //         for (let i = 0; i < num_comments; i++){
        //             for (let j = 0; j<i*2; j++){
        //             let like_array = [];
        //                 for (let k = 0; k < (i+5)*j;k++){
        //                     like_array.push(user_id_array[(j+1)%num_comments]);
        //                 }
        //             await Comment.findOneAndUpdate(
        //                 {'_id':comment_id_array[i]},{$push: { replies:{
        //                     text: "new text",
        //                     postedBy: user_id_array[j%num_comments],
        //                     likes: like_array
        //                     }
        //                 }
        //                 },{runValidators:true,new:true});
        //             }
        //         }
        //         for (let i = 0; i < num_comments; i++){
        //             let  comment = await Comment.findById({'_id':comment_id_array[i]});
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
        //             userToken0 = res.body.access_token;
        //         });
        //         await agent.post('/auth/login').send({
        //             login: UserData[1].email,
        //             password: UserData[1].password
        //         }).then((res) => {
        //             userToken1 = res.body.access_token;
        //         });  
        //     });
        //     it("Edit a reply (should succeed)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"What a reply!"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({text:"This should change!"})
        //             .then(async res=>{
        //                 res.status.should.eql(200);
        //                 res.body.text.should.eql("This should change!");
        //                 res.body.should.have.property('_id')
        //             });
        //         });  
        //     })
        //     it("Try to edit reply of comment you own but didn't write the reply (should fail)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"What a reply!"})
        //         .then(async (res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             let comment = await Comment.findById(comment_id_array[0]);
        //             userId0.should.eql(comment.postedBy.toString());
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken1}`)
        //             .send({text:"This should change!"})
        //             .then(async res=>{
        //                 res.status.should.eql(403);
        //                 res.body.error.should.eql(StaticStrings.NotOwnerError);
        //             });
        //         });  
        //     })
        //     it("Edit a reply, but text is empty (should fail)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"What a reply!"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({text:"   "})
        //             .then(async res=>{
        //                 res.status.should.eql(400);
        //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyTextRequired);
        //             });
        //         });  
        //     });
        //     it("Edit a reply, but missing text field (should fail)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"What a reply!"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({other_field:""})
        //             .then(async res=>{
        //                 res.status.should.eql(400);
        //                 res.body.error.should.eql(StaticStrings.ReplyControllerErrors.MissingTextField);
        //             });
        //         });  
        //     });
        //     it("Edit a reply, but text is too long (should fail)",async()=>{
        //         let new_text = new Array(122).join('a');
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"hi"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({text:new_text})
        //             .then(async res=>{
        //                 res.status.should.eql(400);
        //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.MaxCommentSizeError);
        //             });
        //         });  
        //     })
        //     it("Reply doesn't exist (should get 404)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"hi"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${"dummy"}?access_token=${userToken0}`)
        //             .send({text:"new text"})
        //             .then(async res=>{
        //                 res.status.should.eql(404);
        //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.ReplyNotFound);
        //             });
        //         });  
        //     })
        //     it("Comment doesn't exist (should get 404)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"hi"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${"dumb"}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({text:"new text"})
        //             .then(async res=>{
        //                 res.status.should.eql(404);
        //                 res.body.error.should.eql(StaticStrings.CommentModelErrors.CommentNotFoundError);
        //             });
        //         });  
        //     })
        //     it("Not logged in (should fail)",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"hi"})
        //         .then((res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}`)
        //             .send({text:"new text"})
        //             .then(async res=>{
        //                 res.status.should.eql(401);
        //                 res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        //             });
        //         });  
        //     })
        //     it("Missing privileges",async()=>{
        //         return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
        //         .send({text:"hi"})
        //         .then(async (res)=>{
        //             res.status.should.eql(200);
        //             let replyId = res.body._id;
        //             await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
        //             return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
        //             .send({text:"new text"})
        //             .then(async res=>{
        //                 res.status.should.eql(403);
        //                 res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        //             });
        //         });  
        //     })
        // });
        describe("DELETE '/api/:commentId/replies/:replyId'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: `Original reply ${i}`,
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            it("Delete a reply (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                            .then((res)=>{res.status.should.eql(404);})
                    });
                });  
            })
            it("Try to delete reply of comment you own but didn't write the reply (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken1}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                    });
                });  
            })
            it("Reply doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${"dumb"}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("Comment doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${"dumb"}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("Not logged in (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}`)
                    .then(async res=>{
                        res.status.should.eql(401);
                    });
                });  
            })
            it("Missing privileges",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then(async (res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });
                });  
            })
        });
        describe("PUT/DELETE '/api/:commentId/replies/:replyId/likes'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1,userToken2;
            let postId0;
            before (async()=>{
                await drop_database();
                let user = await createUser(UserData[0]);
                userId0 = user._id;
                userToken0 = user.access_token;
                user = await createUser(UserData[1]);
                userId1 = user._id;
                userToken1 = user.access_token;
                user = await createUser(UserData[2]);
                userId2 = user._id;
                userToken2=user.access_token;
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
                })  
                await agent.post(`/api/${postId0}/comments?access_token=${userToken0}`)
                    .send({text:CommentData[1].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                await agent.post(`/api/${postId0}/comments?access_token=${userToken2}`)
                    .send({text:CommentData[2].text})
                    .then((res)=>{
                        res.status.should.eql(200);
                })
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                let num_comments = comment_id_array.length;
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    let like_array = [];
                        for (let k = 0; k < (i+5)*j;k++){
                            like_array.push(user_id_array[(k+1)%num_comments]);
                        }
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: `Original reply ${i}`,
                            postedBy: user_id_array[j%num_comments],
                            likes: like_array
                            }
                        }
                        },{runValidators:true,new:true});
                    }
                }
                // check number of comment replies
                for (let i = 0; i < num_comments; i++){
                    let  comment = await Comment.findById({'_id':comment_id_array[i]});
                    comment.replies.length.should.eql(i*2)
                }
            });
            after(async()=>{
                await drop_database()
            })
            it("Like a reply (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body._id.should.eql(replyId);
                        return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                            .then((res)=>{
                                res.status.should.eql(200);
                                res.body.likes.should.eql(1);
                            })
                    });
                });  
            })
            it("Unlike a reply before liking (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(200);
                        res.body._id.should.eql(replyId);
                        return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                            .then((res)=>{
                                res.status.should.eql(200);
                                res.body.likes.should.eql(0);
                            })
                    });
                });  
            })
            it("Like a reply twice (should only work once but succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                        .then(()=>{
                            return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                            .then(async res=>{
                                res.status.should.eql(200);
                                res.body._id.should.eql(replyId);
                                return agent.get(`/api/${comment_id_array[0]}/replies/${replyId}?access_token=${userToken0}`)
                                    .then((res)=>{
                                        res.status.should.eql(200);
                                        res.body.likes.should.eql(1);
                                    })
                            });
                        })
                });  
            })
            it("Like a reply and then unlike (should succeed)",async()=>{
                return agent.post(`/api/${comment_id_array[1]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${comment_id_array[1]}/replies/${replyId}/likes?access_token=${userToken0}`)
                        .then(()=>{
                            return agent.delete(`/api/${comment_id_array[1]}/replies/${replyId}/likes?access_token=${userToken0}`)
                            .then(async res=>{
                                res.status.should.eql(200);
                                res.body._id.should.eql(replyId);
                                return agent.get(`/api/${comment_id_array[1]}/replies/${replyId}?access_token=${userToken0}`)
                                    .then((res)=>{
                                        res.status.should.eql(200);
                                        res.body.likes.should.eql(0);
                                    })
                            });
                        })
                });  
            })
            it("(Like) Reply doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${comment_id_array[0]}/replies/${"dumb"}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("(Like) Comment doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${"Dumb"}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("(Like) Not logged in (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=NotValid`)
                    .then(async res=>{
                        res.status.should.eql(401);
                    });
                });   
            })
            it("(Like) Missing privileges",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then(async (res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
                    return agent.put(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });
                });   
            })
            it("(Unlike) Reply doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${"dumb"}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("(Unlike) Comment doesn't exist (should get 404)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${"Dumb"}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(404);
                    });
                });  
            })
            it("(Unlike) Not logged in (should fail)",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then((res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=NotValid`)
                    .then(async res=>{
                        res.status.should.eql(401);
                    });
                });   
            })
            it("(Unlike) Missing privileges",async()=>{
                return agent.post(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .send({text:"What a reply!"})
                .then(async (res)=>{
                    res.status.should.eql(200);
                    let replyId = res.body._id;
                    await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:edit_content"]},{new:true});
                    return agent.delete(`/api/${comment_id_array[0]}/replies/${replyId}/likes?access_token=${userToken0}`)
                    .then(async res=>{
                        res.status.should.eql(403);
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':permissions.get_permission_array('user')},{new:true});
                    });
                });   
            })
        });
    });
}

export default reply_test;