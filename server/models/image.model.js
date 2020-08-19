import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';

const ImageSchema = new mongoose.Schema({
  key: {
    type: String,
    required: StaticStrings.ImageModelErrors.KeyRequired,
    unique: [true,StaticStrings.ImageModelErrors.KeyAlreadyExists]
  },
  type: {
      type: String,
      required: StaticStrings.ImageModelErrors.TypeRequired,
      enum: {
        values: ['profile_photo'],
        mesage: StaticStrings.ImageModelErrors.UnacceptableType
      }
  },
  mimetype: {
    type: String,
    required: StaticStrings.ImageModelErrors.MimeTypeRequired
  },
  originalName: {
      type: String,
      required: StaticStrings.ImageModelErrors.OriginalNameRequired
  },
  description: {
      type: String,
      default: "",
      maxlength : [180,]
  },
  uploadedBy: {
      type: mongoose.Schema.ObjectId, 
      ref: 'User',
      required: StaticStrings.ImageModelErrors.UploadedByRequired
  },
},{
    timestamps : {
      createdAt:'createdAt',
      updatedAt: 'updatedAt'
    }
  })

ImageSchema.pre("remove",function(next){
  if (this.key){
    S3_Services.deleteImageS3(this.key)
      .catch((err)=>{
        console.log(err);
      })
  }
  next();
});

export default mongoose.model('Image', ImageSchema)
