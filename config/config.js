require('dotenv').config();
const get_mongodb_uri = () => {
  if (process.env.NODE_ENV == 'development'){
    return `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`
  } else if (process.env.NODE_ENV == 'test'){
    return process.env.MONGODB_URI || process.env.MONGO_HOST ||'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + `/${process.env.MONGO_TEST_DB_NAME}`
  } else if (process.env.NODE_ENV == 'production'){
    throw "Production DB not implemented";
  } else {
    throw `NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or production`;
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: get_mongodb_uri(),
  jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",

}

export default config
