import chai  from 'chai';
import chaiHttp from 'chai-http';

import {app} from '../../server/server';
import {Setup} from '../../development/comments.data';
import {UserData} from '../../development/user.data';
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import Comment from '../../server/models/comment.model';
import StaticStrings from '../../config/StaticStrings';


chai.use(chaiHttp);
chai.should();

const reply_test = () => {
    describe("Replies Test", ()=>{
        describe("GET '/api/:commentId/replies'",()=>{
            let comment_id_array;
            let userId0,userId1,userId2;
            let agent = chai.request.agent(app);
            let userToken0,userToken1;
            beforeEach(async()=>{
                await drop_database();
                await Setup();
                let num_comments = await Comment.countDocuments();
                num_comments.should.eql(UserData.length);
                comment_id_array = await Comment.find().select('_id').distinct('_id');
                let user_id_array = await User.find().select('_id').distinct('_id');
                // add some replies
                for (let i = 0; i < num_comments; i++){
                    for (let j = 0; j<i*2; j++){
                    await Comment.findOneAndUpdate(
                        {'_id':comment_id_array[i]},{$push: { replies:{
                            text: "new text",
                            postedBy: user_id_array[j%num_comments],
                            likes: [user_id_array[(j+1)%num_comments],user_id_array[(j+2)%num_comments]]
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
            it("See if all replies or of the proper length",async()=>{
                return agent.get(`/api/${comment_id_array[0]}/replies?access_token=${userToken0}`)
                .then(res=>{
                    res.status.should.eql(200);
                    res.body.replies.length.should.eql(0);
                    return agent.get(`/api/${comment_id_array[1]}/replies?access_token=${userToken1}`)
                    .then(res=>{
                        res.status.should.eql(200);
                        res.body.replies[0].should.have.property('text'); // the required
                        res.body.replies[0].should.have.property('postedBy'); // the required
                        res.body.replies[0].likes.length.should.eql(2);
                        res.body.replies.length.should.eql(2);
                        return agent.get(`/api/${comment_id_array[2]}/replies?access_token=${userToken1}`)
                        .then(res=>{
                            res.status.should.eql(200);
                            res.body.replies.length.should.eql(4);
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
    });
}

export default reply_test;