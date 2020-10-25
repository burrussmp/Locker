// imports
import _ from "lodash";
import User from "../models/user.model";
import RBAC from "../models/rbac.model";
import StaticStrings from "../../config/StaticStrings";
import CognitoServices from "../services/Cognito.services";
import dbErrorHandler from "../services/dbErrorHandler";

/**
 * @desc Helper function to get access token from query param or Authorization header
 * @param Object : HTTP request
 * @return The access token or undefined if not found
 */
const retrieveAccessToken = (req) => {
  let access_token;
  if (req.headers["authorization"]) {
    access_token = req.headers["authorization"].split(" ")[1];
  }
  if (req.query.access_token) {
    access_token = req.query.access_token;
  }
  return access_token;
};

/**
 * @desc Login controller: If successful, provides user a JWT token
 * used for permissions, authorization, authentication, and to stay logged in
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 */
const verifyToken = (req, res) => {
  let token = req.query.token;
  return CognitoServices.verifyToken(token, "access")
    .then((decoded_token) => {
      return res.status(200).send();
    })
    .catch((err) => {
      return res.status(401).json({ error: err });
    });
};

/**
 * @desc Login controller: If successful, provides user a JWT token
 * used for permissions, authorization, authentication, and to stay logged in
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 */
const login = async (req, res) => {
  try {
    if (!req.body.login) {
      return res.status("400").json({
        error: StaticStrings.LoginErrors.MissingLogin,
      });
    }
    if (!req.body.password) {
      return res.status("400").json({
        error: StaticStrings.LoginErrors.MissingPassword,
      });
    }
    return CognitoServices.Login(req.body.login, req.body.password)
      .then(async (session) => {
        res.cookie("t", session, {
          // put in cookies
          expire: new Date() + 9999,
        });
        let cognito_username = CognitoServices.getCognitoUsername(session);
        let user = await User.findOne({ cognito_username: cognito_username });
        if (!user) {
          return res.status("500").json({
            error: "Server Error: User pool not synced with Mongoose DB",
          });
        }
        let parsed_session = CognitoServices.parseSession(session);
        let id_payload = parsed_session.payloads.id;
        if (
          process.env.NODE_ENV == "production" &&
          !id_payload.phone_number_verified
        ) {
          return res.status("401").json({
            error: "Phone number not verified.",
          });
        }
        return res.json({
          access_token: parsed_session.accessToken,
          id_token: parsed_session.idToken,
          refresh_token: parsed_session.refreshToken,
          _id: user._id,
        });
      })
      .catch((err) => {
        return res.status("401").json({
          error: dbErrorHandler.getErrorMessage(err),
        });
      });
  } catch (err) {
    return res.status("500").json({
      error: StaticStrings.LoginErrors.ServerError,
    });
  }
};

/**
 * @desc Logout controller: Removes JWT token from cookies
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 */
const logout = (req, res) => {
  res.clearCookie("t");
  return res.status("200").json({
    message: StaticStrings.LoggedOutSuccess,
  });
};

/**
 * @desc Checks to see if the request is an admin (requires secret)
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 */
const isAdmin = (req) => {
  const authorization = retrieveAccessToken(req);
  return authorization && authorization === process.env.ADMIN_SECRET;
};

/**
 * @desc (Middleware) Ensure resource that is being acquired is owned by requester
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 * @param Function next - HTTP Next callback
 */
const requireOwnership = (req, res, next) => {
  let authorized =
    isAdmin(req) || (req.owner && req.auth && req.owner == req.auth._id);
  if (!authorized) {
    return res.status("403").json({ error: StaticStrings.NotOwnerError });
  } else {
    next();
  }
};

/**
 * @desc Middleware to check if permissions of request match what is necessary for API call
 * @param Object req - HTTP request
 * @param Object res - res.locals.permissions contains necessary permissions
 * @param Function next - call back function (next middleware)
 */
const checkPermissions = async (req, res, next) => {
  if (!isAdmin(req) && res.locals.permissions.length != 0) {
    if (req.auth && req.auth.cognito_username) {
      let user = await User.findOne({cognito_username: req.auth.cognito_username}).select("permissions _id");
      let role_based_access_control = await RBAC.findById(user.permissions);
      if (!user) {
        return res.status(400).json({ error: StaticStrings.TokenIsNotValid });
      }
      if (!role_based_access_control.hasPermission(res.locals.permissions)) {
        return res.status(403).json({ error: StaticStrings.InsufficientPermissionsError });
      }
      req.auth._id = user._id.toString();
    } else {
      return res
        .status(500)
        .json({ error: StaticStrings.ServerErrorTokenNotDecrypted });
    }
  }
  next();
};

/**
 * @desc Helper function to extract access_token from either query parameter or from Authorization header
 * and verify that the token is valid
 * @param Object req - HTTP request
 * @param Object res - res.locals.require_login determines if login necessary
 * @param Function next - call back function (next middleware)
 */
const checkAccessToken = (req, res, next) => {
  let access_token = retrieveAccessToken(req);
  if (!access_token) {
    return res
      .status(401)
      .json({ error: StaticStrings.UnauthorizedMissingTokenError });
  }
  CognitoServices.verifyToken(access_token, "access")
    .then((decoded_token) => {
      req.auth = {
        cognito_username: decoded_token.payload.username,
      };
      checkPermissions(req, res, next);
    })
    .catch((err) => {
      return res.status(401).json({ error: err });
    });
};

/**
 * @desc Middleware to ensure logged in if necessary
 * @param Object req - HTTP request
 * @param Object res - res.locals.require_login determines if login necessary
 * @param Function next - call back function (next middleware)
 */
const checkLogin = (req, res, next) => {
  if (res.locals.require_admin){
    if (isAdmin(req)){
      next();
    } else {
      return res.status(401).json({error: StaticStrings.UnauthorizedAdminRequired});
    }
  } else {
    if (!isAdmin(req) && res.locals.require_login) {
      checkAccessToken(req, res, next);
    } else {
      checkPermissions(req, res, next);
    }
  }
};

/**
 * @desc Sends reset password code to User's email
 * @param {Request} req : HTTP request
 * @param {Response} res : HTTP response
 * @return A 400 if email missing or something goes wrong else
 */
const forgotPassword = async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res
      .status(400)
      .json({ error: StaticStrings.AuthErrors.ForgotPasswordMissingEmail });
  } else {
    try {
      const user = await CognitoServices.getUserByEmail(email);
      if (!user){
        return res.status(404).json({error: StaticStrings.AuthErrors.UserNotFoundWithEmail})
      }
      const cognito_username = user.Username;
      await CognitoServices.forgotPassword(cognito_username);
      return res.status(200).json({cognito_username: cognito_username});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

/**
 * @desc Confirm a forgotten password
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 */
const confirmForgotPassword = async (req, res) => {
  const cognito_username = req.body.cognito_username;
  const confirmation_code = req.body.confirmation_code;
  const new_password = req.body.new_password;
  if (!new_password || !cognito_username || !confirmation_code) {
    return res
      .status(400)
      .json({ error: StaticStrings.AuthErrors.ConfirmPasswordMissingFields });
  } else {
    try {
      await CognitoServices.confirmForgotPassword(
        cognito_username,
        new_password,
        confirmation_code
      );
      return res.status(200).json({ message: "Password updated" });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};

export default {
  login,
  logout,
  checkLogin,
  isAdmin,
  requireOwnership,
  checkAccessToken,
  verifyToken,
  forgotPassword,
  confirmForgotPassword,
};
