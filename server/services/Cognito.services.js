'use strict';
// imports
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const {v4: uuid4} = require('uuid');
global.fetch = require('node-fetch');

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import aws from 'aws-sdk';
import config from '../../config/config';
import validators from '../services/validators';
import StaticStrings from '../../config/StaticStrings';

// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: config.aws_config.aws_s3_region,
});

const generateCognitoAPI = (type) => {
  // Configure User Pool
  const CognitoServiceProvider = new aws.CognitoIdentityServiceProvider();
  let UserPoolConfig; let UserPoolRegion; let UserPool;
  let __cognito_can_update__;
  if (type == 'user') {
    UserPoolConfig = {
      UserPoolId: config.aws_config.aws_user_pool_id,
      ClientId: config.aws_config.aws_user_pool_client_id,
    };
    UserPoolRegion = config.aws_config.aws_user_pool_region;
    UserPool = new AmazonCognitoIdentity.CognitoUserPool(UserPoolConfig);
    __cognito_can_update__ = ['username', 'email', 'phone_number'];
  } else if (type == 'employee') {
    UserPoolConfig = {
      UserPoolId: config.aws_config.aws_employee_pool_id,
      ClientId: config.aws_config.aws_employee_pool_client_id,
    };
    UserPoolRegion = config.aws_config.aws_employee_pool_region;
    UserPool = new AmazonCognitoIdentity.CognitoUserPool(UserPoolConfig);
    __cognito_can_update__ = ['email'];
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
          const key_id = keys[i].kid;
          const modulus = keys[i].n;
          const exponent = keys[i].e;
          const key_type = keys[i].kty;
          const jwk = {kty: key_type, n: modulus, e: exponent};
          const pem = jwkToPem(jwk);
          pems[key_id] = pem;
        }
      });

  /**
   * @desc Verifies a JWT token according to public signature and returns a promise.
   * @param String token : Token to verify
   * @param String tokenType : Useful in debugging
   * @return a promise
   */
  const verifyToken = (token, tokenType) => {
    return new Promise((resolve, reject) => {
      const decodedJwt = jwt.decode(token, {complete: true});
      if (!decodedJwt) {
        reject(`Not a valid JWT ${tokenType} token. Unable to decode`);
      }
      const kid = decodedJwt.header.kid;
      const pem = pems[kid];
      if (!pem) {
        reject(
            `The local key ID (kid) of ${tokenType} does not match public kid`,
        );
      }
      jwt.verify(token, pem, function(err, payload) {
        if (err) {
          console.log(err);
          reject(`Public signature does not match ${tokenType} token`);
        } else {
          resolve(decodedJwt);
        }
      });
    });
  };

  /**
   * @desc Retrieves a session token
   * @param String cognitoUsername : The UUIDv4 Cognito username
   * @param String password : The password of the Cognito user
   * @return a promise that resolves into an object with session key and newPasswordrequired key
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
   * @param CognitoUserSession session : The Cognito user session
   * @return an Object with idToken, accessToken, refreshToken keys and payload key with id and access sub-keys
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
   * @desc Get the Cognito username from a parsed session object
   */
  const getCognitoUsername = (session) => {
    const parsed_session = parseSession(session);
    return parsed_session.payloads.id['cognito:username'];
  };

  /**
   * @desc Verifies that the ID token and Access token can be trusted
   * @param Object session : The parsed Cognito user session
   * @return A promise that resolves if successful
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
   * @param String : cognitoUsername : The UUIDv4 cognito username to remove
   * @return A promise that resolves if successful
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
   * @desc Update a Cognito user with admin privelege
   * @param String : cognitoUsername : The UUIDv4 cognito username to remove
   * @param String : cognitoUsername : The UUIDv4 cognito username to remove
   * @return A promise that resolves if successful
   */
  const updateCognitoUser = async (cognitoUsername, update) => {
    const values = Object.values(update);
    const keys = Object.keys(update);
    const attributeList = [];
    for (let i = 0; i < values.length; ++i) {
      if (__cognito_can_update__.includes(keys[i])) {
        if (keys[i] == 'username') {
          keys[i] = 'preferred_username';
          const username_error = validators.isValidUsername(values[i]);
          if (username_error) {
            throw username_error;
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
   * @desc Create a new user (User) in Cognito Pool
   * @param String : username : the preferred_username of the new user
   * @param String : password : the unencrypted password
   * @param String : email : A valid email address
   * @param String : phone_number : A valid phone number
   * @return A promise that resolves if successful to a session
   */
  const signup_user = async (username, password, email, phone_number) => {
    if (!email) {
      throw StaticStrings.UserModelErrors.EmailRequired;
    } else if (!phone_number) {
      throw StaticStrings.UserModelErrors.PhoneNumberRequired;
    }
    const password_error = validators.isValidPassword(password);
    if (password_error) {
      throw password_error;
    }
    const username_error = validators.isValidUsername(username);
    if (username_error) {
      throw username_error;
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
          Value: phone_number,
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
   * @desc Create a new employee in Cognito Pool
   * @param String : email : A valid email address
   * @param String : password : the unencrypted password
   * @return A promise that resolves if successful to a session
   */
  const signup_employee = async (email, password) => {
    if (!email) {
      throw StaticStrings.UserModelErrors.EmailRequired;
    }
    const password_error = validators.isValidPassword(password);
    if (password_error) {
      throw password_error;
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
    if (type == 'user') {
      return signup_user;
    } else if (type == 'employee') {
      return signup_employee;
    } else {
      throw new Error(`Cognito pool type ${type} does not exist`);
    }
  };

  /**
   * @desc Refreshes a session token
   * @param String : prevSession : Previously parsed session object
   * @return A promise that resolves if successful to a parsed session object
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
   * @param {string} cognito_username : The cognito username of the person
   * @return A promise that resolves to the retrieved user
   */
  const getUser = (cognito_username) => {
    const params = {
      Username: cognito_username,
      UserPoolId: UserPoolConfig.UserPoolId,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.adminGetUser(params, (err, result) => {
        return err ? reject(err) : resolve(result);
      });
    });
  };

  /**
   * @desc Retrieve a user from Cognito by querying for their email
   * @param {string} email : the email of the user
   * of the user to retrieve from Cognito
   * @return A promise that resolve for the user and retrieves all
   * of their attributes on a match
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
   * @desc See if user logged in
   * @param String : username : can be username, phone number, or email, or preferred_username
   * @param String : password : unencrypted password
   * @return A promise that resolves if successful to a session
   */
  const getCognitoSession = async (username, password) => {
    try {
      const {session, newPasswordRequired} = await getAuthenticateUserAsync(
          username,
          password,
      );
      if (newPasswordRequired) {
        throw 'New password required';
      }
      return session;
    } catch (err) {
      throw err;
    }
  };

  /**
   * @desc Login
   * @param login : username
   * @param String : password
   * @return Promise that resolves to session token if it worked
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
   * @param String : session : Unparsed session
   * @param String : code : Code that the user was sent
   * @return Promise that resolves if user is confirmed
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
   * @desc Resets password if forgotten by sending a temporary password
   * @param String : cognito_username : Cognito username
   * @return Promise that resolves if user is confirmed
   */
  const forgotPassword = (cognito_username) => {
    const params = {
      ClientId: UserPoolConfig.ClientId,
      Username: cognito_username,
    };
    return new Promise((resolve, reject) => {
      CognitoServiceProvider.forgotPassword(params, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  };

  /**
   * @desc Confirm the forgotten password by entering temporary and code
   * @param String : cognito_username : The cognito username
   * @param String : password : the password sent to confirm
   * @param String : code : The code sent to verify login
   * @return Promise that resolves if password forgot has been confirmed
   */
  const confirmForgotPassword = (cognito_username, password, code) => {
    const params = {
      ClientId: UserPoolConfig.ClientId,
      Username: cognito_username,
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
   * @param String : access_token : Access token sent to user
   * @param String : old_password :  The old password
   * @param String : password : A valid new password
   * @return Promise that resolves if the password has been changed
   */
  const changePassword = async (access_token, old_password, password) => {
    const password_error = validators.isValidPassword(password);
    if (password_error) {
      throw password_error;
    }
    try {
      await verifyToken(access_token);
    } catch (err) {
      throw err;
    }
    const params = {
      AccessToken: access_token,
      PreviousPassword: old_password,
      ProposedPassword: password,
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

const UserCognitoPool = generateCognitoAPI('user');
const EmployeeCognitoPool = generateCognitoAPI('employee');

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
