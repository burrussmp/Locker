/* eslint-disable max-len */
require('dotenv').config();

const getMongodbURI = () => {
  if (process.env.NODE_ENV == 'development') {
    return `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
  } else if (process.env.NODE_ENV == 'test') {
    return process.env.MONGODB_URI || process.env.MONGO_HOST ||'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + `/${process.env.MONGO_TEST_DB_NAME}`;
  } else if (process.env.NODE_ENV == 'production') {
    throw Error('Production DB not implemented');
  } else if (process.env.NODE_ENV == 'stage') {
    return `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
  } else {
    throw Error(`NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or production`);
  }
};

const getIPAddress = () => {
  if (process.env.NODE_ENV == 'test') {
    return process.env.TEST_IP_ADDRESS;
  } else if (process.env.NODE_ENV == 'development') {
    return process.env.DEV_IP_ADDRESS;
  } else if (process.env.NODE_ENV == 'stage') {
    return process.env.STAGE_IP_ADDRESS;
  } else {
    throw Error(`Environment ${process.env.NODE_ENV} is not supported.`);
  }
};

const getPort = () => {
  if (process.env.NODE_ENV == 'test') {
    return process.env.TEST_PORT;
  } else if (process.env.NODE_ENV == 'development') {
    return process.env.DEV_PORT;
  } else if (process.env.NODE_ENV == 'stage') {
    return process.env.STAGE_PORT;
  } else {
    throw Error(`Environment ${process.env.NODE_ENV} is not supported.`);
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
      aws_secret_manager_arn: process.env.SECRET_MANAGER_ARN_DEV,
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
      aws_secret_manager_arn: process.env.SECRET_MANAGER_ARN_TEST,
    };
  } else if (process.env.NODE_ENV == 'stage') {
    return {
      region: process.env.AWS_STAGE_REGION,
      aws_access_key: process.env.AWS_ACCESS_KEY_ID_STAGE,
      aws_secret: process.env.AWS_SECRET_ACCESS_KEY_STAGE,
      aws_bucket_name: process.env.AWS_S3_TEST_BUCKET_STAGE,
      aws_user_pool_id: process.env.AWS_USER_POOL_ID_STAGE,
      aws_user_pool_client_id: process.env.AWS_USER_POOL_CLIENT_ID_STAGE,
      aws_employee_pool_id: process.env.AWS_EMPLOYEE_POOL_ID_STAGE,
      aws_employee_pool_client_id: process.env.AWS_EMPLOYEE_POOL_CLIENT_ID_STAGE,
    };
  } else {
    throw Error(`NODE_ENV set to ${process.env.NODE_ENV}: Invalid must be development, test, or stage`);
  }
};

const config = {
  env: process.env.NODE_ENV,
  port: getPort(),
  address: getIPAddress(),
  mongoUri: getMongodbURI(),
  aws_config: getAWSConfig(),
};

export default config;
