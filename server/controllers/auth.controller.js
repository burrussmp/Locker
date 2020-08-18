import User from '../models/user.model'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import config from './../../config/config'
import _ from 'lodash';

import StaticStrings from '../../config/StaticStrings';

/**
  * @desc Queries User model matching either email, username, or phone number and returns results
  * @param Object req - req.body.login : email, username, or phone number
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
  * @param Object req - Contains login info
  * @param Object res - HTTP response
*/
const login = async (req, res) => {
  try {
    if (!req.body.login){
      return res.status('400').json({
        error: "Missing username, phone number, or email"
      })
    }
    if (!req.body.password){
      return res.status('400').json({
        error: "Missing password"
      })
    }
    let user = await findUserLogin(req);
    if (!user)
      return res.status('404').json({
        error: "User not found"
      })

    if (!user.authenticate(req.body.password)) {
      return res.status('401').send({
        error: "Invalid password"
      })
    }

    const token = jwt.sign({
      _id: user._id,
      permissions: user.permissions
    }, process.env.JWT_SECRET,
    { algorithm: 'HS256'})

    res.cookie("t", token, {
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
    console.log(err)
    return res.status('500').json({
      error: "Sorry, we could not log you in"
    })

  }
}

/**
  * @desc Logout controller: Removes JWT token from cookies
  * @param Object req - Contains login info
  * @param Object res - HTTP response
*/
const logout = (req, res) => {
  res.clearCookie("t")
  return res.status('200').json({
    message: "Logged out"
  })
}

/**
  * @desc Checks to see if the request is an admin (requires secret)
  * @param Object req - Contains login info
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
  * @desc Checks to see if logged in (decrypt the JWT token)
  * @param Object req - Contains login info
  * @param Object res - HTTP response
  * @param Function next - Go to next middleware
*/
const isLoggedIn = expressJwt({
  secret: process.env.JWT_SECRET,
  requestProperty: 'auth',
  algorithms: ['HS256']
});

/**
  * @desc Middleware to check if permissions of request match what is necessary for API call
  * @param Object req - Contains login info
  * @param Object res - res.locals.permissions contains necessary permissions
  * @param Function next - Go to next middleware
*/
const checkPermissions = (req,res,next) => {
  if (!isAdmin(req) && res.locals.permissions.length != 0){
    let authorized = req.auth && _.difference(res.locals.permissions,req.auth.permissions).length == 0;
    if (!authorized) {
      return res.status(403).json({
        error: StaticStrings.ErrorInsufficientPermissions
      })
    }
  }
  next()
}

/**
  * @desc Middleware to ensure logged in if necessary
  * @param Object req - Contains login info
  * @param Object res - res.locals.require_login determines if login necessary
  * @param Function next - Go to next middleware
*/
const checkLogin = (req,res,next) => {
  if(!isAdmin(req) && res.locals.require_login){
    isLoggedIn(req,res,(err)=>{
      if (err) next(err);
      checkPermissions(req,res,next);
    });
  } else {
    checkPermissions(req,res,next)
  }
}

export default {
  login,
  logout,
  checkLogin,
  isAdmin
}
