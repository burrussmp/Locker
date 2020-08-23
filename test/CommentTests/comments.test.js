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
        describe("GET/POST /api/posts/:postId/comments",()=>{
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            let postId0,postId1;
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
                await agent.post(`/api/posts?access_token=${userToken1}&type=ContentPost`)
                    .attach("media",video)
                    .field(PostData[1])
                    .then((res)=>{
                        res.status.should.eql(200);
                        postId1 = res.body._id;
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
            it("Create a content post and see if media matches in S3! (should succeed)",async()=>{
                return agent.post(`/api/posts/${postId0}/comments?access_token=${userToken0}`)
                    .send({text: CommentData[0]})
                    .then(async res=>{
                        res.status.should.eql(200);
                        console.log(res.body)
                });  
            })
        })
    })
}

export default comments_test;