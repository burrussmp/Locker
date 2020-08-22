import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';

const MediaSchema = new mongoose.Schema({
  key: {
    type: String,
    required: StaticStrings.MediaModelErrors.KeyRequired,
    unique: [true,StaticStrings.MediaModelErrors.KeyAlreadyExists]
  },
  type: {
      type: String,
      required: StaticStrings.MediaModelErrors.TypeRequired,
      enum: {
        values: ['profile_photo','ContentPost'],
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
      maxlength : [300,]
  },
  uploadedBy: {
      type: mongoose.Schema.ObjectId, 
      ref: 'User',
      required: StaticStrings.MediaModelErrors.UploadedByRequired
  },
},{
    timestamps : {
      createdAt:'createdAt',
      updatedAt: 'updatedAt'
    }
  })

MediaSchema.pre("remove",function(next){
  if (this.key){
    S3_Services.deleteMediaS3(this.key)
      .catch((err)=>{
        console.log(err);
      })
  }
  next();
});

export default mongoose.model('Media', MediaSchema)
