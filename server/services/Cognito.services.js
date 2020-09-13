"use strict";
//imports
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const { v4: uuid4 } = require("uuid");
global.fetch = require("node-fetch");

import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import aws from "aws-sdk";
import config from "../../config/config";

// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: config.aws_config.aws_s3_region,
});

// Configure User Pool
const CognitoServiceProvider = new aws.CognitoIdentityServiceProvider();
const UserPoolConfig = {
  UserPoolId: config.aws_config.aws_user_pool_id,
  ClientId: config.aws_config.aws_user_pool_client_id,
};
const UserPoolRegion = config.aws_config.aws_user_pool_region;
const UserPool = new AmazonCognitoIdentity.CognitoUserPool(UserPoolConfig);

// get the public key to verify JWT token signatures
let pems = {};
fetch(
  `https://cognito-idp.${UserPoolRegion}.amazonaws.com/${UserPoolConfig.UserPoolId}/.well-known/jwks.json`
)
  .then((res) => res.json())
  .then((body) => {
    let keys = body["keys"];
    for (let i = 0; i < keys.length; i++) {
      //Convert each key to PEM
      let key_id = keys[i].kid;
      let modulus = keys[i].n;
      let exponent = keys[i].e;
      let key_type = keys[i].kty;
      let jwk = { kty: key_type, n: modulus, e: exponent };
      let pem = jwkToPem(jwk);
      pems[key_id] = pem;
    }
  });

/**
 * * Helper Functions
 */

/**
 * @desc Verifies a JWT token according to public signature and returns a promise.
 * @param String token : Token to verify
 * @param String tokenType : Useful in debugging
 * @return a promise
 */
const verifyCognitoToken = (token, tokenType) => {
  return new Promise((resolve, reject) => {
    let decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      reject(`Not a valid JWT ${tokenType} token. Unable to decode`);
    }
    let kid = decodedJwt.header.kid;
    let pem = pems[kid];
    if (!pem) {
      reject(
        `The local key ID (kid) of ${tokenType} does not match public kid`
      );
    }
    jwt.verify(token, pem, function (err, payload) {
      if (err) {
        reject(`Public signature does not match ${tokenType} token`);
      } else {
        resolve(token);
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
    }
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
const parseCognitoUserSession = (session) => {
  let idToken = session.getIdToken();
  let accessToken = session.getAccessToken();
  let refreshToken = session.getRefreshToken();
  let payloads = {
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
  let parsed_session = parseCognitoUserSession(session)
  return parsed_session.payloads.id["cognito:username"];
};

/**
 * @desc Verifies that the ID token and Access token can be trusted
 * @param Object session : The parsed Cognito user session
 * @return A promise that resolves if successful
 */
const verifySession = async (session) => {
  try {
    let parsedSession = parseCognitoUserSession(session);
    let idToken = parsedSession.idToken;
    let accessToken = parsedSession.accessToken;
    await verifyCognitoToken(idToken, "id");
    await verifyCognitoToken(accessToken, "access");
  } catch (err) {
    throw new Error(err);
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
      (err, result) => (err ? reject(err) : resolve(result))
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
  let attributeList = [];
  for (let i = 0; i < values.length; ++i) {
    attributeList.push({
      Name: keys[i],
      Value: values[i],
    });
  }
  const UpdateAttributes = {
    UserAttributes: attributeList,
    UserPoolId: UserPoolConfig.UserPoolId,
    Username: cognitoUsername,
  };
  return new Promise((resolve, reject) => {
    CognitoServiceProvider.adminUpdateUserAttributes(
      UpdateAttributes,
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
};

/**
* @desc Create a new user in Cognito Pool
* @param String : username : the preferred_username of the new user
* @param String : password : the unencrypted password
* @param String : email : A valid email address
* @param String : phone_number : A valid phone number
* @return A promise that resolves if successful to a session
*/
const Signup = (username, password, email, phone_number) => {
  let attributeList = [];
  attributeList.push(
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "email",
      Value: email,
    })
  );
  attributeList.push(
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "phone_number",
      Value: phone_number,
    })
  );
  return new Promise((resolve, reject) => {
    let cognitoUsername = uuid4();
    UserPool.signUp(
      cognitoUsername,
      password,
      attributeList,
      null,
      (err, user) => {
        if (err) {
          reject(err);
        } else {
          return updateCognitoUser(cognitoUsername, {
            preferred_username: username,
          })
            .then(() => {
              return getCognitoSession(cognitoUsername,password);
            })
            .then(token=>{
              resolve(token);
            })
            .catch(async (err) => {
              await deleteCognitoUser(cognitoUsername);
              reject(err);
            });
        }
      }
    );
  });
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
      let cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: prevSession.payloads.access.username,
        Pool: UserPool,
      });
      cognitoUser.refreshSession(RefreshToken, (err, session) =>
        err ? reject(err) : resolve(session)
      );
    } catch (err) {
      reject(err);
    }
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
    let { session, newPasswordRequired } = await getAuthenticateUserAsync(
      username,
      password
    );
    if (newPasswordRequired) {
      throw new Error("New password required");
    }
    return session;
  } catch (err) {
    console.log(err);
  }
};

/**
 * @desc Login
 * @param String : username
 * @param String : password
 * @return Promise that resolves to session token if it worked
 */
const Login = async (username,password) => {
  try {
    let session = await getCognitoSession(username,password);
    verifySession(session);
    return session;
  } catch(err) {
    throw new Error(err);
  }
}

export default {
  Login,
  Signup,
  verifySession,
  refreshSession,
  updateCognitoUser,
  deleteCognitoUser,
  getCognitoUsername
}



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
