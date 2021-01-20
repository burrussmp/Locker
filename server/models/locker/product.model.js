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
    },
    timestamp_added: {
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


export default mongoose.model('LockerProduct', LockerProductSchema);