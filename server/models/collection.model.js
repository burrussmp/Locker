/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import StaticStrings from '@config/StaticStrings';

const CollectionModelErrors = StaticStrings.CollectionModelErrors;

const CollectionSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: CollectionModelErrors.NameRequired,
        trim: true,
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
      },
      index: true,
    },
);

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
  this.setUpdate(update);
});

CollectionSchema.post('findOneAndUpdate', function(doc) {
    if (doc.hero) {
        mongoose.models.Media.findById(doc.hero).then((media) =>{
            media.deleteOne().catch((err) => {
                console.log(`Error: Unable to remove old hero image in update. Reason ${err}`);
            })
        })
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
