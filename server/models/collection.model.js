/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const CollectionModelErrors = StaticStrings.CollectionModelErrors;

const CollectionSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: CollectionModelErrors.NameRequired,
        trim: true,
        maxlength: [24, CollectionModelErrors.NameExceededLength],
      },
      organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: CollectionModelErrors.OrganizationRequired,
      },
      hero: {
        type: mongoose.Schema.ObjectId,
        ref: 'Media',
      },
      product_list: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      }],
      description: {
        type: String,
        trim: true,
        maxlength: [200, CollectionModelErrors.DescriptionExceededLength],
      },
      visible: {
        type: Boolean,
        default: true,
      },
      tags: {
        type: [String],
      },
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      }
    },
);

CollectionSchema.path('organization').validate(async function(value) {
  const org = await mongoose.models.Organization.findById(value);
  if (!org) {
    throw Validator.createValidationError(StaticStrings.OrganizationControllerErrors.NotFoundError);
  }
}, null);

CollectionSchema.path('product_list').validate(async function(productList) {
  for (let productId of productList) {
    const product = await mongoose.models.Product.findById(productId);
    if (!product) {
      const err = `${StaticStrings.ProductControllerErrors.NotFoundError}: Product ID ${productId} in list ${productList}`;
      throw Validator.createValidationError(err);
    }
  }
}, null);

CollectionSchema.pre('findOneAndUpdate', async function() {
  // sanitize
  const update = await this.getUpdate();
  if (!update) return; // no updates
  const doc = await this.model.findOne(this.getFilter());
  if (!doc) return; // nothing to update
  for (const key of Object.keys(update)) {
    if (update[key] == doc[key]) {
      delete update[key];
    }
  }

  this._hero = doc.hero;

  this.setUpdate(update);
});

CollectionSchema.post('findOneAndUpdate', async function() {
    if (this._hero) {
      try {
        const media = await mongoose.models.Media.findById(this._hero);
        await media.deleteOne();
      } catch (err) {
        console.log(`Error: Unable to delete old hero for collection. Reason ${err}`);
      }
    }
  });

CollectionSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all images
  let media = await mongoose.models.Media.findById(this.hero); // delegate cleanup to media
  if (media) {
    await media.deleteOne();
  }
});

export default mongoose.model('Collection', CollectionSchema);
