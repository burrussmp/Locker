/* eslint-disable max-len */
'use strict';
// imports
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const {v4: uuid4} = require('uuid');
global.fetch = require('node-fetch');

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import aws from 'aws-sdk';
import config from '@config/config';
import validators from '@server/services/validators';
import StaticStrings from '@config/StaticStrings';

// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: config.aws_config.aws_s3_region,
});

/**
 * @desc Generate an object that can be used to interact with a Congito User Pool
 * @param {String} type The type of Cognito User Pool to connect to and return API interface
 *  Must be either 'User' or 'Employee'
 * @return {object} An API interface for a specific Cognito User Pool
 */
const generateCognitoAPI = (type) => {
  // Configure User Pool
  const CognitoServiceProvider = new aws.CognitoIdentityServiceProvider();
  let UserPoolConfig; let UserPoolRegion; let UserPool;
  let cognitoCanUpdate;
  if (type == 'User') {
    UserPoolConfig = {
      UserPoolId: config.aws_config.aws_user_pool_id,
      ClientId: config.aws_config.aws_user_pool_client_id,
    };
    UserPoolRegion = config.aws_config.aws_user_pool_region;
    UserPool = new AmazonCognitoIdentity.CognitoUserPool(UserPoolConfig);
    cognitoCanUpdate = ['username', 'email', 'phone_number'];
  } else if (type == 'Employee') {
    UserPoolConfig = {
      UserPoolId: config.aws_config.aws_employee_pool_id,
      ClientId: config.aws_config.aws_employee_pool_client_id,
    };
    UserPoolRegion = config.aws_config.aws_employee_pool_region;
    UserPool = new AmazonCognitoIdentity.CognitoUserPool(UserPoolConfig);
    cognitoCanUpdate = ['email'];
  }

  // get the public key to verify JWT token signatures
  const pems = {};
  fetch(
      `https://cognito-idp.${UserPoolRegion}.amazonaws.com/${UserPoolConfig.UserPoolId}/.well-known/jwks.json`,
  )
      .then((res) => res.json())
      .then((body) => {
        const keys = body['keys'];
        for (let i = 0; i < keys.length; i++) {
        // Convert each key to PEM
          const keyID = keys[i].kid;
          const modulus = keys[i].n;
          const exponent = keys[i].e;
          const keyType = keys[i].kty;
          const jwk = {kty: keyType, n: modulus, e: exponent};
          const pem = jwkToPem(jwk);
          pems[keyID] = pem;
        }
      });

  /**
   * @desc Verifies a JWT token according to public signature and returns a promise.
   * @param {String} token Token to verify
   * @param {String} tokenType Useful in debugging
   * @return {Promise<String>} Resolves if token is verified
   */
  const verifyToken = (token, tokenType) => {
    return new Promise((resolve, reject) => {
      const decodedJwt = jwt.decode(token, {complete: true});
      if (!decodedJwt) {
        reject(Error(`Not a valid JWT ${tokenType} token. Unable to decode`));
      }
      const kid = decodedJwt.header.kid;
      const pem = pems[kid];
      if (!pem) {
        reject(Error(`The local key ID (kid) of ${tokenType} does not match public kid`));
      }
      jwt.verify(token, pem, function(err, payload) {
        if (err) {
          reject(Error(`Public signature does not match ${tokenType} token`));
        } else {
          resolve(decodedJwt);
        }
      });
    });
  };

  /**
   * @desc Retrieves a user from Cognito
   * @param {String} cognitoUsername The UUIDv4 Cognito username
   * @param {String} password The password of the Cognito user
   * @return {Promise<object>} a promise that resolves into an object with session key and newPasswordrequired key
   */
  const getAuthenticateUserAsync = (cognitoUsername, password) => {
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
      Username: cognitoUsername,
      Pool: UserPool,
    });
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        {
          Username: cognitoUsername,
          Password: password,
        },
    );
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) =>
          resolve({
            session: result,
            newPasswordRequired: false,
          }),
        onFailure: reject,
        newPasswordRequired: (result) =>
          resolve({
            session: result,
            newPasswordRequired: true,
          }),
      });
    });
  };


  /**
   * @desc Parses a Cognito user session retrieved from AWS Cognito
   * @param {CognitoUserSession} session The Cognito user session
   * @return {object} an Object with idToken, accessToken, refreshToken keys and payload key with id and access sub-keys
   */
  const parseSession = (session) => {
    const idToken = session.getIdToken();
    const accessToken = session.getAccessToken();
    const refreshToken = session.getRefreshToken();
    const payloads = {
      id: idToken.decodePayload(),
      access: accessToken.decodePayload(),
    };
    return {
      session: session,
      idToken: idToken.getJwtToken(),
      accessToken: accessToken.getJwtToken(),
      refreshToken: refreshToken.getToken(),
      payloads: payloads,
    };
  };

  /**
   * @desc Get congito username from parsed session object
   * @param {CognitoUserSession} session The Cognito user session
   * @return {String} The congito username
   */
  const getCognitoUsername = (session) => {
    const parsedSession = parseSession(session);
    return parsedSession.payloads.id['cognito:username'];
  };


  /**
   * @desc Verifies that the ID token and Access token can be trusted
   * @param {CognitoUserSession} session The Cognito user session
   * @return {Promise<Error, String>} A promise that resolves if session is verified
   */
  const verifySession = async (session) => {
    try {
      const parsedSession = parseSession(session);
      const idToken = parsedSession.idToken;
      const accessToken = parsedSession.accessToken;
      await verifyToken(idToken, 'id');
      await verifyToken(accessToken, 'access');
    } catch (err) {
      throw err;
    }
  };


  /**
   * @desc Deletes a Cognito user using admin privilege. Should only be called by server on clean up
   * of user from database
   * @param {String} cognitoUsername The UUIDv4 cognito username to remove
   * @return {Promise<Error, String>} A promise that resolves if user deleted successfully
   */
  const deleteCognitoUser = async (cognitoUsername) => {
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.adminDeleteUser(
          {
            UserPoolId: UserPoolConfig.UserPoolId,
            Username: cognitoUsername,
          },
          (err, result) => (err ? reject(err) : resolve(result)),
      );
    });
  };

  /**
   * @desc Update a Cognito user with admin privilege
   * @param {String} cognitoUsername The UUIDv4 cognito username to update
   * @param {Object} update The update object with fields to update
   * @return {Promise<Error, String>} A promise that resolves if successful
   */
  const updateCognitoUser = async (cognitoUsername, update) => {
    const values = Object.values(update);
    const keys = Object.keys(update);
    const attributeList = [];
    for (let i = 0; i < values.length; ++i) {
      if (cognitoCanUpdate.includes(keys[i])) {
        if (keys[i] == 'username') {
          keys[i] = 'preferred_username';
          const usernameError = validators.isValidUsername(values[i]);
          if (usernameError) {
            throw usernameError;
          }
        }
        attributeList.push({
          Name: keys[i],
          Value: values[i],
        });
      }
    }
    const UpdateAttributes = {
      UserAttributes: attributeList,
      UserPoolId: UserPoolConfig.UserPoolId,
      Username: cognitoUsername,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.adminUpdateUserAttributes(
          UpdateAttributes,
          (err, result) => (err ? reject(err) : resolve(result)),
      );
    });
  };


  /**
   * @desc Update a Cognito user with admin privilege
   * @param {String} username The preferred_username of the new user
   * @param {String} password The unencrypted password (validated by method)
   * @param {String} email An email address (validated by method)
   * @param {String} phoneNumber A valid phone number (validated by method)
   * @return {Promise<Error, String>} A promise that resolves if successful
   */
  const signupUser = async (username, password, email, phoneNumber) => {
    if (!email) {
      throw StaticStrings.UserModelErrors.EmailRequired;
    } else if (!phoneNumber) {
      throw StaticStrings.UserModelErrors.PhoneNumberRequired;
    }
    const passwordError = validators.isValidPassword(password);
    if (passwordError) {
      throw passwordError;
    }
    const usernameError = validators.isValidUsername(username);
    if (usernameError) {
      throw usernameError;
    }
    const attributeList = [];
    attributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
    );
    attributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'phone_number',
          Value: phoneNumber,
        }),
    );
    return new Promise((resolve, reject) => {
      const cognitoUsername = uuid4();
      UserPool.signUp(
          cognitoUsername,
          password,
          attributeList,
          null,
          (err, user) => {
            if (err) {
              reject(err);
            } else {
              updateCognitoUser(cognitoUsername, {
                username: username,
              })
                  .then(() => {
                    return getCognitoSession(cognitoUsername, password);
                  })
                  .then((token) => {
                    resolve(token);
                  })
                  .catch(async (err) => {
                    await deleteCognitoUser(cognitoUsername);
                    reject(err);
                  });
            }
          },
      );
    });
  };

  /**
   * @desc Update a Cognito user with admin privilege
   * @param {String} email An email address (validated by method)
   * @param {String} password The unencrypted password (validated by method)
   * @return {Promise<Error, String>} A promise that resolves if successful
   */
  const signUpEmployee = async (email, password) => {
    if (!email) {
      throw StaticStrings.UserModelErrors.EmailRequired;
    }
    const passwordError = validators.isValidPassword(password);
    if (passwordError) {
      throw passwordError;
    }
    const attributeList = [];
    attributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
    );
    return new Promise((resolve, reject) => {
      const cognitoUsername = uuid4();
      UserPool.signUp(
          cognitoUsername,
          password,
          attributeList,
          null,
          (err, user) => {
            if (err) {
              reject(err);
            } else {
              return getCognitoSession(cognitoUsername, password).then((token) => {
                resolve(token);
              }).catch(async (err) => {
                await deleteCognitoUser(cognitoUsername);
                reject(err);
              });
            }
          },
      );
    });
  };

  const getSignup = (type) => {
    if (type == 'User') {
      return signupUser;
    } else if (type == 'Employee') {
      return signUpEmployee;
    } else {
      throw new Error(`Cognito pool type ${type} does not exist`);
    }
  };


  /**
   * @desc Refreshes a session token
   * @param {object} prevSession Previously parsed session object
   * @return {Promise<Error, String>} A promise that resolves if successful if refreshed
   */
  const refreshSession = async (prevSession) => {
    return new Promise((resolve, reject) => {
      try {
        const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({
          RefreshToken: prevSession.refreshToken,
        });
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
          Username: prevSession.payloads.access.username,
          Pool: UserPool,
        });
        cognitoUser.refreshSession(RefreshToken, (err, session) =>
          err ? reject(err) : resolve(session),
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * @desc Can retrieve a user from cognito using their cognito usernames
   * @param {String} cognitoUsername The cognito username of the person
   * @return {Promise<Error, String>} A promise that resolves to the user from Cognito if successful
   */
  const getUser = (cognitoUsername) => {
    const params = {
      Username: cognitoUsername,
      UserPoolId: UserPoolConfig.UserPoolId,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.adminGetUser(params, (err, result) => {
        return err ? reject(err) : resolve(result);
      });
    });
  };

  /**
   * @desc Can retrieve a user from cognito using email address
   * @param {String} email The email of a potential user
   * @return {Promise<Error, String>} A promise that resolves if successful if refreshed
   */
  const getUserByEmail = (email) => {
    const params = {
      Filter: `email=\"${email}\"`,
      Limit: 1,
      UserPoolId: UserPoolConfig.UserPoolId,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.listUsers(params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.Users[0]);
        }
      });
    });
  };


  /**
   * @desc Retrieve a cognito session for a user using their username and password
   * @param {String} username The username of the user to retrieve
   * @param {String} password The password of the person to login
   * @return {Promise<Error, CognitoSession>} A promise that resolves if successful to a session
   */
  const getCognitoSession = async (username, password) => {
    try {
      const {session, newPasswordRequired} = await getAuthenticateUserAsync(username, password);
      if (newPasswordRequired) {
        throw Error('New password required');
      }
      return session;
    } catch (err) {
      throw err;
    }
  };

  /**
   * @desc Login a user with a valid username and password
   * @param {String} username The username of the user to retrieve
   * @param {String} password The password of the person to login
   * @return {Promise<Error, CognitoSession>} A promise that resolves if successful to a session
   */
  const login = async (username, password) => {
    try {
      const session = await getCognitoSession(username, password);
      verifySession(session);
      return session;
    } catch (err) {
      throw err;
    }
  };


  /**
   * @desc Confirm a user with a code sent to email or SMS
   * @param {CognitoSession} session Unparsed session object
   * @param {String} code The 5 letter code sent to the user through SMS or email
   * @return {Promise<Error, CognitoSession>} A promise that resolves if user is
   * confirmed else returns the error
   */
  const confirmUser = (session, code) => {
    const username = getCognitoUsername(session);
    const params = {
      ClientId: UserPoolConfig.ClientId,
      Username: username,
      ConfirmationCode: code,
      ForceAliasCreation: false,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.confirmSignUp(params, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  };


  /**
   * @desc Initiate workflow for forgotten password
   * @param {String} cognitoUsername Cognito username
   * @return {Promise<Error, CognitoSession>} A promise that resolves if forgotten
   * password workflow initiated for user
   */
  const forgotPassword = (cognitoUsername) => {
    const params = {
      ClientId: UserPoolConfig.ClientId,
      Username: cognitoUsername,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.forgotPassword(params, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  };

  /**
   * @desc Initiate workflow for forgotten password
   * @param {String} cognitoUsername Cognito username
   * @param {String} password the password sent to confirm
   * @param {String} code The 5 letter code sent to the user through SMS or email
   * @return {Promise<Error, CognitoSession>} A promise that resolves if forgotten password
   * confirmed with new password
   */
  const confirmForgotPassword = (cognitoUsername, password, code) => {
    const params = {
      ClientId: UserPoolConfig.ClientId,
      Username: cognitoUsername,
      ConfirmationCode: code,
      Password: password,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.confirmForgotPassword(params, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  };

  /**
   * @desc Change password. First verify the token and then ping Cognito API.
   * @param {String} accessToken Access token sent to user
   * @param {String} oldPassword the old password
   * @param {String} newPassword The new password
   * @return {Promise<Error, CognitoSession>} A promise that resolves if password successfully
   * changed
   */
  const changePassword = async (accessToken, oldPassword, newPassword) => {
    const passwordError = validators.isValidPassword(newPassword);
    if (passwordError) {
      throw passwordError;
    }
    try {
      await verifyToken(accessToken);
    } catch (err) {
      throw err;
    }
    const params = {
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.changePassword(params, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  };

  return {
    verifyToken: verifyToken,
    login: login,
    signup: getSignup(type),
    getCognitoUsername: getCognitoUsername,
    parseSession: parseSession,
    getUserByEmail: getUserByEmail,
    forgotPassword: forgotPassword,
    confirmForgotPassword: confirmForgotPassword,
    deleteCognitoUser: deleteCognitoUser,
    updateCognitoUser: updateCognitoUser,
    changePassword: changePassword,
    confirmUser: confirmUser,
    refreshSession: refreshSession,
    getUser: getUser,
  };
};

const UserCognitoPool = generateCognitoAPI('User');
const EmployeeCognitoPool = generateCognitoAPI('Employee');

export default {
  UserCognitoPool,
  EmployeeCognitoPool,
};

// (async () => {
//   let username = "test";
//   let password = "SomeTest123$";
//   let email = "burrussmatthew@gmail.com";
//   let phone_number = "+15026891822";
//   // sign up users in Cognito
//   let session = await Signup(username, password, email, phone_number);
//   await Login(username,password);
//   await verifySession(session);
//   let cognitoUsername = getCognitoUsername(session);
//   // update email
//   updateCognitoUser(cognitoUsername, { preferred_username: "chuck" }).then(
//     () => {
//       console.log("update worked");
//     }
//   );
//   // delete user
//   await deleteCognitoUser(cognitoUsername, password);
// })();

/**
 * * Things done on Cognito TEst
 * * 1. Added ability to sign in with username, phone number, email, or preferred_alias
 * * 2. After signing in through us preferred is set to the original username
 * * 3. There is a trigger lambda to automatically authenticate email and phone number
 * * 4. Had to update environment with pool ID and client ID
 * * 5. Important: the Cognito username is unique and so is the sub. You cannot change the cognito username. We will make the cognito username
 */
