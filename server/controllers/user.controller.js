/* eslint-disable max-len */
'use strict';
// imports
import _ from 'lodash';
import fs from 'fs';

import User from '@server/models/user.model';
import RBAC from '@server/models/rbac.model';
import Media from '@server/models/media.model';

import authController from '@server/controllers/auth.controller';
import mediaController from '@server/controllers/media.controller';

import S3Services from '@server/services/S3.services';
import CognitoAPI from '@server/services/Cognito.services';

import errorHandler from '@server/services/dbErrorHandler';
import StaticStrings from '@config/StaticStrings';

const CognitoServices = CognitoAPI.UserCognitoPool;

const DefaultProfilePhoto = process.cwd() + '/client/assets/images/profile-pic.png';

/**
  * @desc Filter user for data
  * @param {Object} user query result
  * @return {Object} The user document with certain private fields removed
*/
const filterUser = (user) => {
  user.permissions = undefined;
  user.gender = undefined;
  user.__v = undefined;
  return user;
};

/**
 * @desc Middleware: Query a user by the path parameter ID
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the user
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the user is not
 * found.
 */
const userByID = async (req, res, next, id) => {
  try {
    const user = await User.findById(id)
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .populate('profile_photo', 'key blurhash mimetype')
        .exec();
    if (!user) {
      return res.status('404').json({
        error: StaticStrings.UserNotFoundError,
      });
    }
    req.profile = user;
    req.owner = id;
    next();
  } catch (err) {
    return res.status('404').json({error: StaticStrings.UserNotFoundError});
  }
};


/**
 * @desc Creates a new user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the user is not
 * found.
 */
