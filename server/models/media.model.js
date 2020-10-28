import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../../server/services/S3.services';

const MediaSchema = new mongoose.Schema({
  key: {
    type: String,
    required: StaticStrings.MediaModelErrors.KeyRequired,
    unique: [true, StaticStrings.MediaModelErrors.KeyAlreadyExists]
  },
  type: {
    type: String,
    required: StaticStrings.MediaModelErrors.TypeRequired,
    enum: {
      values: ["Avatar", 'ContentPost', 'Logo'],
      message: StaticStrings.MediaModelErrors.UnacceptableType
    }
  },
  mimetype: {
    type: String,
    required: StaticStrings.MediaModelErrors.MimeTypeRequired
  },
  originalName: {
    type: String,
    required: StaticStrings.MediaModelErrors.OriginalNameRequired
  },
  description: {
    type: String,
    default: "",
    maxlength: [300,]
  },
  blurhash: {
    type: String
  },
  uploadedByType : {
    type: String,
    trim: true,
    required: StaticStrings.MediaModelErrors.UploadedByTypeRequired,
    enum : {
      values:['user', 'employee'],
      message: StaticStrings.PostModelErrors.IncorrectType
    }
  },
  uploadedBy :{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type',
    required: StaticStrings.MediaModelErrors.UploadedByRequired,
  },
  resized_keys: {
    type: [String],
    default: [],
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
})

MediaSchema.pre("deleteOne", { document: true, query: false }, async function () {
  await S3_Services.deleteMediaS3(this.key)
    .catch((err) => {
      console.log(err);
    });
  if (this.resized_keys && this.resized_keys.length != 0) {
    for (let i = 0; i < this.resized_keys.length; ++i) {
      let resized_key = this.resized_keys[i];
      S3_Services.deleteMediaS3(resized_key)
        .catch((err) => {
          console.log(err);
        })
    }
  }
});

export default mongoose.model('Media', MediaSchema)
