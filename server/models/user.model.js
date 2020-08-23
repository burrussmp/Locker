import mongoose from 'mongoose'
import crypto from 'crypto'

import {isValidEmail,isValidUsername,isValidPhoneNumber,isValidPassword} from '../services/validators';
import permissionCtrl from '../permissions';
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../services/S3.services';

const UserSchema = new mongoose.Schema({
  first_name: {
    type: String,
    trim: true,
    required: StaticStrings.UserModelErrors.FirstNameRequired
  },
  phone_number: {
    type: String,
    trim: true,
    required: StaticStrings.UserModelErrors.PhoneNumberRequired,
    unique: true
  },
  last_name: {
    type: String,
    trim: true,
    required: StaticStrings.UserModelErrors.LastNameRequired,
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    required: StaticStrings.UserModelErrors.UsernameRequired,
    maxlength: [32,StaticStrings.UserModelErrors.UsernameExceedLength]
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: StaticStrings.UserModelErrors.EmailRequired
  },
  hashed_password: {
    type: String,
    required: StaticStrings.UserModelErrors.PasswordRequired,
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
    trim: true,
    enum: {
      values: ['male','female','other',''],
      message: StaticStrings.UserModelErrors.InvalidGender
    },
    default: ""
  },
  about: {
    type: String,
    default: "",
    maxlength: [300,'Bio cannot exceed 300 characters']
  },
  profile_photo: {type: mongoose.Schema.ObjectId, ref: 'Media'},
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
    if (!password){
      let ValidationError = new mongoose.Error.ValidationError(null);
      ValidationError.addError('password',create_validation_error(StaticStrings.UserModelErrors.PasswordRequired));
      return ValidationError
    }
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
  const count = await mongoose.models.User.countDocuments({email: value });
  let isUnique = this ? count == 0 || !this.isModified('email') : count == 0;
  if (!isUnique)
    throw create_validation_error(StaticStrings.UserModelErrors.EmailAlreadyExists);
  if (!isValidEmail(value))
    throw create_validation_error(StaticStrings.UserModelErrors.InvalidEmail);
}, null);

UserSchema.path('phone_number').validate(async function (value){
  const count = await mongoose.models.User.countDocuments({phone_number: value });
  let isUnique = this ? count == 0 || !this.isModified('phone_number') : count == 0;
  if (!isUnique) 
    throw create_validation_error(StaticStrings.UserModelErrors.PhoneNumberAlreadyExists);
  if (!isValidPhoneNumber(value))
    throw create_validation_error(StaticStrings.UserModelErrors.InvalidPhoneNumber);
}, null);


UserSchema.path('username').validate(async function (value) {
  const count = await mongoose.models.User.countDocuments({username: value });
  let isUnique = this ? count == 0 || !this.isModified('username') : count == 0;
  if (!isUnique)
    throw create_validation_error(StaticStrings.UserModelErrors.UsernameAlreadyExists)
  if (!isValidUsername(value)) 
    throw create_validation_error(StaticStrings.UserModelErrors.InvalidUsername);
}, null);


UserSchema.pre("save", function(next){
  // sanitize
  this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
  this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
  next();
})

UserSchema.pre("deleteOne",{document: true,query:false },async function(){
  // clean up profile photo
  let media = await mongoose.models.Media.findById(this.profile_photo);
  if (media){
    await media.deleteOne();
  }
  // clean up posts
  let posts = await mongoose.models.Post.find({'postedBy':this._id});
  for (let post of posts){
    await post.deleteOne();
  }
  // clean up followers/following
  for (let followingID of this.following){ // remove from list of who they follow
    await mongoose.models.User.findOneAndUpdate({'_id' : followingID}, {$pull: {followers: this._id}})
  }
  // clean up comments
  let comments = await mongoose.models.Comment.find({'postedBy':this._id});
  for (let comment of comments){
    await comment.deleteOne();
  }
});

UserSchema.pre("findOneAndUpdate", async function(){
  // sanitize
  let update = await this.getUpdate();
  if (!update) return // no updates
  let doc = await this.model.findOne(this.getQuery());
  if (!doc) return // nothing to update
  // if update doesn't change document, then don't bother
  for (let key of Object.keys(update)){
    if (update[key] == doc[key]){
      delete update[key]
    }
  }
  this.setUpdate(update);
  if (update.first_name){
    update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, "");
  }
  if(update.last_name){
    update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, "");
  }

  // update password
  if (update.password && update.old_password){
    if (!doc.authenticate(update.old_password)){
      let ValidationError = new mongoose.Error.ValidationError(null);
      ValidationError.addError('password',create_validation_error(StaticStrings.UserModelErrors.PasswordUpdateIncorrectError));
      throw ValidationError;
    }
    if (doc.authenticate(update.password)){
      let ValidationError = new mongoose.Error.ValidationError(null);
      ValidationError.addError('password',create_validation_error(StaticStrings.UserModelErrors.PasswordUpdateSame));
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
