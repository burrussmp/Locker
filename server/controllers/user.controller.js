"use strict";
// imports
import User from '../models/user.model'
import errorHandler from '../services/dbErrorHandler'
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../services/S3.services';
import _ from 'lodash';
import fs from 'fs';

const DefaultProfilePhoto = process.cwd() + "/client/assets/images/profile-pic.png"

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
    req.owner = id;
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
      if (!user) return res.status(500).json({error:StaticStrings.UnknownServerError}) // possibly unable to fetch
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
    S3_Services.getImageS3(profile_photo.key)
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
  S3_Services.uploadImageS3(req,res,meta, async (req,res,image)=>{ // upload to s3
    let query = {'_id' : req.params.userId}; // at this point we have uploaded to S3 and just need to clean up
    let update = {$set:{'profile_photo' : image._id}};
    try {
      let user = await User.findOneAndUpdate(query, update,{runValidators:true}) // fetch user
        .populate('profile_photo','key')
        .exec();
      if (!user) return res.status(500).json({error:StaticStrings.UnknownServerError}) // possibly unable to fetch
      if (user.profile_photo) { 
        S3_Services.deleteImageS3(user.profile_photo.key).then(()=>{ // delete the old profile photo if necessary
          res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess}) // Success!
        }).catch(err=>{
          res.status(500).json({error:err.message}) // unable to delete old one sadly
        })
      } else {
        res.status(200).json({message:StaticStrings.UploadProfilePhotoSuccess}) // first upload, nothing to delete... Success!
      }
    } catch (err) { 
      if (req.file) {
        S3_Services.deleteImageS3(req.file.key).then(()=>{ // somewhere along the way we messed up... time to clean up!
          res.status(500).json({error:StaticStrings.UserControllerErrors.BadUploadSuccessfulDelete + ' the error that caused it' + err.message}) // cleaned Mongo and S3
        }).catch((err)=>{
          res.status(500).json({error:StaticStrings.S3ServiceErrors.DeleteServerError + ' and ' + err.message}) // unable to clean mongo hmm
        })
      } else {
        res.status(500).json({error: StaticStrings.UnknownServerError + ' and ' + err.message}) // should never see this... if we have req.file we parsed correctly
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
    if (!user)return res.status(500).json({error:StaticStrings.UnknownServerError});
    if (user.profile_photo && user.profile_photo.key) {
      S3_Services.deleteImageS3(user.profile_photo.key).then(()=>{
        res.status(200).json({message:StaticStrings.RemoveProfilePhotoSuccess}) // Successfully removed photo
      }).catch(err=>{
        res.status(503).json({error: StaticStrings.UnknownServerError+err.message}) // error in removal
      })
    } else {
      res.status(404).json({error:StaticStrings.UserControllerErrors.ProfilePhotoNotFound}); // no profile to remove
    }
  } catch (err) {
    res.status(500).json({error: StaticStrings.UnknownServerError+err.message}) // some other error
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
    if (!user)return res.status(500).json({error:StaticStrings.UnknownServerError});
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
      await User.findOneAndUpdate({'_id' : theirID}, {$addToSet: {followers: myID}}) // update their account
      try {
        await User.findOneAndUpdate({'_id' : myID}, {$addToSet: {following: theirID}}) // update our account
      } catch(err){
        await User.findOneAndUpdate({'_id' : theirID}, {$pull: {followers: myID}}) // if updating theirs succeeded, but ours didn't we have to undo ours
        return res.status(500).json({error:StaticStrings.UnknownServerError+err.message}); // send the error
      }
      return res.status(200).json({message:StaticStrings.AddedFollowerSuccess});
    } catch(err){
      return res.status(500).json({error: StaticStrings.UnknownServerError+err.message})  // no accounts were changed
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
      await User.findOneAndUpdate({'_id' : theirID}, {$pull: {followers: myID}}) // update their account
      try {
        await User.findOneAndUpdate({'_id' : myID}, {$pull: {following: theirID}}) // update our account
      } catch(err){
        await User.findOneAndUpdate({'_id' : theirID}, {$addToSet: {followers: myID}}) // if updating our's failed, reset theirs
        return res.status(500).json({error:err.message});
      }
      return res.status(200).json({message:StaticStrings.RemovedFollowerSuccess}); // else all succeeded and we are good
    } catch(err){
      return res.status(500).json({error: errorHandler.getErrorMessage(err)}) 
    }
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
  changePassword,
  listFollow,
  Follow,
  Unfollow
}
