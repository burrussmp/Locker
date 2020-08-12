import mongoose from 'mongoose'
import crypto from 'crypto'

const reservedPasswords = ["password"];

const checkIfPasswordInvalid = password => {
  if (!password || password.length < 8) {
    return "Password length must be > 7";
  } else if (!password.match(/[0-9]/i)) {
    return `Password must contain at least one numeric character`;
  } else if (!password.match(/[a-z]/)) {
    return `Password must contain at least one lowercase character`;
  } else if (!password.match(/\@|\!|\#|\$|\%|\^/i)) {
    return `"Password must contain at least one of: @, !, #, $, % or ^`;
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
    match: [/^\w+$/,"Please fill a valid alphanumeric username (underscores allowed)"],
    maxLength: [16,'Username must be less than 16 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true },
    unique: 'Email already exists',
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
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
    this._password = password
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

UserSchema.path('username').validate(async (value) => {
  const usernameCount = await mongoose.models.User.countDocuments({username: value });
  return !usernameCount;
}, 'Username already exists');

UserSchema.path('hashed_password').validate(function(v) {
  let invalid_message = checkIfPasswordInvalid(this._password);
  if (invalid_message) {
    this.invalidate('password', invalid_message)
  }
  if (reservedPasswords.indexOf(this._password.toLowerCase()) != -1){
    this.invalidate('password','This password is unsafe.')
  }
  if (this.isNew && !this._password) {
    this.invalidate('password', 'Password is required')
  }
}, null)

UserSchema.pre("save", function(next){
  // sanitize
  this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
  this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
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
