import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  key: {
    type: String,
    required: 'The S3 file key is required',
    unique: [true,'Key must be unique']
  },
  type: {
      type: String,
      required: "The type of the image must be specified",
      enum: {
        values: ['profile_photo'],
        mesage: 'ServerError: Image must be of an acceptable type'
      }
  },
  mimetype: {
    type: String,
    required: 'The image mimetype is required'
  },
  originalName: {
      type: String,
      required: "The image must be named"
  },
  description: {
      type: String,
      default: ""
  },
  uploadedBy: {
      type: mongoose.Schema.ObjectId, 
      ref: 'User',
      required: 'The ObjectID of who uploaded the image is required'
  },
},{
    timestamps : {
      createdAt:'createdAt',
      updatedAt: 'updatedAt'
    }
  })

export default mongoose.model('Image', ImageSchema)
