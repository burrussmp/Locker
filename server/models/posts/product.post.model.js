/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
'use strict';

// imports
import mongoose from 'mongoose';
import StaticStrings from '../../../config/StaticStrings';

const ProductPostErrors = StaticStrings.PostModelErrors.ProductPostErrors;

const ProductPostSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    required: ProductPostErrors.ProductRequired,
    ref: 'Product',
  },
});

ProductPostSchema.pre('deleteOne', {document: true, query: false}, async function() {
  const product = await mongoose.models.Product.findById(this.product); // delegate cleanup to media
  await product.deleteOne();
});

export default mongoose.model('ProductPost', ProductPostSchema);

