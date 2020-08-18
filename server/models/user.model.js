import mongoose from 'mongoose'
import crypto from 'crypto'

import {isValidEmail,isValidUsername,isValidPhoneNumber,isValidPassword} from '../services/validators';
import permissionCtrl from '../permissions';
import StaticStrings from '../../config/StaticStrings';
import file_upload from '../services/S3.services';

const UserSchema = new mongoose.Schema({
  first_name: {
    type: String,
    trim: true,
    required: 'First name is required'
  },
  phone_number: {
    type: String,
    trim: true,
    required: 'Phone number is required',
    index: { unique: true },
  },
  last_name: {
    type: String,
    trim: true,
    required: 'Last name is required',
  },
  username: {
    type: String,
    trim: true,
    index: { unique: true },
    required: 'Username is required',
    maxlength: [32,'Username must be less than 32 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true },
    required: 'Email is required'
  },
  hashed_password: {
    type: String,
    required: "Password is required",
  },
  salt: String,
  permissions: {
    type: [{type: String}],
    default: permissionCtrl.User_Role.permissions
  },
  date_of_birth: {
    type: Date,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male','female','other',''],
    default: ''
  },
  about: {
    type: String,
    trim: true
  },
  profile_photo: {
    location: {
      type: String,
    },
    key : {
      type: String
    },
    mimetype: {
      type: String
    }
  },
  following: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
  followers: [{type: mongoose.Schema.ObjectId, ref: 'User'}],

},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
})

const create_validation_error = (message)=>{
  let validatorError = new mongoose.Error.ValidatorError({ message: message });
  return validatorError;
}

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password.trim();
    let err = isValidPassword(this._password,this.isNew);
    if (err) this.invalidate('password',err);
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() {
    return this._password
  })


UserSchema.path('email').validate(async function (value) {
  // check uniqueness
  const count = await mongoose.models.User.countDocuments({email: value });
  let valid = this ? count == 0 || !this.isModified('email') : count == 0;
  if (!valid)
    throw create_validation_error('Email already exists');
  // check validity
  if (!isValidEmail(value))
    throw create_validation_error('Valid email is required');
}, null);

UserSchema.path('phone_number').validate(async function (value){
  // check uniqueness
  const count = await mongoose.models.User.countDocuments({phone_number: value });
  let valid = this ? count == 0 || !this.isModified('phone_number') : count == 0;
  if (!valid) 
    throw create_validation_error('Phone number already exists');
  // check validity
  if (!isValidPhoneNumber(value))
    throw create_validation_error('Valid phone number is required');
}, null);

UserSchema.path('username').validate(async function (value) {
  // check uniqueness
  const count = await mongoose.models.User.countDocuments({username: value });
  let valid = this ? count == 0 || !this.isModified('username') : count == 0;
  if (!valid) 
    throw create_validation_error('Username already exists')
  // check validity
  if (!isValidUsername(value)) 
    throw create_validation_error('Valid alphanumeric username (underscores allowed) required');
}, null);

UserSchema.pre("save", function(next){
  // sanitize
  this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
  this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
  next();
})

UserSchema.pre("remove",function(next){
  if (this.profile_photo.key){
    file_upload.deleteFileS3(this.profile_photo.key);
  }
  next();
});

UserSchema.pre("findOneAndUpdate", async function(){
  // sanitize
  let update = this.getUpdate();
  if (update.first_name){
    update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, "");

  }
  if(update.last_name){
    update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, "");
  }

  // update password
  if (update.password && !update.old_password){
    let ValidationError = new mongoose.Error.ValidationError(null);
    ValidationError.addError('hashed_password',create_validation_error(StaticStrings.ErrorPasswordUpdateMissing));
    throw ValidationError;
  } else if (update.password && update.old_password){
    let doc = await this.model.findOne(this.getQuery());
    if (!doc.authenticate(update.old_password)){
      let ValidationError = new mongoose.Error.ValidationError(null);
      ValidationError.addError('password',create_validation_error(StaticStrings.ErrorPasswordUpdateIncorrect));
      throw ValidationError;
    }
    let err = isValidPassword(update.password,false);
    if (err){
      let ValidationError = new mongoose.Error.ValidationError(null);
      ValidationError.addError('password',create_validation_error(err));
      throw ValidationError;
    }
    doc.salt = doc.makeSalt();
    doc.hashed_password = doc.encryptPassword(update.password);
    return doc.save()
  }
})




UserSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },
  encryptPassword: function(password) {
    if (!password) return ''
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex')
    } catch (err) {
      return ''
    }
  },
  makeSalt: function() {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  }
}

export default mongoose.model('User', UserSchema)
