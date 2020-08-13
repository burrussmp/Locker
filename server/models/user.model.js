import mongoose from 'mongoose'
import crypto from 'crypto'
import {isValidEmail,isValidUsername,isValidPhoneNumber} from '../helpers/validators';

const checkIfPasswordInvalid = password => {
  if (!password){
    return 'Password is required';
  } else if (password.length < 8) {
    return "Password length must be > 7";
  } else if (!password.match(/[0-9]/i)) {
    return `Password must contain at least one numeric character`;
  } else if (!password.match(/[a-z]/)) {
    return `Password must contain at least one lowercase character`;
  } else if (!password.match(/\@|\!|\#|\$|\%|\^/i)) {
    return `Password must contain at least one of: @, !, #, $, % or ^`;
  } else if (!password.match(/[A-Z]/)) {
    return `Password must contain at least one uppercase character`
  }
  return undefined;
};

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
    unique: 'Username already exists',
    lowercase: true,
    index: { unique: true },
    required: 'Username is required',
    match: [/^\w+$/,"Valid alphanumeric username (underscores allowed) required"],
    maxlength: [32,'Username must be less than 32 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true },
    unique: 'Email already exists',
    match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Valid email is required'],
    required: 'Email is required'
  },
  hashed_password: {
    type: String,
    required: "Password is required"
  },
  salt: String,
  updated: {
    type: Date,
    default: Date.now
  },
  created: {
    type: Date,
    default: Date.now
  },
  about: {
    type: String,
    trim: true
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  following: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
  followers: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
  seller: {
    type: Boolean,
    default: false
  },
  stripe_seller: {},
  stripe_customer: {}
})

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password.trim();
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() {
    return this._password
  })

UserSchema.path('email').validate(async (value) => {
  const emailCount = await mongoose.models.User.countDocuments({email: value });
  return !emailCount;
}, 'Email already exists');

UserSchema.path('phone_number').validate(async (value) => {
  const phoneCount = await mongoose.models.User.countDocuments({phone_number: value });
  return !phoneCount;
}, "Phone number already exists");

UserSchema.path('username').validate(async (value) => {
  const usernameCount = await mongoose.models.User.countDocuments({username: value });
  return !usernameCount;
}, 'Username already exists');

UserSchema.path('hashed_password').validate(function(v) {
  let invalid_message = checkIfPasswordInvalid(this._password);
  if (invalid_message) {
    this.invalidate('password', invalid_message)
  }
  if (this.isNew && !this._password) {
    this.invalidate('password', 'Password is required')
  }
}, null)

UserSchema.pre("save", function(next){
  // sanitize
  this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
  this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
  
  // check if all valid
  if (!isValidPhoneNumber(this.phone_number)){
    throw this.invalidate('phone_number','Valid phone number is required');
  }
  if (!isValidEmail(this.email)){
    throw this.invalidate('email','Valid email is required');
  }
  if (!isValidUsername(this.username)){
    throw this.invalidate('username','Valid username is required');
  }
  next();
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
