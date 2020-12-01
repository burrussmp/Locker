/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import validators from '@server/services/validators';
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
      all_media: {
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
    throw validators.createValidationError(ProductModelErrors.URLAlreadyExists);
  }
}, null);

ProductSchema.path('organization').validate(async function(value) {
  const org = await mongoose.models.Organization.findById(value);
  if (!org) {
    throw validators.createValidationError(StaticStrings.OrganizationControllerErrors.NotFoundError);
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
  this.setUpdate(update);
});

ProductSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all images
  let media = await mongoose.models.Media.findById(this.media); // delegate cleanup to media
  if (media) {
    await media.deleteOne();
  }
  for (const additionalMedia of this.all_media) {
    media = await mongoose.models.Media.findById(additionalMedia); // delegate cleanup to media
    if (media) {
      await media.deleteOne();
    }
  }
});

export default mongoose.model('Product', ProductSchema);
