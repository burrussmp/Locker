"use strict";
// imports
import User from '../models/user.model'
import errorHandler from '../services/dbErrorHandler'
import authCtrl from './auth.controller';
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../services/S3.services';
import _ from 'lodash';
import fs from 'fs';

const DefaultProfilePhoto = process.cwd() + "/client/assets/images/profile-pic.png"

/**
  * @desc (Middleware) Ensure resource that is being acquired is owned by requester
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
  * @param Function next - HTTP Next callback
*/ 
const requireOwnership = (req, res, next) => {
  let authorized =  authCtrl.isAdmin(req) || (req.profile && req.auth && req.profile._id == req.auth._id)
  if (!authorized) {
    return res.status('403').json({error:StaticStrings.NotOwnerError});
  } else {
    next()
  }
}

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
  // check if any invalid fields (bad request)
  const fields_allowed = [
    'first_name',
    'phone_number',
    'last_name',
    'username',
    'gender',
    'email',
    'date_of_birth',
    'about',
    'password',
  ]
  let update_fields = Object.keys(req.body);
  let allowedToEdit = _.difference(update_fields,fields_allowed).length == 0;
  if(!allowedToEdit){
    let invalid_fields = _.difference(update_fields,fields_allowed)
    return res.status(422).json({error:`${StaticStrings.BadRequestInvalidFields} ${invalid_fields}`})
  }
  let user = new User(req.body);
  try {
    await user.save()
    return res.status(200).json({
      message: StaticStrings.SignedUpSuccess
    })
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)})
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
      .populate('profile_photo','_id key mimetype')
      .exec()
    if (!user)
      return res.status('404').json({
        error: StaticStrings.UserNotFoundError
      })
    req.profile = user
    next()
  } catch (err) {
    return res.status('404').json({error: StaticStrings.UserNotFoundError})
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
    return res.json(users)
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
}

