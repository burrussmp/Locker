/* eslint-disable no-invalid-this */
'use strict';

import mongoose from 'mongoose';
import _ from 'lodash';

import Utils from '@server/services/utils';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const RBACModelErrors = StaticStrings.RBACModelErrors;

const RBACSchema = new mongoose.Schema({
  role: {
    type: String,
    trim: true,
    required: RBACModelErrors.RoleRequired,
  },
  level: {
    type: Number,
    required: RBACModelErrors.LevelRequired,
  },
  permissions: {
    type: [String],
    required: RBACModelErrors.PermissionsRequired,
  },
},
{
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

RBACSchema.method('hasPermission', function(permissions) {
  if (typeof permissions === 'string' || permissions instanceof String) {
    permissions = [permissions];
  }
  return _.difference(permissions, this.permissions).length == 0;
});

RBACSchema.method('addPermission', function(permission) {
  this.permissions = Utils.addArrayAsSet(this.permissions, permission);
  return this.save();
});

RBACSchema.method('removePermission', function(permission) {
  this.permissions = Utils.removeArrayAsSet(this.permissions, permission);
  return this.save();
});

RBACSchema.path('role').validate(async function(value) {
  const count = await mongoose.models.RBAC.countDocuments({role: value});
  const isUnique = this ? count == 0 || !this.isModified('role') : count == 0;
  if (!isUnique) {
    throw Validator.createValidationError(RBACModelErrors.RoleAlreadyExists);
  }
}, null);

export default mongoose.model('RBAC', RBACSchema);
