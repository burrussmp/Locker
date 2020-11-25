/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
'use strict';

import mongoose from 'mongoose';
// eslint-disable-next-line camelcase
import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching';

import StaticStrings from '../../config/StaticStrings';
import CognitoAPI from '../services/Cognito.services';
import validators from '../services/validators';

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
      following: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
      followers: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
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
    throw validators.createValidationError(StaticStrings.UserModelErrors.UsernameAlreadyExists);
  }
  const invalidError = validators.isValidUsername(value);
  if (invalidError) {
    throw validators.createValidationError(invalid_error);
  }
}, null);

UserSchema.pre(
    'deleteOne',
    {document: true, query: false},
    async function() {
    // clean up profile photo
      const media = await mongoose.models.Media.findById(this.profile_photo);
      if (media) {
        await media.deleteOne();
      }
      // clean up posts
      const posts = await mongoose.models.Post.find({postedBy: this._id});
      for (const post of posts) {
        await post.deleteOne();
      }
      // clean up followers/following
      for (const followingID of this.following) {
      // remove from list of who they follow
        await mongoose.models.User.findOneAndUpdate(
            {_id: followingID},
            {$pull: {followers: this._id}},
        );
      }

      // clean up user pool
      try {
        await CognitoServices.deleteCognitoUser(this.cognito_username);
      } catch (err) {
        console.log(err);
      }

    // clean up comments I DONT THINK WE SHOULD DO THIS TBH
    // let comments = await mongoose.models.Comment.find({'postedBy':this._id});
    // for (let comment of comments){
    //   await comment.deleteOne();
    // }
    },
);

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

export default mongoose.model('User', UserSchema);
