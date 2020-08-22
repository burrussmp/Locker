import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../../server/services/S3.services';

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

MediaSchema.pre("deleteOne",{document: true,query:false },async function(){
  S3_Services.deleteMediaS3(this.key)
    .catch((err)=>{
        console.log(err);
    })
});

export default mongoose.model('Media', MediaSchema)
