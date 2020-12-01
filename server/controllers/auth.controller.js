/* eslint-disable max-len */
// imports
import jwt from 'jsonwebtoken';

import User from '@server/models/user.model';
import Employee from '@server/models/employee.model';
import RBAC from '@server/models/rbac.model';

import CognitoAPI from '@server/services/Cognito.services';
import errorHandler from '@server/services/dbErrorHandler';

import StaticStrings from '@config/StaticStrings';
import config from '@config/config';

const ALLOWED_COGNITO_POOL_TYPES = ['Employee', 'User'];
/**
 * @desc Retrieves the appropriate Cognito Service
 * @param {String} cognitoPoolType The cognito pool type
 * @return {Object} Returns the cognito service interface
 */
const getCognitoService = (cognitoPoolType) => {
  if (cognitoPoolType === 'Employee') {
    return CognitoAPI.EmployeeCognitoPool;
  } else if (cognitoPoolType === 'User') {
    return CognitoAPI.UserCognitoPool;
  } else {
    return res.status(500).json({error: `Server Error: res.locals.cognitoPoolType equal to ${cognitoPoolType}. Must be equal to one of ${ALLOWED_COGNITO_POOL_TYPES}`});
  }
};

/**
 * @desc Retrieve access token from either URL query parameter
 * or Authorization header
 * @param {Request} req HTTP request object
 * @return {String} Returns the access token
 */
const retrieveAccessToken = (req) => {
  let accessToken;
  if (req.headers['authorization']) {
    accessToken = req.headers['authorization'].split(' ')[1];
  }
  if (req.query.access_token) {
    accessToken = req.query.access_token;
  }
  return accessToken;
};

/**
 * @desc Verify and send an appropriate HTTP response to
 * verify a token in the query parameter `token`
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @return {Promise<Response>} Sends 200 if verified, else 401
 */
const verifyToken = (req, res) => {
  const token = req.query.token;
  const CognitoServices = getCognitoService(res.locals.cognitoPoolType);
  return CognitoServices.verifyToken(token, 'access').then(() => {
    return res.status(200).send();
  }).catch((err) => {
    return res.status(401).json({error: err});
  });
};

/**
 * @desc Login either an employee or a user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @return {Promise<Response>} Sends 200 if verified, else 401
 */
const login = async (req, res) => {
  try {
    if (!req.body.login) {
      return res.status('400').json({error: StaticStrings.LoginErrors.MissingLogin});
    }
    if (!req.body.password) {
      return res.status('400').json({error: StaticStrings.LoginErrors.MissingPassword});
    }
    const CognitoServices = getCognitoService(res.locals.cognitoPoolType);
    return CognitoServices.login(req.body.login, req.body.password).then(async (session) => {
      res.cookie('t', session, {expire: new Date() + 9999});
      const cognitoUsername = CognitoServices.getCognitoUsername(session);
      let person;
      if (res.locals.cognitoPoolType === 'Employee') {
        person = await Employee.findOne({cognito_username: cognitoUsername});
      } else {
        person = await User.findOne({cognito_username: cognitoUsername});
      }
      if (!person) {
        return res.status('500').json({error: 'Server Error: User pool not synced with Mongoose DB'});
      }
      const parsedSession = CognitoServices.parseSession(session);
      // let id_payload = parsedSession.payloads.id;
      // if (process.env.NODE_ENV == "production" &&!id_payload.phone_number_verified) {
      //   return res.status("401").json({error: "Phone number not verified.",});
      // }
      return res.json({
        access_token: parsedSession.accessToken,
        id_token: parsedSession.idToken,
        refresh_token: parsedSession.refreshToken,
        _id: person._id,
      });
    }).catch((err) => {
      return res.status('401').json({error: errorHandler.getErrorMessage(err)});
    });
  } catch (err) {
    return res.status('500').json({error: StaticStrings.LoginErrors.ServerError});
  }
};

/**
 * @desc Logout either an employee or a user by clearing the cookie
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @return {Promise<Response>} Sends 200 if verified, else 401
 */
const logout = (req, res) => {
  res.clearCookie('t');
  return res.status('200').json({message: StaticStrings.LoggedOutSuccess});
};

/**
 * @desc Check if either has the admin secret token or is an admin role
 * @param {Request} req HTTP request object
 * @return {Boolean} True if admin else false
 */
const isAdmin = (req) => {
  const authorization = retrieveAccessToken(req);
  const isAdminRole = req.auth && req.auth.level == 0 && req.auth.role == 'admin';
  return authorization && authorization === process.env.ADMIN_SECRET || isAdminRole;
};

/**
 * @desc Enforce ownership to see if requester is the same as the object requesting to update
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @param {Function} next The next middleware function to execute
 * @return {Promise<Response>} Returns 403 if not owner, else continues to next middleware
 */
const requireOwnership = (req, res, next) => {
  const authorized = isAdmin(req) || (req.owner && req.auth && req.owner == req.auth._id);
  if (!authorized) {
    return res.status('403').json({error: StaticStrings.NotOwnerError});
  } else {
    next();
  }
};

/**
 * @desc Check if requester has the appropriate permissions to call API
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @param {Function} next The next middleware function to execute
 * @return {Promise<Response>} Returns 400 if invalid token else continues to next middlware
 */
