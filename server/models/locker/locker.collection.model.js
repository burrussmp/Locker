/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const LockerCollectionModelErrors = StaticStrings.LockerCollectionModelErrors;

const LockerCollectionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: LockerCollectionModelErrors.UserRequired,
        },
        name: {
            type: String,
            trim: true,
            maxlength: [24, LockerCollectionModelErrors.NameExceededLength],
            default: 'Your Collection'
        },
        hero: {
            type: mongoose.Schema.ObjectId,
            ref: 'Media',
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, LockerCollectionModelErrors.DescriptionExceededLength],
        }
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        }
    },
);

LockerCollectionSchema.pre('findOneAndUpdate', async function() {
    // sanitize
    const update = await this.getUpdate();
    if (!update) return;
    
    const doc = await this.model.findOne(this.getFilter());
    if (!doc) return; // nothing to update
    
    this._hero = update.hero ? doc.hero : undefined;
});
  
LockerCollectionSchema.post('findOneAndUpdate', async function() {
    if (this._hero) {
      try {
        const media = await mongoose.models.Media.findById(this._hero)
        await media.deleteOne();
      } catch (err) {
        console.log(`Error: Unable to delete old hero for collection. Reason ${err}`);
      }
    }
});

LockerCollectionSchema.pre('deleteOne', { document: true, query: false }, async function () {
    // clean up all images
    let media = await mongoose.models.Media.findById(this.hero); // delegate cleanup to media
    if (media) {
        await media.deleteOne();
    }
    // pull collection from all lockers and products that reference it
    await mongoose.models.Locker.updateMany({locker_collections: {$in: [this._id]}}, {$pull: {locker_collections: this._id}});
    await mongoose.models.LockerProduct.updateMany({locker_collections: {$in: [this._id]}}, {$pull: {locker_collections: this._id}});
});

export default mongoose.model('LockerCollection', LockerCollectionSchema);
