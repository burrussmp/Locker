// imports
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import _ from 'lodash';

import User from '../models/user.model'
import StaticStrings from '../../config/StaticStrings';

/**
 * @desc Create a token of the user 
 * @return Signed JWT token
*/
const createToken = (user) => {
  const token = jwt.sign({ // create token
    _id: user._id,
    collection: "User"
  }, process.env.JWT_SECRET,
  { algorithm: 'HS256'})
  return token;
};


/**
  * @desc Queries User model matching either email, username, or phone number and returns results
  * @param {Object} req - req.body.login : email, username, or phone number
  * @return Mongoose.model.User
*/
const findUserLogin = async (req) => {
  let login_info = req.body.login;
  let query = {$or: [{ email: login_info }, { username: login_info }, { phone_number: login_info }]};
  return await User.findOne(query)
}

/**
  * @desc Login controller: If successful, provides user a JWT token
  * used for permissions, authorization, authentication, and to stay logged in
  * @param Object req - HTTP request
  * @param Object res - HTTP response
*/
const login = async (req, res) => {
  try {
    if (!req.body.login){
      return res.status('400').json({
        error: StaticStrings.LoginErrors.MissingLogin
      })
    }
    if (!req.body.password){
      return res.status('400').json({
        error: StaticStrings.LoginErrors.MissingPassword
      })
    }
    let user = await findUserLogin(req);
    if (!user)
      return res.status('404').json({
        error: StaticStrings.LoginErrors.UserNotFound
      })

    if (!user.authenticate(req.body.password)) {
      return res.status('401').send({
        error: StaticStrings.LoginErrors.InvalidPassword
      })
    }
    let token = createToken(user);
    res.cookie("t", token, { // put in cookies
      expire: new Date() + 9999
    })
    return res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch (err) {
    return res.status('500').json({
      error: StaticStrings.LoginErrors.ServerError
    })

  }
}

/**
  * @desc Logout controller: Removes JWT token from cookies
  * @param Object req - HTTP request
  * @param Object res - HTTP response
*/
const logout = (req, res) => {
  res.clearCookie("t")
  return res.status('200').json({
    message: StaticStrings.LoggedOutSuccess
  })
}

/**
  * @desc Checks to see if the request is an admin (requires secret)
  * @param Object req - HTTP request
  * @param Object res - HTTP response
*/
const isAdmin = (req) => {
  if (req.headers.authorization && req.headers.authorization === process.env.ADMIN_SECRET){
    return true;
  } else {
    return false;
  }
}

/**
  * @desc (Middleware) Ensure resource that is being acquired is owned by requester
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
  * @param Function next - HTTP Next callback
*/ 
const requireOwnership = (req, res, next) => {
  let authorized =  isAdmin(req) || (req.owner && req.auth && req.owner === req.auth._id)
  if (!authorized) {
    return res.status('403').json({error:StaticStrings.NotOwnerError});
  } else {
    next()
  }
}

/**
  * @desc Checks to see if logged in (decrypt the JWT token)
  * @param Object req - HTTP request
  * @param Object res - HTTP response
  * @param Function next - call back function (next middleware)
*/
const isLoggedIn = expressJwt({
  secret: process.env.JWT_SECRET,
  requestProperty: 'auth',
  algorithms: ['HS256']
});

/**
  * @desc Middleware to check if permissions of request match what is necessary for API call
  * @param Object req - HTTP request
  * @param Object res - res.locals.permissions contains necessary permissions
  * @param Function next - call back function (next middleware)
*/
const checkPermissions = async (req,res,next) => {
  if (!isAdmin(req) && res.locals.permissions.length != 0){
    if (req.auth && req.auth.collection && req.auth._id){
      let permissions;
      if (req.auth.collection === "User"){
        let doc = await User.findById({'_id':req.auth._id}).select('permissions -_id');
        if (!doc){
          return res.status(400).json({error:StaticStrings.TokenIsNotValid})
        }
        permissions = doc.permissions;
      }
      if (!permissions){
        return res.status(403).json({error: StaticStrings.InvalidTokenNotCollection});
      }
      let authorized = req.auth && _.difference(res.locals.permissions,permissions).length == 0;
      if (!authorized) {
        return res.status(403).json({error: StaticStrings.InsufficientPermissionsError});
      }
    } else {
      return res.status(500).json({error: StaticStrings.ServerErrorTokenNotDecrypted});
    }

  }
  next()
}

/**
  * @desc Middleware to ensure logged in if necessary
  * @param Object req - HTTP request
  * @param Object res - res.locals.require_login determines if login necessary
  * @param Function next - call back function (next middleware)
*/
const checkLogin = (req,res,next) => {
  if(!isAdmin(req) && res.locals.require_login){
    let access_token = req.query.access_token;
    if (access_token && !req.headers['authorization']){
      req.headers['authorization'] = `bearer ${access_token}`;
    }
    isLoggedIn(req,res,(err)=>{
      if (err) {
        next(err);
      } else {
        checkPermissions(req,res,next);
      }
    });
  } else {
    checkPermissions(req,res,next)
  }
}

export default {
  login,
  logout,
  checkLogin,
  isAdmin,
  requireOwnership,
  createToken
}