const checkPermissions = async (req, res, next) => {
  if (!isAdmin(req) && res.locals.permissions.length != 0) {
    if (req.auth && req.auth.cognito_username) {
      let person;
      if (res.locals.cognitoPoolType === 'User') {
        person = await User.findOne({cognito_username: req.auth.cognito_username}).select('permissions _id');
      } else if (res.locals.cognitoPoolType === 'Employee') {
        person = await Employee.findOne({cognito_username: req.auth.cognito_username}).select('permissions organization _id');
      } else {
        return res.status(500).json({error: `Server Error: res.locals.congitoType is not ${ALLOWED_AUTHORIZATION_PERSONS}`});
      }
      if (!person) {
        return res.status(400).json({error: StaticStrings.TokenIsNotValid});
      }
      const roleBasedAccessControl = await RBAC.findById(person.permissions);
      if (!roleBasedAccessControl.hasPermission(res.locals.permissions)) {
        return res.status(403).json({error: StaticStrings.InsufficientPermissionsError});
      }
      req.auth.organization = person.organization;
      req.auth._id = person._id.toString();
      req.auth.level = roleBasedAccessControl.level;
    } else {
      return res.status(500).json({error: StaticStrings.ServerErrorTokenNotDecrypted});
    }
  }
  next();
};

/**
 * @desc Check if access token required and verified
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @param {Function} next The next middleware function to execute
 * @return {Promise<Response>} Returns 401 if missing / unverified token
 */
const checkAccessToken = (req, res, next) => {
  const accessToken = retrieveAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({error: StaticStrings.UnauthorizedMissingTokenError});
  }
  const decodedToken = jwt.decode(accessToken, {complete: true});
  if (!decodedToken) {
    return res.status(401).json({error: `Not a valid JWT access token. Unable to decode`});
  }
  if (decodedToken.payload.client_id == config.aws_config.aws_user_pool_client_id) {
    res.locals.cognitoPoolType = 'User';
  } else if (decodedToken.payload.client_id == config.aws_config.aws_employee_pool_client_id) {
    res.locals.cognitoPoolType = 'Employee';
  } else {
    return res.status(500).json({error: 'Server Error: Unknown user pool client ID in access token'});
  }
  const CognitoServices = getCognitoService(res.locals.cognitoPoolType);
  CognitoServices.verifyToken(accessToken, 'access')
      .then((decodedToken) => {
        req.auth = {cognito_username: decodedToken.payload.username};
        checkPermissions(req, res, next);
      })
      .catch((err) => {
        return res.status(401).json({error: err.message});
      });
};

/**
 * @desc Check if Login required. If not required, continue to middleware. Otherwise, execute
 * the appropriate authorization pipeline
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @param {Function} next The next middleware function to execute
 * @return {Promise<Response>}
 */
const checkLogin = (req, res, next) => {
  if (res.locals.require_admin) {
    if (isAdmin(req)) {
      next();
    } else {
      return res.status(401).json({error: StaticStrings.UnauthorizedAdminRequired});
    }
  } else {
    if (!isAdmin(req) && res.locals.require_login) {
      checkAccessToken(req, res, next);
    } else {
      next();
    }
  }
};

/**
 * @desc Begin forgot password workflow
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @return {Promise<Response>}
 */
const forgotPassword = async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({error: StaticStrings.AuthErrors.ForgotPasswordMissingEmail});
  } else {
    const CognitoServices = getCognitoService(res.locals.cognitoPoolType);
    try {
      const person = await CognitoServices.getUserByEmail(email);
      if (!person) {
        return res.status(404).json({error: StaticStrings.AuthErrors.UserNotFoundWithEmail});
      }
      const cognitoUsername = person.Username;
      await CognitoServices.forgotPassword(cognitoUsername);
      return res.status(200).json({cognito_username: cognitoUsername});
    } catch (err) {
      return res.status(500).json({error: err.message});
    }
  }
};

/**
 * @desc Confirm a forgotten password
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP request object
 * @return {Promise<Response>}
 */
const confirmForgotPassword = async (req, res) => {
  const cognitoUsername = req.body.cognito_username;
  const confirmationCode = req.body.confirmation_code;
  const newPassword = req.body.new_password;
  if (!newPassword || !cognitoUsername || !confirmationCode) {
    return res.status(400).json({error: StaticStrings.AuthErrors.ConfirmPasswordMissingFields});
  } else {
    const CognitoServices = getCognitoService(res.locals.cognitoPoolType);
    try {
      await CognitoServices.confirmForgotPassword(cognitoUsername, newPassword, confirmationCode);
      return res.status(200).json({message: 'Password updated'});
    } catch (err) {
      return res.status(400).json({error: err.message});
    }
  }
};

/**
 * @desc Begin the auth process for an API call
 * @param {Array} permissions Required permissions for API call
 * @param {Boolean} requireLogin Whether or not this call requires being logged in
 * @return {Promise<Response>} an HTTP response for API call
 */
const authorize = (permissions, requireLogin = true) => {
  return (req, res, next) => {
    res.locals.require_login = requireLogin;
    res.locals.permissions = permissions;
    res.locals.cognitoPoolType = req.route.path.includes('ent') ? 'Employee' : 'User'; // default can be overridden
    checkLogin(req, res, next);
  };
};

export default {
  authorize,
  login,
  logout,
  checkLogin,
  isAdmin,
  requireOwnership,
  verifyToken,
  forgotPassword,
  confirmForgotPassword,
  ALLOWED_COGNITO_POOL_TYPES,
};
