import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData,ReactionData} from '../../development/post.data';
import {drop_database} from  '../helper';
import User from '../../server/models/user.model';
import Comment from '../../server/models/comment.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';

chai.use(chaiHttp);
chai.should();

let image1 = process.cwd() + '/test/resources/profile1.png';
let image2 = process.cwd() + '/test/resources/profile2.jpg';
let textfile = process.cwd() + '/test/resources/profile3.txt';
let video = process.cwd() + '/test/resources/sample_vid.mp4';

const post_test_basics = () => {
    describe("Post Test Basics", ()=>{
        describe("GET '/api/posts'",()=>{
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
            it("Create a post! (should succeed)",async()=>{
                return agent.post(`/api/posts?access_token=${userToken0}&type=ContentPost`)
                    .attach("ContentPost",image1)
                    .field(PostData[0])
                    .then(res=>{
                        res.status.should.eql(200);
                        console.log(res.body)
                    });  
            })
        });
    });
}

export default post_test_basics;