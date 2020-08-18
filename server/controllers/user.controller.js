"use strict";
// imports
import User from '../models/user.model'
import errorHandler from '../services/dbErrorHandler'
import authCtrl from './auth.controller';
import StaticStrings from '../../config/StaticStrings';
import permissions from '../permissions'
import file_upload from '../services/S3.services';
import _ from 'lodash';
import fs from 'fs';
/**
  * @desc Filter user for data
  * @param Object User query result
*/ 
const filter_user = (user) => {
  user.hashed_password = undefined;
  user.salt = undefined;
  user.phone_number = undefined;
  user.email = undefined;
  user.permissions = undefined;
  user.gender = undefined;
  user.__v = undefined;
  return user
}

/**
  * @desc creates a new User
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const create = async (req, res) => {
  let user = new User(req.body);
  try {
    await user.save()
    return res.status(200).json({
      message: StaticStrings.SuccessSignedUp
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

/**
  * @desc Middleware: Query a user by the path parameter ID
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const userByID = async (req, res, next, id) => {
  try {
    let user = await User.findById(id)
      .populate('following', '_id name')
      .populate('followers', '_id name')
      .exec()
    if (!user)
      return res.status('404').json({
        error: StaticStrings.ErrorUserNotFound
      })
    req.profile = user
    next()
  } catch (err) {
    return res.status('404').json({
      error: StaticStrings.ErrorUserNotFound
    })
  }
}

/**
  * @desc Controller to filter user data
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const read = (req, res) => {
  req.profile = filter_user(req.profile);
  return res.json(req.profile)
}

/**
  * @desc Controller to list all users
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const list = async (req, res) => {
  try {
    let users = await User.find().select('_id username updatedAt createdAt')
    res.json(users)
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

/**
  * @desc Controller to update specific user
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const update = async (req, res) => {
    // check if any invalid fields (bad request)
    let fields_that_can_be_updated = [
      'first_name',
      'phone_number',
      'last_name',
      'username',
      'gender',
      'email',
      'date_of_birth',
      'about',
      'password',
      'old_password'
    ]
    let update_fields = Object.keys(req.body);
    let allowedToEdit = _.isEqual(_.intersection(_.sortBy(fields_that_can_be_updated),_.sortBy(update_fields)),_.sortBy(update_fields));
    if(!allowedToEdit){
      let invalid_fields = _.difference(update_fields,fields_that_can_be_updated)
      return res.status(400).json({error:`Cannot update fields: ${invalid_fields}`})
    }

    let query = {'_id' : req.params.userId};
    try {
      let user = await User.findOneAndUpdate(query, req.body,{new:true,runValidators:true});
      return res.status(200).json(user)
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
}

const remove = async (req, res) => {
  try {
    let user = req.profile
    let deletedUser = await user.remove()
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    res.json(deletedUser)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}


const getProfilePhoto = (req, res) => {
  if (req.profile.profile_photo.key){
    let profile_photo = req.profile.profile_photo;
    let s3_file = file_upload.getFileS3(profile_photo.key);
    s3_file.on('httpHeaders', function (statusCode, headers) {
      res.setHeader('Content-Length', headers['content-length']);
      res.setHeader('Content-Type', profile_photo.mimetype);
      this.response.httpResponse.createUnbufferedStream()
          .pipe(res);
    })
  } else {
    fs.createReadStream(process.cwd()+'/client/assets/images/profile-pic.png').pipe(res)
  }
}

const removeProfilePhoto = async (req, res) => {
  let query = {'_id' : req.params.userId};
  let update = {'profile_photo' : undefined};
  try {
    let user = await User.findOneAndUpdate(query, update);
    if (user.profile_photo.key) file_upload.deleteFileS3(user.profile_photo.key); // delete old
    return res.status(200).json({'message':'Successfully removed profile photo.'})
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }

}

const defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd()+profileImage)
}

const addFollowing = async (req, res, next) => {
  try{
    await User.findByIdAndUpdate(req.body.userId, {$push: {following: req.body.followId}}) 
    next()
  }catch(err){
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const addFollower = async (req, res) => {
  try{
    let result = await User.findByIdAndUpdate(req.body.followId, {$push: {followers: req.body.userId}}, {new: true})
                            .populate('following', '_id name')
                            .populate('followers', '_id name')
                            .exec()
      result.hashed_password = undefined
      result.salt = undefined
      res.json(result)
    }catch(err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }  
}

const removeFollowing = async (req, res, next) => {
  try{
    await User.findByIdAndUpdate(req.body.userId, {$pull: {following: req.body.unfollowId}}) 
    next()
  }catch(err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
const removeFollower = async (req, res) => {
  try{
    let result = await User.findByIdAndUpdate(req.body.unfollowId, {$pull: {followers: req.body.userId}}, {new: true})
                            .populate('following', '_id name')
                            .populate('followers', '_id name')
                            .exec() 
    result.hashed_password = undefined
    result.salt = undefined
    res.json(result)
  }catch(err){
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
  }
}

const findPeople = async (req, res) => {
  let following = req.profile.following
  following.push(req.profile._id)
  try {
    let users = await User.find({ _id: { $nin : following } }).select('name')
    res.json(users)
  }catch(err){
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const requireAuthorization = (req, res, next) => {
  let authorized =  authCtrl.isAdmin(req) || (req.profile && req.auth && req.profile._id == req.auth._id)
  if (!authorized) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  } else {
    next()
  }
}

export default {
  create,
  userByID,
  read,
  list,
  remove,
  update,
  getProfilePhoto,
  removeProfilePhoto,
  defaultPhoto,
  addFollowing,
  addFollower,
  removeFollowing,
  removeFollower,
  findPeople,
  requireAuthorization
}
