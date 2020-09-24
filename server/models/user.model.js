"use strict";

import mongoose from "mongoose";
import mongoose_fuzzy_searching from "mongoose-fuzzy-searching";

import permissionCtrl from "../permissions";
import StaticStrings from "../../config/StaticStrings";
import CognitoServices from "../services/Cognito.services";
import validators from "../services/validators";

const UserSchema = new mongoose.Schema(
  {
    cognito_username: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      required: StaticStrings.UserModelErrors.CognitoUsernameRequired,
    },
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [{ type: String }],
      default: permissionCtrl.User_Role.permissions,
    },
    date_of_birth: {
      type: Date,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      required: StaticStrings.UserModelErrors.UsernameRequired,
      maxlength: [32, StaticStrings.UserModelErrors.UsernameExceedLength],
    },
    gender: {
      type: String,
      trim: true,
      enum: {
        values: ["male", "female", "other", ""],
        message: StaticStrings.UserModelErrors.InvalidGender,
      },
      default: "",
    },
    about: {
      type: String,
      default: "",
      maxlength: [300, "Bio cannot exceed 300 characters"],
    },
    profile_photo: { type: mongoose.Schema.ObjectId, ref: "Media" },
    following: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

const create_validation_error = (message) => {
  let validatorError = new mongoose.Error.ValidatorError({ message: message });
  return validatorError;
};

UserSchema.path("username").validate(async function (value) {
  const count = await mongoose.models.User.countDocuments({ username: value });
  let isUnique = this ? count == 0 || !this.isModified("username") : count == 0;
  if (!isUnique)
    throw create_validation_error(
      StaticStrings.UserModelErrors.UsernameAlreadyExists
    );
  let invalid_error = validators.isValidUsername(value);
  if (invalid_error) throw create_validation_error(invalid_error);
}, null);

UserSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    // clean up profile photo
    let media = await mongoose.models.Media.findById(this.profile_photo);
    if (media) {
      await media.deleteOne();
    }
    // clean up posts
    let posts = await mongoose.models.Post.find({ postedBy: this._id });
    for (let post of posts) {
      await post.deleteOne();
    }
    // clean up followers/following
    for (let followingID of this.following) {
      // remove from list of who they follow
      await mongoose.models.User.findOneAndUpdate(
        { _id: followingID },
        { $pull: { followers: this._id } }
      );
    }

    // clean up user pool
    try {
      await CognitoServices.deleteCognitoUser(this.cognito_username);
    } catch (err) {
      console.log(err);
    }

    // clean up comments I DONT THINK WE SHOULD DO THIS TBH
    // let comments = await mongoose.models.Comment.find({'postedBy':this._id});
    // for (let comment of comments){
    //   await comment.deleteOne();
    // }
  }
);

// UserSchema.pre("save", function(next){
//   // sanitize
//   this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
//   this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
//   next();
// })

UserSchema.pre("findOneAndUpdate", async function () {
  // sanitize
  let update = await this.getUpdate();
  if (!update) return; // no updates
  let doc = await this.model.findOne(this.getQuery());
  if (!doc) return; // nothing to update
  // if update doesn't change document, then don't bother
  for (let key of Object.keys(update)) {
    if (update[key] == doc[key]) {
      delete update[key];
    }
  }
  this.setUpdate(update);
  if (update.first_name) {
    update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, "");
  }
  if (update.last_name) {
    update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, "");
  }
});

UserSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    {
      name: "first_name",
      minSize: 2,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: "last_name",
      minSize: 3,
      weight: 2,
      prefixOnly: true,
    },
    {
      name: "username",
      minSize: 3,
      weight: 10,
    },
  ],
  middlewares: {
    preSave: function () {
      this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
      this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
    },
    preFindOneAndUpdate: async function () {
      let update = await this.getUpdate();
      if (update.first_name) {
        update.first_name = update.first_name.replace(/<(?:.|\n)*?>/gm, "");
      }
      if (update.last_name) {
        update.last_name = update.last_name.replace(/<(?:.|\n)*?>/gm, "");
      }
    },
  },
});

export default mongoose.model("User", UserSchema);