/**
  * @desc Controller to update specific user
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const update = async (req, res) => {
    const fields_allowed = [
      'first_name',
      'phone_number',
      'last_name',
      'username',
      'gender',
      'email',
      'date_of_birth',
      'about',
    ]
    let update_fields = Object.keys(req.body);
    let invalid_fields = _.difference(update_fields,fields_allowed);
    if(invalid_fields.length != 0){
      return res.status(422).json({error:`${StaticStrings.BadRequestInvalidFields} ${invalid_fields}`})
    }
    try {
      let query = {'_id' : req.params.userId};
      let user = await User.findOneAndUpdate(query, req.body,{new:true,runValidators:true});
      res.hashed_password = undefined;
      res.salt = undefined;
      return res.status(200).json(user)
    } catch (err) {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }
}

/**
  * @desc Controller to remove a specific user
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const remove = async (req, res) => {
  try {
    let user = req.profile
    let deletedUser = await user.remove()
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    return res.json(deletedUser)
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
}

/**
  * @desc Change password handler
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const changePassword = async (req,res) => {
  const fields_required = [
    "password",
    "old_password"
  ]
  // check to see if only contains proper fields
  let update_fields = Object.keys(req.body);
  let fields_needed = _.difference(fields_required,update_fields);
  if(fields_needed.length != 0){
    return res.status(422).json({error:`${StaticStrings.BadRequestFieldsNeeded} ${fields_needed}`})
  }
  // check to see if it has an extra fields
  let fields_extra = _.difference(update_fields,fields_required);
  if(fields_extra.length != 0){
    return res.status(422).json({error:`${StaticStrings.BadRequestInvalidFields} ${fields_extra}`})
  }
  // to be safe
  let update = {
    'old_password' : req.body.old_password,
    'password' : req.body.password
  };
  try {
    let query = {'_id' : req.params.userId};
    await User.findOneAndUpdate(query, update,{new:true,runValidators:true});
    return res.status(200).json({message: StaticStrings.UpdatedPasswordSuccess});
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
}

/**
  * @desc Get profile photo (if not uploaded, default image is sent)
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const getProfilePhoto = (req, res) => {
  if (req.profile.profile_photo && req.profile.profile_photo.key){
    let profile_photo = req.profile.profile_photo;
    S3_Services.getImageS3(profile_photo)
      .catch((err)=>{
        res.status(404).json({error:err.message})
      }).then((data)=>{
        try {
          res.setHeader('Content-Length', data.ContentLength);
          res.setHeader('Content-Type', profile_photo.mimetype);
          res.write(data.Body)
          res.end(null);
        } catch(err) {
          res.status(500).json({message:StaticStrings.S3ServiceErrors.RetrieveServerError})
        }
      });
  } else {
    fs.createReadStream(DefaultProfilePhoto).pipe(res)
  }
}

/**
  * @desc Upload profile photo to S3 bucket and update MongoDB
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const uploadProfilePhoto = (req, res) => {
  let meta = {
    'type': 'profile_photo',
    'uploadedBy' : req.params.userId
  };
  S3_Services.uploadImageS3(req,res,meta, async (req,res,image)=>{
    let query = {'_id' : req.params.userId};
    let update = {$set:{'profile_photo' : image._id}};
    try {
      let user = await User.findOneAndUpdate(query, update,{runValidators:true})
        .populate('profile_photo','key')
        .exec();
      if (user.profile_photo) {
        S3_Services.deleteImageS3(user.profile_photo.key).then(()=>{
          res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess})
        }).catch(err=>{
          res.status(500).json({error:err.message})
        })
      } else {
        res.status(200).json({message:StaticStrings.UploadProfilePhotoSuccess})
      }
    } catch (err) {
      if (req.file) {
        S3_Services.deleteImageS3(req.file.key).then(()=>{
          res.status(500).json({error:StaticStrings.UserControllerErrors.BadUploadSuccessfulDelete})
        }).catch((err)=>{
          res.status(500).json({error:StaticStrings.S3ServiceErrors.DeleteServerError + ' and ' + err.message})
        })
      } else {
        res.status(400).json({error: errorHandler.getErrorMessage(err)})
      }
    }
  })
}

/**
  * @desc Remove profile photo from S3 bucket and MongoDB
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const removeProfilePhoto = async (req, res) => {
  let query = {'_id' : req.params.userId};
  let update = {$unset: {'profile_photo' : ""}};
  try {
    let user = await User.findOneAndUpdate(query, update)
      .populate('profile_photo','key')
      .exec();
    if (user.profile_photo && user.profile_photo.key) {
      S3_Services.deleteImageS3(user.profile_photo.key).then(()=>{
        res.status(200).json({message:StaticStrings.RemoveProfilePhotoSuccess})
      }).catch(err=>{
        res.status(503).json({error: err.message})
      })
    } else {
      res.status(404).json({error:StaticStrings.UserControllerErrors.ProfilePhotoNotFound});
    }
  } catch (err) {
    res.status(500).json({error: errorHandler.getErrorMessage(err)})
  }

}

/**
  * @desc Get list of followers and following of :userId
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const listFollow = async (req,res) => {
  try {
    let query = {'_id':req.params.userId};
    let user = await User.findById(query)
      .populate('following','_id username')
      .populate('followers','_id username')
      .exec();
    let response = {
      'following' : user.following,
      'followers' : user.followers
    };
    return res.status(200).json(response);
  } catch(err){
    console.log(err);
    return res.status(400).json({error: errorHandler.getErrorMessage(err)})
  }
};

/**
  * @desc The requester is asking to follow :userId
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const addFollower = async (req,res) => {
  let myID = req.auth._id;
  let theirID = req.params.userId;
  if (!myID || !theirID){
    return res.status(400).json({error:StaticStrings.UserControllerErrors.FollowingMissingID});
  }
  if (req.params.userId === myID){
    return res.status(422).json({error: StaticStrings.UserControllerErrors.FollowSelfError}) // cannot follow self
  } else {
    try {
      await User.findOneAndUpdate({'_id' : theirID}, {$addToSet: {followers: myID}})
      await User.findOneAndUpdate({'_id' : myID}, {$addToSet: {following: theirID}})
      return res.status(200).json({message:StaticStrings.AddedFollowerSuccess});
    } catch(err){
      return res.status(500).json({error: errorHandler.getErrorMessage(err)}) 
    }
  }
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

/**
  * @desc The requester is asking to follow :userId
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const Follow = async (req,res) => {
  let myID = req.auth._id;
  let theirID = req.params.userId;
  if (!myID || !theirID){
    return res.status(400).json({error:StaticStrings.UserControllerErrors.FollowingMissingID});
  }
  if (req.params.userId === myID){
    return res.status(422).json({error: StaticStrings.UserControllerErrors.FollowSelfError}) // cannot follow self
  } else {
    try {
      await User.findOneAndUpdate({'_id' : theirID}, {$addToSet: {followers: myID}})
      await User.findOneAndUpdate({'_id' : myID}, {$addToSet: {following: theirID}})
      return res.status(200).json({message:StaticStrings.AddedFollowerSuccess});
    } catch(err){
      return res.status(500).json({error: errorHandler.getErrorMessage(err)}) 
    }
  }
}

/**
  * @desc The requester is asking to unfollow :userId
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const Unfollow = async (req, res) => {
  let myID = req.auth._id;
  let theirID = req.params.userId;
  if (!myID || !theirID){
    return res.status(400).json({error:StaticStrings.UserControllerErrors.FollowingMissingID});
  }
  if (req.params.userId === myID){
    return res.status(422).json({error: StaticStrings.UserControllerErrors.UnfollowSelfError}) // cannot follow self
  } else {
    try {
      await User.findOneAndUpdate({'_id' : theirID}, {$pull: {followers: myID}})
      await User.findOneAndUpdate({'_id' : myID}, {$pull: {following: theirID}})
      return res.status(200).json({message:StaticStrings.AddedFollowerSuccess});
    } catch(err){
      return res.status(500).json({error: errorHandler.getErrorMessage(err)}) 
    }
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


export default {
  create,
  userByID,
  read,
  list,
  remove,
  update,
  getProfilePhoto,
  uploadProfilePhoto,
  removeProfilePhoto,
  addFollowing,
  addFollower,
  findPeople,
  requireOwnership,
  changePassword,
  listFollow,
  Follow,
  Unfollow
}