const create = async (req, res) => {
  // eslint-disable-next-line camelcase
  const {username, password, email, phone_number} = req.body;
  let session; let cognitoUser;
  try {
    session = await CognitoServices.signup(username, password, email, phone_number);
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
  try {
    cognitoUser = CognitoServices.getCognitoUsername(session);
    const UserRole = await RBAC.findOne({'role': 'user'});
    const newUser = {
      cognito_username: cognitoUser,
      username: username,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      date_of_birth: req.body.date_of_birth,
      about: req.body.about,
      permissions: UserRole._id,
    };
    let user = new User(newUser);
    user = await user.save();
    res.cookie('t', session, {
      expire: new Date() + 9999,
    });
    const parsedSession = CognitoServices.parseSession(session);
    return res.json({
      access_token: parsedSession.accessToken,
      id_token: parsedSession.idToken,
      refresh_token: parsedSession.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    const cognitoUser = CognitoServices.getCognitoUsername(session);
    CognitoServices.deleteCognitoUser(cognitoUser).then(()=>{
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }).catch((err)=>{
      return res.status(500).json({error: StaticStrings.UnknownServerError + err});
    });
  }
};


/**
 * @desc Retrieve information of a specific user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns the user with private data removed
 */
const read = (req, res) => {
  req.profile = filterUser(req.profile);
  return res.status(200).json(req.profile);
};

/**
 * @desc List all users
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A list of all users id and username
 */
const list = async (req, res) => {
  try {
    const users = await User.find().select('_id username updatedAt createdAt');
    return res.json(users);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Update an existing user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Return the updated user
 */
const update = async (req, res) => {
  const fieldsAllowed = [
    'first_name',
    'phone_number',
    'last_name',
    'username',
    'gender',
    'email',
    'date_of_birth',
    'about',
  ];
  const updateFields = Object.keys(req.body);
  const invalidFields = _.difference(updateFields, fieldsAllowed);
  if (invalidFields.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestInvalidFields} ${invalidFields}`});
  }
  try {
    const user = await User.findOneAndUpdate({'_id': req.params.userId}, req.body, {new: true, runValidators: true});
    if (!user) return res.status(500).json({error: StaticStrings.UnknownServerError}); // possibly unable to fetch
    await CognitoServices.updateCognitoUser(req.auth.cognito_username, req.body);
    return res.status(200).json(user);
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Delete a user from DB
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Return the deleted user
 */
const remove = async (req, res) => {
  try {
    const deletedUser = await req.profile.deleteOne();
    return res.json(deletedUser);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Change the password of a user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Return the deleted user
 */
const changePassword = async (req, res) => {
  const fieldsRequired = [
    'password',
    'old_password',
  ];
  // check to see if only contains proper fields
  const updateFields = Object.keys(req.body);
  const fieldsNeeded = _.difference(fieldsRequired, updateFields);
  if (fieldsNeeded.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestFieldsNeeded} ${fieldsNeeded}`});
  }
  // check to see if it has an extra fields
  const fieldsExtra = _.difference(updateFields, fieldsRequired);
  if (fieldsExtra.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestInvalidFields} ${fieldsExtra}`});
  }
  if (req.body.old_password == req.body.password) {
    return res.status(400).json({error: StaticStrings.UserModelErrors.PasswordUpdateSame});
  }
  try {
    await CognitoServices.changePassword(authController.retrieveAccessToken(req), req.body.old_password, req.body.password);
    return res.status(200).json({message: StaticStrings.UpdatedPasswordSuccess});
  } catch (err) {
    const errMessage = errorHandler.getErrorMessage(err);
    if (errMessage == 'Incorrect username or password.') {
      res.status(400).json({error: StaticStrings.UserModelErrors.PasswordUpdateIncorrectError});
    } else {
      console.log(err);
      return res.status(400).json({error: errMessage});
    }
  }
};

/**
 * @desc Retrieve the profile photo of a user (return default if doesn't exist)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The image as a stream of data
 */
const getProfilePhoto = (req, res) => {
  if (req.profile.profile_photo && req.profile.profile_photo.key) {
    res.locals.key = req.profile.profile_photo.key;
    return mediaController.getMedia(req, res);
  } else {
    return fs.createReadStream(DefaultProfilePhoto).pipe(res);
  }
};

/**
 * @desc Upload new profile photo
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 */
const uploadProfilePhoto = (req, res) => {
  const mediaMeta = {
    'type': 'Avatar',
    'uploadedBy': req.params.userId,
    'uploadedByType': 'User',
    'fields': [
      {name: 'media', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: true},
    ],
  };
  S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages)=>{ // upload to s3
    const media = allImages['media'][0];
    const query = {'_id': req.params.userId}; // at this point we have uploaded to S3 and just need to clean up
    const update = {$set: {'profile_photo': media._id}};
    try {
      const user = await User.findOneAndUpdate(query, update, {runValidators: true}); // update
      if (user.profile_photo && user.profile_photo.key) {
        const media = await Media.findOne({key: req.profile.profile_photo.key});
        await media.deleteOne();
        res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess});
      } else {
        res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess}); // first upload, nothing to delete... Success!
      }
    } catch (err) {
      try {
        const image = await Media.findById(media._id);
        await image.deleteOne(); // delete the new one
        res.status(500).json({error: StaticStrings.UnknownServerError + `\nS3 Cleaned.\nOriginal error ${err.message}.`});
      } catch (err2) {
        res.status(500).json({error: StaticStrings.UnknownServerError + `.\nUnable to clean S3 because ${err2.message}.\nOriginal error ${err.message}.`});
      }
    }
  });
};

/**
 * @desc Remove profile photo from S3 bucket and MongoDB
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 if success else an error message
*/
const removeProfilePhoto = async (req, res) => {
  const query = {'_id': req.params.userId};
  const update = {$unset: {'profile_photo': ''}};
  const user = req.profile;
  try {
    await User.findOneAndUpdate(query, update);
    if (user.profile_photo && user.profile_photo.key) {
      await user.profile_photo.deleteOne();
      return res.status(200).json({message: StaticStrings.RemoveProfilePhotoSuccess}); // Successfully removed photo
    } else {
      return res.status(404).json({error: StaticStrings.UserControllerErrors.ProfilePhotoNotFound}); // no profile to remove
    }
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // some other error
  }
};

/**
 * @desc Get all the followers of a user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 if success else an error message
*/
const listFollow = async (req, res) => {
  try {
    const query = {'_id': req.params.userId};
    const user = await User.findById(query)
        .populate('following', '_id username')
        .populate('followers', '_id username')
        .exec();
    const response = {
      'following': user.following,
      'followers': user.followers,
    };
    return res.status(200).json(response);
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Follow a user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 if success else an error message
*/
const Follow = async (req, res) => {
  const myID = req.auth._id;
  const theirID = req.params.userId;
  if (!myID || !theirID) {
    return res.status(400).json({error: StaticStrings.UserControllerErrors.FollowingMissingID});
  }
  if (req.params.userId == myID) {
    return res.status(422).json({error: StaticStrings.UserControllerErrors.FollowSelfError}); // cannot follow self
  } else {
    try {
      await User.findOneAndUpdate({'_id': theirID}, {$addToSet: {followers: myID}}); // update their account
      try {
        await User.findOneAndUpdate({'_id': myID}, {$addToSet: {following: theirID}}); // update our account
      } catch (err) {
        await User.findOneAndUpdate({'_id': theirID}, {$pull: {followers: myID}}); // if updating theirs succeeded, but ours didn't we have to undo ours
        return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // send the error
      }
      return res.status(200).json({message: StaticStrings.AddedFollowerSuccess});
    } catch (err) {
      return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // no accounts were changed
    }
  }
};

/**
 * @desc Unfollow a user
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 if success else an error message
*/
const Unfollow = async (req, res) => {
  const myID = req.auth._id;
  const theirID = req.params.userId;
  if (!myID || !theirID) {
    return res.status(400).json({error: StaticStrings.UserControllerErrors.FollowingMissingID});
  }
  if (req.params.userId == myID) {
    return res.status(422).json({error: StaticStrings.UserControllerErrors.UnfollowSelfError}); // cannot follow self
  } else {
    try {
      await User.findOneAndUpdate({'_id': theirID}, {$pull: {followers: myID}}); // update their account
      try {
        await User.findOneAndUpdate({'_id': myID}, {$pull: {following: theirID}}); // update our account
      } catch (err) {
        await User.findOneAndUpdate({'_id': theirID}, {$addToSet: {followers: myID}}); // if updating ours failed, reset theirs
        return res.status(500).json({error: err.message});
      }
      return res.status(200).json({message: StaticStrings.RemovedFollowerSuccess}); // else all succeeded and we are good
    } catch (err) {
      return res.status(500).json({error: errorHandler.getErrorMessage(err)});
    }
  }
};


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
  Unfollow,
};
