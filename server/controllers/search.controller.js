// imports
import _ from "lodash";
import User from "../models/user.model";
import StaticStrings from "../../config/StaticStrings";
import CognitoServices from "../services/Cognito.services";
import dbErrorHandler from "../services/dbErrorHandler";

/**
 * 
 * @param {Request} req : HTTP Request object 
 * @param {Response} res : HTTP Response object
 */
const searchUsers = (req, res) => {
  const search = req.body.search;
  User.fuzzySearch(search, async (err, docs) => {
    if (err) {
      res.status(500).json({error: err});
    } else {
      let result = [];
      for (const doc of docs){
        const data = await User.findById(doc._id)
        .select('_id username profile_photo first_name last_name')
        .populate('profile_photo','blurhash mimetype key')
        .exec();
        result.push({
            data: data,
            score: doc._doc.confidenceScore
        });
      }
      res.status(200).send(result)
    }
  });
};

export default {
  searchUsers,
};
