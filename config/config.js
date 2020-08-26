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

const get_aws_config = () => {
  if (process.env.NODE_ENV == 'development'){
    return {
      aws_access_key: process.env.AWS_ACCESS_KEY_ID_DEV,
      aws_secret: process.env.AWS_SECRET_ACCESS_KEY_DEV
    }
  } else if (process.env.NODE_ENV == 'test'){
    return {
      aws_access_key: process.env.AWS_ACCESS_KEY_ID_TEST,
      aws_secret: process.env.AWS_SECRET_ACCESS_KEY_TEST
    }
  } else {
    throw `NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or production`;
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: get_mongodb_uri(),
  jwtSecret: process.env.JWT_SECRET,
  bucket_name: process.env.NODE_ENV == 'development' ? "locker-media-storage-dev" : "locker-media-storage-test",
  aws_config: get_aws_config()
}

export default config
