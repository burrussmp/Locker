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
        products: [{
            type: mongoose.Schema.ObjectId,
            ref: 'LockerProduct',
        }],
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


LockerCollectionSchema.path('products').validate(async function(productList) {
    for (let productId of productList) {
      const product = await mongoose.models.LockerProduct.findById(productId);
      if (!product) {
        const err = `${StaticStrings.LockerProductControllerErrors.NotFoundError}: Product ID ${productId} in list ${productList}`;
        throw Validator.createValidationError(err);
      }
    }
}, null);

LockerCollectionSchema.method('addLockerProduct', async function(lockerProductId) {
    const lockerProduct = await mongoose.models.LockerProduct.findById(lockerProductId);
    if (!lockerProduct) {
      const err = `${StaticStrings.LockerProductControllerErrors.NotFoundError}: ${lockerProductId}`;
      throw Validator.createValidationError(err);
    }
    await this.updateOne({$addToSet: {products: lockerProductId}});
});
  
LockerCollectionSchema.method('removeLockerProduct', async function(lockerProductId) {
    const lockerProduct = await mongoose.models.LockerProduct.findById(lockerProductId);
    if (!lockerProduct) {
      const err = `${StaticStrings.LockerProductControllerErrors.NotFoundError}: ${lockerProductId}`;
      throw Validator.createValidationError(err);
    }
    await this.updateOne({$pull: {products: lockerProductId}});
});
  
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
    for (const lockerProduct of this.products){
        await (await mongoose.models.LockerProduct.findById(lockerProduct._id ? lockerProduct._id: lockerProduct)).deleteOne();
    }
});

export default mongoose.model('LockerCollection', LockerCollectionSchema);
