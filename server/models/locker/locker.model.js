/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';

import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const LockerModelErrors = StaticStrings.LockerModelErrors;

const LockerSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: LockerModelErrors.NameRequired,
        trim: true,
        maxlength: [24, LockerModelErrors.NameExceededLength],
        default: "My Locker"
      },
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: LockerModelErrors.UserRequired,
      },
      locker_collections: [{
        type: mongoose.Schema.ObjectId,
        ref: 'LockerCollection',
      }],
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      }
    },
);

LockerSchema.path('user').validate(async function(userId) {
  const count = await mongoose.models.Locker.countDocuments({user: userId});
  const isUnique = this ? count == 0 || !this.isModified('user') : count == 0;
  if (!isUnique) {
    throw Validator.createValidationError(StaticStrings.LockerControllerErrors.LockerAlreadyExistsForUser);
  }
  const user = await mongoose.models.User.findById(userId);
  if (!user) {
    throw Validator.createValidationError(StaticStrings.UserControllerErrors.NotFoundError);
  }
}, null);

LockerSchema.path('locker_collections').validate(async function(lockerCollectionsIds) {
  for (let lockerCollectionId of lockerCollectionsIds) {
    const lockerCollection = await mongoose.models.LockerCollection.findById(lockerCollectionId);
    if (!lockerCollection) {
      throw Validator.createValidationError(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
    }
  }

}, null);

LockerSchema.pre('findOneAndUpdate', async function() {
  // sanitize
  const update = await this.getUpdate();
  if (!update) return; // no updates

  this.setUpdate(update);
});


LockerSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all locker collections
  const lockersCreatedByUser = await mongoose.models.LockerCollection.find({user: this.user});
  for (const lockerCollection of lockersCreatedByUser){
    await lockerCollection.deleteOne();
  }
  const allLockerProducts = await mongoose.models.LockerProduct.find({locker: this._id});
  for (let lockerProduct of allLockerProducts) {
    await lockerProduct.deleteOne();
  }
});

export default mongoose.model('Locker', LockerSchema);
