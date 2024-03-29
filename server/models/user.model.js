/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
'use strict';

import mongoose from 'mongoose';
import stream from 'getstream-node';
// eslint-disable-next-line camelcase
import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching';

import RelationshipModels from '@server/models/relationship.models';

import CognitoAPI from '@server/services/cognito';
import Validator from '@server/services/validator';
import StreamClient from '@server/services/stream/client';
import StaticStrings from '@config/StaticStrings';


const CognitoServices = CognitoAPI.UserCognitoPool;

const UserSchema = new mongoose.Schema(
    {
      cognito_username: {
        type: String,
        trim: true,
        required: StaticStrings.UserModelErrors.CognitoUsernameRequired,
      },
      first_name: {
        type: String,
        trim: true,
      },
      last_name: {
        type: String,
        trim: true,
      },
      permissions: {type: mongoose.Schema.ObjectId, ref: 'RBAC'},
      date_of_birth: {
        type: Date,
        trim: true,
      },
      username: {
        type: String,
        trim: true,
        required: StaticStrings.UserModelErrors.UsernameRequired,
        maxlength: [32, StaticStrings.UserModelErrors.UsernameExceedLength],
      },
      gender: {
        type: String,
        trim: true,
        enum: {
          values: ['male', 'female', 'other', ''],
          message: StaticStrings.UserModelErrors.InvalidGender,
        },
        default: '',
      },
      active: {
        type: Boolean,
        default: true,
      },
      about: {
        type: String,
        default: '',
        maxlength: [300, 'Bio cannot exceed 300 characters'],
      },
      profile_photo: {type: mongoose.Schema.ObjectId, ref: 'Media'},
      following: [RelationshipModels.Following],
      followers: [RelationshipModels.Follower],
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      index: true,
    },
);

UserSchema.path('username').validate(async function(value) {
  const count = await mongoose.models.User.countDocuments({username: value});
  const isUnique = this ? count == 0 || !this.isModified('username') : count == 0;
  if (!isUnique) {
    throw Validator.createValidationError(StaticStrings.UserModelErrors.UsernameAlreadyExists);
  }
  const invalidError = Validator.isValidUsername(value);
  if (invalidError) {
    throw Validator.createValidationError(invalidError);
  }
}, null);

UserSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up profile photo
  if (this.profile_photo) {
    const media = await mongoose.models.Media.findById(this.profile_photo);
    if (media) {
      await media.deleteOne();
    }
  }
  // clean up posts
  const posts = await mongoose.models.Post.find({postedBy: this._id, postedByType: 'User'});
  for (const post of posts) {
    await post.deleteOne();
  }

  // clean up following: Update their followers
  for (const following of this.following) {
    await StreamClient.feed.unfollow[following.type](this._id.toString(), following.actor.toString());
    // remove from list of who they follow
    await mongoose.models[following.type].findOneAndUpdate(
        {_id: following.actor},
        {$pull: {followers: {actor: this._id}}},
    );
  }

  // clean up followers: Update their following
  for (const follower of this.followers) {
    await StreamClient.feed.unfollow.User(follower.actor.toString(), this._id.toString());
    // remove from list of who they follow
    await mongoose.models[follower.type].findOneAndUpdate(
        {_id: follower.actor},
        {$pull: {following: {actor: this._id}}},
    );
  }

  // clean up locker
  const locker = await mongoose.models.Locker.findOne({user: this._id});
  if (locker) {
    await locker.deleteOne();
  }

  // clean up user pool
  try {
    await CognitoServices.deleteCognitoUser(this.cognito_username);
  } catch (err) {
    console.log(err);
  }

  // clean all activities with this user's foreign ID
  await StreamClient.clean.User(this._id.toString());
  

  // clean up comments I DON'T THINK WE SHOULD DO THIS TBH
  // let comments = await mongoose.models.Comment.find({'postedBy':this._id});
  // for (let comment of comments){
  //   await comment.deleteOne();
  // }
},
);

UserSchema.post('save', async function() {
  const locker = new mongoose.models.Locker({user: this._id});
  await locker.save();
});

UserSchema.pre('findOneAndUpdate', async function() {
  // sanitize
  const update = await this.getUpdate();
  if (!update) return; // no updates
  const doc = await this.model.findOne(this.getQuery());
  if (!doc) return; // nothing to update
  // if update doesn't change document, then don't bother
  for (const key of Object.keys(update)) {
    if (update[key] == doc[key]) {
      delete update[key];
    }
  }
  if (update.first_name) {
    update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, '');
  }
  if (update.last_name) {
    update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, '');
  }
  this.setUpdate(update);
});

UserSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    {
      name: 'first_name',
      minSize: 2,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: 'last_name',
      minSize: 2,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: 'username',
      minSize: 1,
      weight: 10,
    },
  ],
  middlewares: {
    preSave: function() {
      this.last_name = this.last_name ? this.last_name.replace(/<(?:.|\n)*?>/gm, '') : this.last_name;
      this.first_name = this.first_name ? this.first_name.replace(/<(?:.|\n)*?>/gm, '') : this.first_name;
    },
    preFindOneAndUpdate: async function() {
      const update = await this.getUpdate();
      if (update.first_name) {
        update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, '');
      }
      if (update.last_name) {
        update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, '');
      }
    },
  },
});

stream.mongoose.setupMongoose(mongoose);

export default mongoose.model('User', UserSchema);
