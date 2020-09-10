import config from './../config/config'
import app from './express'
import mongoose from 'mongoose'

import StaticStrings from '../config/StaticStrings';

// Connection URL
mongoose.Promise = global.Promise
// Configure DB
console.log(config.mongoUri)
mongoose.connect(config.mongoUri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
// See if connection is valid
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
app.listen(config.port, (err) => {
  if (err) {
    console.log(err)
  }
  console.info('Server started on port %s.', config.port)
})

export {app}