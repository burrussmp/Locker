/* eslint-disable max-len */
'use strict';
// imports
import aws from 'aws-sdk';
import config from '@config/config';

/**
 * @desc Retrieve all secrets from the secret scope
 * @return {Promise<Object>} A promise that resolves to the secrets if successful
 */
const getSecrets = async () => {
  const client = new aws.SecretsManager({
    secretAccessKey: config.aws_config.aws_secret,
    accessKeyId: config.aws_config.aws_access_key,
    region: config.aws_config.region,
  });
  return new Promise((resolve, reject) => {
    client.getSecretValue({SecretId: config.aws_config.aws_secret_manager_arn}, function(err, data) {
      if (err) {
        if (err.code === 'DecryptionFailureException') {
          return reject(err);
        } else if (err.code === 'InternalServiceErrorException') {
          return reject(err);
        } else if (err.code === 'InvalidParameterException') {
          return reject(err);
        } else if (err.code === 'InvalidRequestException') {
          return reject(err);
        } else if (err.code === 'ResourceNotFoundException') {
          return reject(err);
        }
      } else {
        if ('SecretString' in data) {
          return resolve(JSON.parse(data.SecretString));
        } else {
          const buff = Buffer.from(data.SecretBinary, 'base64');
          const decodedBinarySecret = buff.toString('ascii');
          return resolve(JSON.parse(decodedBinarySecret));
        }
      }
    });
  });
};

export default {
  getSecrets,
};
