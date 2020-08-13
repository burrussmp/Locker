import User from '../models/user.model'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import config from './../../config/config'

import {isValidEmail,isValidUsername,isValidPhoneNumber} from '../helpers/validators';
import Roles from '../roles';

const find_user = async (req) => {
  let login_info = req.body.login;
  if (isValidUsername(login_info)){
    user = await User.findOne({'username':login_info})
    if (user) return user;
  }
  if (isValidEmail(login_info)){
    user = await User.findOne({'email':login_info})
    if (user) return user;
  }
  if (isValidPhoneNumber(login_info)){
    user = await User.findOne({'phone_number':login_info})
    if (user) return user;
  }
}

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
    let user = await find_user(req);
    if (!user)
      return res.status('401').json({
        error: "User not found"
      })

    if (!user.authenticate(req.body.password)) {
      return res.status('401').send({
        error: "Invalid password"
      })
    }

    const token = jwt.sign({
      _id: user._id,
      role: Roles.user
    }, config.jwtSecret,
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

const logout = (req, res) => {
  res.clearCookie("t")
  return res.status('200').json({
    message: "Logged out"
  })
}

const requireLogin = expressJwt({
  secret: config.jwtSecret,
  requestProperty: 'auth',
  algorithms: ['HS256']
})

const hasAuthorization = (req, res, next) => {
  const authorized = req.profile && req.auth && req.profile._id == req.auth._id
  if (!(authorized)) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  }
  next()
}

export default {
  login,
  logout,
  requireLogin,
  hasAuthorization
}
