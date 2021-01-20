/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';

const LockerCollectionModelErrors = StaticStrings.LockerCollectionModelErrors;

const LockerCollectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: LockerCollectionModelErrors.NameRequired,
            trim: true,
            maxlength: [24, LockerCollectionModelErrors.NameExceededLength],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: LockerModelErrors.UserRequired,
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

LockerCollectionSchema.path('locker').validate(async function (lockerId) {
    const locker = await mongoose.models.Locker.findById(lockerId);
    if (!locker) {
        throw Validator.createValidationError(StaticStrings.LockerControllerErrors.NotFoundError);
    }
}, null);

LockerCollectionSchema.path('product_list').validate(async function (productList) {
    for (let productId of productList) {
        const product = await mongoose.models.Product.findById(productId);
        if (!product) {
            const err = `${StaticStrings.ProductControllerErrors.NotFoundError}: Product ID ${productId} in list ${productList}`;
            throw Validator.createValidationError(err);
        }
    }
}, null);

LockerCollectionSchema.method('addProduct', async function(productId) {
    await mongoose.models.LockerCollection.fineOnAndUpdate({'_id': this._id}, {$addToSet: {product_list: productId}})
    await mongoose.models.Locker.findOneAndUpdate({'_id': this.locker}, {$addToSet: {all_products: productId}});
    return this.save();
});
  
LockerCollectionSchema.method('removeProduct', async function(productId) {
    await mongoose.models.LockerCollection.fineOnAndUpdate({'_id': this._id}, {$pull: {product_list: productId}})
    await mongoose.models.Locker.findOneAndUpdate({'_id': this.locker}, {$pull: {all_products: productId}});
    return this.save();
});

LockerCollectionSchema.pre('findOneAndUpdate', async function () {
    const update = await this.getUpdate();
    if (!update) return; // no updates

    this._hero = doc.hero;

    this.setUpdate(update);
});

LockerCollectionSchema.post('findOneAndUpdate', async function () {
    if (this._hero) {
        try {
            await (await mongoose.models.Media.findById(this._hero)).deleteOne();
        } catch (err) {
            console.log(`Error: Unable to delete old hero for locker collection. Reason ${err}`);
        }
    }
});

LockerCollectionSchema.pre('deleteOne', { document: true, query: false }, async function () {
    // clean up all images
    let media = await mongoose.models.Media.findById(this.hero); // delegate cleanup to media
    if (media) {
        await media.deleteOne();
    }
});

export default mongoose.model('LockerCollection', LockerCollectionSchema);
