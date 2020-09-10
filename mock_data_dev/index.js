'use strict';
const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
mongoose.Promise = global.Promise
mongoose.connect(mongoURI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoURI}`)
})


const API = require('./api');
let Users = require('./_user_data');

(async () => {
    console.log('Dropping data base...');
    await mongoose.connection.dropDatabase();
    console.log('Populating with users...');
    for (let i = 0; i < Users.data.length; ++i){
        let token = await API.SignUp(Users.data[i])
        Users.data[i]['token'] = token;
    }
})();
