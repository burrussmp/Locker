/* eslint-disable max-len */
require('dotenv').config();

const getMongodbURI = () => {
  if (process.env.NODE_ENV == 'development') {
    return `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
  } else if (process.env.NODE_ENV == 'test') {
    return process.env.MONGODB_URI || process.env.MONGO_HOST ||'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + `/${process.env.MONGO_TEST_DB_NAME}`;
  } else if (process.env.NODE_ENV == 'production') {
    throw Error('Production DB not implemented');
  } else {
    throw Error(`NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or production`);
  }
};

const getAWSConfig = () => {
  if (process.env.NODE_ENV == 'development') {
    return {
      region: process.env.AWS_DEV_REGION,
      aws_access_key: process.env.AWS_ACCESS_KEY_ID_DEV,
      aws_secret: process.env.AWS_SECRET_ACCESS_KEY_DEV,
      aws_bucket_name: process.env.AWS_S3_DEV_BUCKET_NAME,
      aws_user_pool_id: process.env.AWS_USER_POOL_ID_DEV,
      aws_user_pool_client_id: process.env.AWS_USER_POOL_CLIENT_ID_DEV,
      aws_employee_pool_id: process.env.AWS_EMPLOYEE_POOL_ID_DEV,
      aws_employee_pool_client_id: process.env.AWS_EMPLOYEE_POOL_CLIENT_ID_DEV,
    };
  } else if (process.env.NODE_ENV == 'test') {
    return {
      region: process.env.AWS_TEST_REGION,
      aws_access_key: process.env.AWS_ACCESS_KEY_ID_TEST,
      aws_secret: process.env.AWS_SECRET_ACCESS_KEY_TEST,
      aws_bucket_name: process.env.AWS_S3_TEST_BUCKET_NAME,
      aws_user_pool_id: process.env.AWS_USER_POOL_ID_TEST,
      aws_user_pool_client_id: process.env.AWS_USER_POOL_CLIENT_ID_TEST,
      aws_employee_pool_id: process.env.AWS_EMPLOYEE_POOL_ID_TEST,
      aws_employee_pool_client_id: process.env.AWS_EMPLOYEE_POOL_CLIENT_ID_TEST,
    };
  } else {
    throw Error(`NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or production`);
  }
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  address: process.env.NODE_ENV == 'test' ? '127.0.0.1' : process.env.IP_ADDRESS,
  mongoUri: getMongodbURI(),
  aws_config: getAWSConfig(),
};

export default config;
