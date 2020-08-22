import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData,ReactionData} from '../../development/post.data';
import User from '../../server/models/user.model';
import Media from '../../server/models/media.model';
import Comment from '../../server/models/comment.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';
const fs = require('fs').promises
import S3_Services from '../../server/services/S3.services';
import fetch from 'node-fetch';
import {drop_database,buffer_equality} from  '../helper';
import _ from 'lodash';

chai.use(chaiHttp);
chai.should();

let image1 = process.cwd() + '/test/resources/profile1.png';
let image2 = process.cwd() + '/test/resources/profile2.jpg';
let textfile = process.cwd() + '/test/resources/profile3.txt';
let video = process.cwd() + '/test/resources/sample_vid.mp4';

/**
 *@desc on failure, check that there is no media or posts created. If the error message is correct, then it was also successfully cleaned up in S3.
**/
const on_failure_to_create = async (res,statusCode,errorMessage) => {
    res.body.error.should.eql(errorMessage);
    res.status.should.eql(statusCode);
    let num_media = await Media.countDocuments();
    num_media.should.eql(0);
    let num_posts = await Post.countDocuments();
    num_posts.should.eql(0);
}

/** 
 * @desc on success, check if media/post successfully stored and if in S3
**/
const on_success_to_create = async (res,userId) => {
    res.status.should.eql(200);
    let num_media = await Media.countDocuments({'uploadedBy':userId});
    num_media.should.eql(1);
    let num_posts = await Post.countDocuments({'postedBy':userId});
    num_posts.should.eql(1);
    let media = await Media.find({'uploadedBy':userId});
    return S3_Services.fileExistsS3(media[0].key)
}

const on_success_cleanup = async(key) => {
    let num_media = await Media.countDocuments();
    num_media.should.eql(0);
    let num_posts = await Post.countDocuments();
    num_posts.should.eql(0);
    return S3_Services.fileExistsS3(key).catch(err=>{
        err.statusCode.should.eql(404);
    })
}

const on_success_get_single_post = async (res,userID) => {
    res.status.should.eql(200);
    res.body.should.have.property('_id');
    res.body.should.have.property('caption');
    res.body.should.have.property('tags');
    res.body.should.have.property('type');
    res.body.should.have.property('content');
    res.body.should.have.property('postedBy');
    res.body.should.have.property('createdAt');
    res.body.should.have.property('updatedAt');
}

