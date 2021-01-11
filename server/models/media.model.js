/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
import mongoose from 'mongoose';
import authCtrl from '@server/controllers/auth.controller';
import S3Services from '@server/services/S3.services';
import StaticStrings from '@config/StaticStrings';

const MediaSchema = new mongoose.Schema({
  key: {
    type: String,
    required: StaticStrings.MediaModelErrors.KeyRequired,
    unique: [true, StaticStrings.MediaModelErrors.KeyAlreadyExists],
  },
  type: {
    type: String,
    required: StaticStrings.MediaModelErrors.TypeRequired,
    enum: {
      values: ['Avatar', 'Post', 'Logo', 'Product', 'Collection'],
      message: StaticStrings.MediaModelErrors.UnacceptableType,
    },
  },
  mimetype: {
    type: String,
    required: StaticStrings.MediaModelErrors.MimeTypeRequired,
  },
  originalName: {
    type: String,
    required: StaticStrings.MediaModelErrors.OriginalNameRequired,
  },
  description: {
    type: String,
    default: '',
    maxlength: [300],
  },
  blurhash: {
    type: String,
  },
  uploadedByType: {
    type: String,
    trim: true,
    required: StaticStrings.MediaModelErrors.UploadedByTypeRequired,
    enum: {
      values: authCtrl.ALLOWED_COGNITO_POOL_TYPES,
      message: `${StaticStrings.PostModelErrors.IncorrectType}\nAllowed types: ${authCtrl.ALLOWED_COGNITO_POOL_TYPES}`,
    },
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'uploadedByType',
    required: StaticStrings.MediaModelErrors.UploadedByRequired,
  },
  resized_keys: {
    type: [String],
    default: [],
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

MediaSchema.pre('deleteOne', {document: true, query: false}, async function() {
  await S3Services.deleteMediaS3(this.key)
      .catch((err) => {
        console.log(err);
      });
  if (this.resized_keys && this.resized_keys.length != 0) {
    for (let i = 0; i < this.resized_keys.length; ++i) {
      S3Services.deleteMediaS3(this.resized_keys[i])
          .catch((err) => {
            console.log(err);
          });
    }
  }
});

export default mongoose.model('Media', MediaSchema);
