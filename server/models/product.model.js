/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import StaticStrings from '../../config/StaticStrings';
const ProductModelErrors = StaticStrings.ProductModelErrors;

const ProductSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: ProductModelErrors.NameRequired,
        trim: true,
      },
      organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: ProductModelErrors.OrganizationRequired,
      },
      price: {
        type: Number,
        required: ProductModelErrors.NameRequired,
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
      url: {
        type: String,
        trim: true,
        required: ProductModelErrors.UrlRequired,
      },
      exists: {
        type: Boolean,
        required: ProductModelErrors.ExistsRequired,
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

ProductSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up all images
  let media = await mongoose.models.Media.findById(this.media); // delegate cleanup to media
  await media.deleteOne();
  for (const additionalMedia of this.all_media) {
    media = await mongoose.models.Media.findById(additionalMedia); // delegate cleanup to media
    await media.deleteOne();
  }
  // pull product from organization
  await mongoose.models.Organization.findOneAndUpdate(
      {_id: this.organization},
      {$pull: {products: this._id}},
  );
});

export default mongoose.model('Product', ProductSchema);
