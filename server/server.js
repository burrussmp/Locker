import config from './../config/config'
import app from './express'
import mongoose from 'mongoose'
import permissions from './permissions';
import StaticStrings from '../config/StaticStrings';

// Connection URL
mongoose.Promise = global.Promise
// Configure DB
mongoose.connect(config.mongoUri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
// See if connection is valid
mongoose.connection.on('connected', async ()=>{
  console.log(`Connected to database: ${config.mongoUri}`);
  await permissions.setUpRBAC();
})
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`)
})


// Catch unauthorized errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(err.status).json({"error" : StaticStrings.UnauthorizedMissingTokenError})
  }else if (err) {
    res.status(400).json({"error" : err.message})
  }
})

// Listen
const server = app.listen(config.port,config.address, (err) => {
  if (err) {
    console.log(err)
  } else {
    const host = server.address().address;
    const port = server.address().port;
    console.log('running at http://' + host + ':' + port)
  }
})

export {app}