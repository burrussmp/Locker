/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
'use strict';

import mongoose from 'mongoose';
// eslint-disable-next-line camelcase
import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching';

import Media from '@server/models/media.model';
import StaticStrings from '@config/StaticStrings';
import CognitoAPI from '@server/services/cognito';
import Validator from '@server/services/validator';

const CognitoServices = CognitoAPI.EmployeeCognitoPool;

const EmployeeModelErrors = StaticStrings.EmployeeModelErrors;

const EmployeeSchema = new mongoose.Schema(
    {
      cognito_username: {
        type: String,
        trim: true,
        required: EmployeeModelErrors.CognitoUsernameRequired,
      },
      email: {
        type: String,
        trim: true,
        required: EmployeeModelErrors.EmailRequired,
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
      organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
      },
      date_of_birth: {
        type: Date,
        trim: true,
      },
      profile_photo: {type: mongoose.Schema.ObjectId, ref: 'Media'},
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      index: true,
    },
);

// eslint-disable-next-line max-len
EmployeeSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up profile photo
  if (this.profile_photo) {
    const media = await Media.findById(this.profile_photo);
    if (media) {
      await media.deleteOne();
    }
  }
  // clean up user pool
  try {
    await CognitoServices.deleteCognitoUser(this.cognito_username);
  } catch (err) {
    console.log(err);
  }
},
);

EmployeeSchema.path('email').validate(async function(value) {
  const count = await mongoose.models.Employee.countDocuments({email: value});
  const isUnique = this ? count == 0 || !this.isModified('email') : count == 0;
  if (!isUnique) {
    throw Validator.createValidationError(
        EmployeeModelErrors.EmailAlreadyExists);
  }
}, null);

EmployeeSchema.pre('findOneAndUpdate', async function() {
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
  this.setUpdate(update);
  if (update.first_name) {
    update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, '');
  }
  if (update.last_name) {
    update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, '');
  }
});

EmployeeSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    {
      name: 'first_name',
      minSize: 3,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: 'last_name',
      minSize: 3,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: 'email',
      minSize: 3,
      weight: 10,
    },
  ],
  middlewares: {
    preSave: function() {
      this.last_name = this.last_name ?
      this.last_name.replace(/<(?:.|\n)*?>/gm, '') : this.last_name;

      this.first_name = this.first_name ?
      this.first_name.replace(/<(?:.|\n)*?>/gm, '') : this.first_name;
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

export default mongoose.model('Employee', EmployeeSchema);
