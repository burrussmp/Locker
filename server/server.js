import config from '@config/config';
import app from '@server/express';
import mongoose from 'mongoose';
import '@server/services/redis';

import StaticStrings from '@config/StaticStrings';

// Connection URL
mongoose.Promise = Promise;
// Configure DB
mongoose.connect(config.mongoUri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set('useCreateIndex', true);

// See if connection is valid
mongoose.connection.on('connected', async ()=>{
  console.log(`Connected to database: ${config.mongoUri}`);
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`);
});


// Catch unauthorized errors
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(err.status).json({'error': StaticStrings.UnauthorizedMissingTokenError});
  } else if (err) {
    res.status(400).json({'error': err.message});
  }
});

app.use(function(req, res) {
  res.status(404).json({"error": "404"})
});

// Listen
const server = app.listen(config.port, config.address, (err) => {
  if (err) {
    console.log(err);
  } else {
    const host = server.address().address;
    const port = server.address().port;
    console.log('running at http://' + host + ':' + port);
  }
});

export {app};