const content_post_test_basics = () => {
    describe("Content Post Test Basics", ()=>{
        describe("POST/GET '/api/posts'",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
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
            });
            afterEach(async()=>{ 
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
            });
            it("Create a content post and see if media matches in S3! (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[0])
                    .then(async res=>{
                        await on_success_to_create(res,userId0);
                        let postID = res.body._id;
                        return agent.get(`/api/posts/${postID}?access_token=${userToken0}`)
                        .then(async res=>{
                            res.status.should.eql(200);
                            let key = res.body.content.media.key;
                            return fetch(`http://localhost:3000/api/media/${key}?access_token=${userToken0}`)
                                .then(res=>{
                                    res.status.should.eql(200);
                                    return res.blob()
                                })
                                .then(async res=>{
                                    let buffer = await res.arrayBuffer();
                                    return fs.readFile(image1).then(data=>{
                                        buffer_equality(data,buffer).should.be.true;
                                    });
                            });
                        });
                });  
            })
                it("Permissions: Insufficient (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,403,StaticStrings.InsufficientPermissionsError);
                });  
            });
            it("Not logged in: (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                return agent.post(`/api/posts?type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,401,StaticStrings.UnauthorizedMissingTokenError);
                });  
            });
            it("Query: Incorrect type (not implemented) (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                return agent.post(`/api/posts?access_token=${userToken0}&type=NotImplememted`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,501,StaticStrings.NotImplementedError);
                });  
            });
            it("Price field: Less than zero (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.price = -0.1
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.PriceNotNonnegative);
                });  
            });
            it("Price field (Missing): (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                delete post_data['price'];
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.ContentPostErrors.PriceRequired);
                });  
            });
            it("Price field: zero (should be fine)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.price = 0.0
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_success_to_create(res,userId0);
                });  
            });
            it("Caption field: Too long (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.caption = new Array(302).join('a');
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.MaxCaptionSizeError);
                });  
            });
            it("Caption field: Too long (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.caption = new Array(302).join('a');
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.MaxCaptionSizeError);
                });  
            });
            it("Media field: Incorrect field name (not 'media') (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("Something",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.S3ServiceErrors.BadRequestWrongKey);
                });  
            });
            it("Media field: Wrong type of file (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",textfile)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,422,StaticStrings.S3ServiceErrors.InvalidMediaMimeType);
                });  
            });
            it("Media field: No file (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.S3ServiceErrors.BadRequestMissingFile);
                });  
            });
            it("Tag field: Too many tags (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.tags = "tag,tag,tag,tag,tag,tag,tag,tag"
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.MaximumNumberOfTags);
                });  
            });
            it("Tag field: A tag is too long (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.tags = "taggggggggggggggggggggggggggggggggggg"
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.MaxLengthTag);
                });  
            });
            it("Tag field: Cannot have anything besides letters (should fail)",async()=>{
                let post_data = JSON.parse(JSON.stringify(PostData[0]))
                post_data.tags = "tag1,tag2"
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(post_data)
                    .then(async res=>{
                        await on_failure_to_create(res,400,StaticStrings.PostModelErrors.TagMustBeAlphabetical);
                });  
            });
            it("Create a content post with a video (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",video)
                    .field(PostData[0])
                    .then(async res=>{
                        await on_success_to_create(res,userId0);
                        let postID = res.body._id;
                        return agent.get(`/api/posts?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.length.should.eql(1)
                            res.body[0]._id.should.eql(postID);
                        });
                });  
            })
            it("Create two posts with different users (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[0])
                    .then(async res=>{
                        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                        .attach("media",image2)
                        .field(PostData[0])
                        .then(async res=>{
                        return agent.get(`/api/posts?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.length.should.eql(2)
                        })
                    });
                });  
            })
            it("Clean up: User is deleted and so is",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",video)
                    .field(PostData[0])
                    .then(async res=>{
                        let media = await Media.findOne({'uploadedBy':userId0});
                        let key = media.key;
                        return agent.delete(`/api/users/${userId0}?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            return on_success_cleanup(key);
                        });
                });  
            });
            it("Clean up: Post is deleted and media is cleaned up",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",video)
                    .field(PostData[0])
                    .then(async res=>{
                        let media = await Media.findOne({'uploadedBy':userId0});
                        let key = media.key;
                        return agent.delete(`/api/users/${userId0}?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            return on_success_cleanup(key);
                        });
                });  
            });
        });
        describe("GET/DELETE '/api/posts/:postId'",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
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
            });
            afterEach(async()=>{ 
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
            });
            it("Retrieve existing post (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[2])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                        .then(res=>{
                            return on_success_get_single_post(res,userId0)
                        });
                });  
            });
            it("Create two and retrieve second with first user (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[0])
                    .then(async res=>{
                        res.status.should.eql(200);
                        return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                        .attach("media",image1)
                        .field(PostData[1])
                        .then(async res=>{
                        let postId = res.body._id;
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                        .then(res=>{
                            return on_success_get_single_post(res,userId1)
                        });
                    });
                });  
            });
            it("Permissions: Insufficient (should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        let postId = res.body._id;
                        await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["user:read"]},{new:true});
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(403);
                        });                
                });  
            });
            it("Not logged in: (should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        let postId = res.body._id;
                        return agent.get(`/api/posts/${postId}`)
                        .then(res=>{
                            res.status.should.eql(401);
                        });                
                });  
            });
            it("Not found: (should fail)",async()=>{
                return agent.get(`/api/posts/${userId2}?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(404);
                    res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError)
                });                
            });
            it("Delete post (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        let media = await Media.findOne({'uploadedBy':userId1});
                        let key = media.key;
                        return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            return on_success_cleanup(key)
                    });
                });  
            });
            it("Delete post twice (Second should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                            .then(res=>{
                                res.status.should.eql(404);
                                res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError);
                        });
                    });
                });  
            });
            it("Try to delete post you don't own: (Second should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        return agent.delete(`/api/posts/${postId}?access_token=${userToken0}`)
                        .then(res=>{
                            res.status.should.eql(403);
                            res.body.error.should.eql(StaticStrings.NotOwnerError)
                    });
                });  
            });
            it("Delete, not logged in: (Second should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        return agent.delete(`/api/posts/${postId}`)
                        .then(res=>{
                            res.status.should.eql(401);
                    });
                });  
            });
            it("Delete, bad permissions: (Second should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        await User.findOneAndUpdate({'username':UserData[1].username},{'permissions':["user:read"]},{new:true});
                        return agent.delete(`/api/posts/${postId}?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(403);
                            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError)
                    });
                });  
            });
            it("Delete, wrong ID: (Second should fail)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",image1)
                    .field(PostData[1])
                    .then(async res=>{
                        res.status.should.eql(200);
                        let postId = res.body._id;
                        return agent.delete(`/api/posts/${userId2}?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(404);
                            res.body.error.should.eql(StaticStrings.PostModelErrors.PostNotFoundError)
                    });
                });  
            });
        });
        describe("PUT '/api/posts/:postId'",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            let postId;
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
                        postId = res.body._id;
                    })
            });
            afterEach(async()=>{ 
                let posts = await Post.find();
                for (let post of posts){
                    await post.deleteOne();
                }
            });
            it("Successfully edit caption and tags (should succeed)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'goodtag,anothertag,finaltag';
                let tag_out = ['goodtag','anothertag','finaltag'];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                            .then(res=>{
                            res.status.should.eql(200);
                            res.body.caption.should.eql(new_caption);
                            _.isEqual(res.body.tags,tag_out).should.be.true;
                        });
                    });  
            });
            it("Empty new caption (should succeed and remove caption)",async()=>{
                let new_caption = "";
                let new_tags = 'goodtag,anothertag,finaltag';
                let tag_out = ['goodtag','anothertag','finaltag'];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                            .then(res=>{
                            res.status.should.eql(200);
                            res.body.caption.should.eql(new_caption);
                            _.isEqual(res.body.tags,tag_out).should.be.true;
                        });
                    });  
            });
            it("Validation still works: very long caption (should fail)",async()=>{
                let new_caption = new Array(302).join('a');
                let new_tags = 'goodtag,anothertag,finaltag';
                let tag_out = ['goodtag','anothertag','finaltag'];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(400);
                        res.body.error.should.eql(StaticStrings.PostModelErrors.MaxCaptionSizeError);
                    });  
            });
            it("Empty tags (should succeed and remove tags)",async()=>{
                let new_caption = "new caption";
                let new_tags = '';
                let tag_out = [];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                            .then(res=>{
                            res.status.should.eql(200);
                            res.body.caption.should.eql(new_caption);
                            _.isEqual(res.body.tags,tag_out).should.be.true;
                        });
                    });  
            });
            it("Tags have additional, unneeded comma (should succeed and ignore that tag)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,';
                let tag_out = ['a','b'];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                            .then(res=>{
                            res.status.should.eql(200);
                            res.body.caption.should.eql(new_caption);
                            _.isEqual(res.body.tags,tag_out).should.be.true;
                        });
                    });  
            });
            it("One tag is all spaces (should succeed and ignore that tag)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,   ';
                let tag_out = ['a','b'];
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(200);
                        return agent.get(`/api/posts/${postId}?access_token=${userToken0}`)
                            .then(res=>{
                            res.status.should.eql(200);
                            res.body.caption.should.eql(new_caption);
                            _.isEqual(res.body.tags,tag_out).should.be.true;
                        });
                    });  
            });
            it("Tags are not alphabetic (should fail)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,a1';
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(400);
                });  
            });
            it("Not owner: (should fail)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,c';
                return agent.put(`/api/posts/${postId}?access_token=${userToken1}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(403);
                });  
            });
            it("Not logged in: (should fail)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,c';
                return agent.put(`/api/posts/${postId}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError)
                });  
            });
            it("Insufficient permissions: (should fail)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,c';
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:read"]},{new:true});
                return agent.put(`/api/posts/${postId}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(403);
                        res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
                });  
            });
            it("Wrong post id: (should fail w/ 404)",async()=>{
                let new_caption = "new caption";
                let new_tags = 'a,b,c';
                await User.findOneAndUpdate({'username':UserData[0].username},{'permissions':["post:read"]},{new:true});
                return agent.put(`/api/posts/${userId0}?access_token=${userToken0}`)
                    .send({tags:new_tags,caption:new_caption})
                    .then(async (res)=>{
                        res.status.should.eql(404);
                });  
            });
        });
    });
}

export default content_post_test_basics;