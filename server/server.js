import config from './../config/config'
import app from './express'
import mongoose from 'mongoose'

import {setup_development_database} from '../development/index';
import StaticStrings from '../config/StaticStrings';

// Connection URL
mongoose.Promise = global.Promise
// Configure DB
mongoose.connect(config.mongoUri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
// See if connection is valid
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`)
})

// Populate the development database
if (config.env == 'development'){
  // setup_development_database(mongoose);
}
// Catch unauthorized errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(err.status).json({"error" : StaticStrings.ErrorUnauthorizedMissingToken})
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