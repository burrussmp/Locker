/* eslint-disable no-invalid-this */
/* eslint-disable max-len */

import mongoose from 'mongoose';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';


export const LockerProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: StaticStrings.LockerProductModelErrors.ProductRequired,
    },
    locker: {
      type: mongoose.Schema.ObjectId,
      ref: 'Locker',
      required: StaticStrings.LockerProductModelErrors.LockerRequired,
    },
    locker_collections: [{
      type: mongoose.Schema.ObjectId,
      ref: 'LockerCollection',
      default: [],
    }],
    timestamp_locked: {
      type: Date,
      trim: true,
      default: Date.now,
    }
  }
)

LockerProductSchema.path('product').validate(async function(productId) {
    const product = await mongoose.models.Product.findById(productId);
    if (!product) {
      throw Validator.createValidationError(StaticStrings.ProductControllerErrors.NotFoundError);
    }
}, null);

LockerProductSchema.path('locker_collections').validate(async function(lockerCollectionsIds) {
  for (let lockerCollectionId of lockerCollectionsIds) {
    const lockerCollection = await mongoose.models.LockerCollection.findById(lockerCollectionId);
    if (!lockerCollection) {
      throw Validator.createValidationError(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
    }
  }

}, null);

LockerProductSchema.path('locker').validate(async function(lockerID) {
  const locker = await mongoose.models.Locker.findById(lockerID);
  if (!locker) {
    throw Validator.createValidationError(StaticStrings.LockerCollectionControllerErrors.NotFoundError);
  }
}, null);


export default mongoose.model('LockerProduct', LockerProductSchema);