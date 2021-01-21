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
      products: [{
        type: mongoose.Schema.ObjectId,
        ref: 'LockerProduct',
      }],
      collections: [{
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

LockerSchema.method('addLockerProduct', async function(lockerProductId) {
  const lockerProduct = await mongoose.models.LockerProduct.findById(lockerProductId);
  if (!lockerProduct) {
    const err = `${StaticStrings.LockerProductControllerErrors.NotFoundError}: ${lockerProductId}`;
    throw Validator.createValidationError(err);
  }
  await this.updateOne({$addToSet: {products: lockerProductId}});
});

LockerSchema.method('removeLockerProduct', async function(lockerProductId) {
  const lockerProduct = await mongoose.models.LockerProduct.findById(lockerProductId);
  if (!lockerProduct) {
    const err = `${StaticStrings.LockerProductControllerErrors.NotFoundError}: ${lockerProductId}`;
    throw Validator.createValidationError(err);
  }
  await this.updateOne({$pull: {products: lockerProductId}});
});


LockerSchema.pre('findOneAndUpdate', async function() {
  // sanitize
  const update = await this.getUpdate();
  if (!update) return; // no updates

  this.setUpdate(update);
});


LockerSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all locker collections
  for (const lockerProduct of this.products){
    await (await mongoose.models.LockerProduct.findById(lockerProduct._id)).deleteOne();
  }
  for (const lockerCollection of this.collections){
    await (await mongoose.models.LockerCollection.findById(lockerCollection._id)).deleteOne();
  }
});

export default mongoose.model('Locker', LockerSchema);
