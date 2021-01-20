/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const ProductModelErrors = StaticStrings.ProductModelErrors;

const ProductSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: ProductModelErrors.NameRequired,
        trim: true,
      },
      url: {
        type: String,
        trim: true,
        required: ProductModelErrors.UrlRequired,
      },
      organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: ProductModelErrors.OrganizationRequired,
      },
      price: {
        type: Number,
        required: ProductModelErrors.PriceRequired,
        min: [0, ProductModelErrors.NegativePrice],
      },
      media: {
        type: mongoose.Schema.ObjectId,
        ref: 'Media',
        required: ProductModelErrors.MediaRequired,
      },
      description: {
        type: String,
        trim: true,
        required: ProductModelErrors.DescriptionRequired,
      },
      available: {
        type: Boolean,
        required: ProductModelErrors.ExistsRequired,
      },
      approved: {
        type: Boolean,
        default: true,
      },
      visible: {
        type: Boolean,
        default: true,
      },
      product_collection: {
        type: String,
      },
      last_scraped: {
        type: Date,
      },
      tags: {
        type: [String],
      },
      meta: {
        type: Object,
      },
      sizes: {
        type: [{type: String}],
        default: [],
      },
      additional_media: {
        type: [{type: mongoose.Schema.ObjectId, ref: 'Media'}],
        default: [],
      },
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      index: true,
    },
);

/**
 * TODO
 * Upon creation, check if the url is valid and that the product exists
 * TODO
 * On a get, check if the url is still valid. If not valid, set to false
*/
ProductSchema.path('url').validate(async function(value) {
  const count = await mongoose.models.Product.countDocuments({url: value});
  const isUnique = this ? count == 0 || !this.isModified('url') : count == 0;
  if (!isUnique) {
    throw Validator.createValidationError(ProductModelErrors.URLAlreadyExists);
  }
}, null);

ProductSchema.path('organization').validate(async function(value) {
  const org = await mongoose.models.Organization.findById(value);
  if (!org) {
    throw Validator.createValidationError(StaticStrings.OrganizationControllerErrors.NotFoundError);
  }
}, null);

ProductSchema.pre('findOneAndUpdate', async function() {
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

  this._media = doc.media;
  this._additional_media = doc.additional_media;

  this.setUpdate(update);
});

ProductSchema.post('findOneAndUpdate', async function() {
  const allMedia = [this._media, ...this._additional_media];
  for (let media in allMedia) {
    if (media) {
      try {
        await (await mongoose.models.Media.findById(media)).deleteOne();
      } catch (err) {
        console.log(`Error: Unable to delete old hero for collection. Reason ${err}`);
      }
    }
  }
});

ProductSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all images
  let media = await mongoose.models.Media.findById(this.media); // delegate cleanup to media
  if (media) {
    await media.deleteOne();
  }
  for (const additionalMedia of this.additional_media) {
    media = await mongoose.models.Media.findById(additionalMedia); // delegate cleanup to media
    if (media) {
      await media.deleteOne();
    }
  }
});

export default mongoose.model('Product', ProductSchema);
