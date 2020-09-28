'use strict';

const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
mongoose.Promise = global.Promise
mongoose.connect(mongoURI, { useNewUrlParser: true, useCreateIndex: false, useUnifiedTopology: true, useFindAndModify: false, autoIndex: true })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoURI}`)
})


const API = require('./api');
let Users = require('./_user_data');
let helper = require('./helper');
require('../server/models/comment.model');
require('../server/models/posts/content.post.model');

(async () => {
    console.log('Dropping data base...');
    await helper.drop_database()
    console.log('Populating with users and adding their profile photos...');
    for (let i = 0; i < Users.data.length; ++i){
        let user_signup = helper.filter_user_signup(Users.data[i]); // signup
        let {_id,token} = await API.SignUp(user_signup)
        Users.data[i]['token'] = token;
        Users.data[i]['_id'] = _id;
        await API.UpdateProfilePhoto(_id,token,Users.data[i].avatar)
    }
    console.log('Setting up following relationship');
    for (let i = 0; i < Users.data.length; ++i){
        let follows = Users.data[i].follows;
        let token = Users.data[i].token;
        for (let index of follows){
            let _id = Users.data[index]._id;
            await API.Follow(_id,token);
        }
    }
    console.log('Creating posts');
    for (let i = 0; i < Users.data.length; ++i){
        let posts = Users.data[i].posts;
        let token = Users.data[i].token;
        if (posts){
            for (let j = 0; j < posts.length; ++j){
                let post = posts[j]
                let post_data = helper.filter_content_post_create(post);
                let _id = await API.CreateContentPost(post_data,token);
                Users.data[i].posts[j]['_id'] = _id;
                let comments = posts[j].comments
                if (comments){
                    for (let k = 0; k < comments.length; ++k){
                        let comment_data = helper.filter_comment_create(comments[k]);
                        let _id2 = await API.CreateComment(comment_data,_id,token);
                        console.log(`Created comment ${comment_data.text}`)
                        Users.data[i].posts[j].comments[k]['_id'] = _id2;
                        let replies = comments[k].replies;
                        if (replies){
                            for (let l = 0; l < replies.length; l++){
                                let reply_data = helper.filter_reply_create(replies[l]);
                                let _id3 = await API.CreateReply(reply_data,_id2,token);
                                Users.data[i].posts[j].comments[k].replies[l]['_id'] = _id3;
                                console.log(`Created reply ${reply_data.text}`)
                            }
                        }
                    }
                }
            }
        }
    }
    console.log('Creating comments');
})();
