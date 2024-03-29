// imports
import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';

/**
 *
 * @param {Request} req : HTTP Request object
 * @param {Response} res : HTTP Response object
 */
const searchUsers = (req, res) => {
  const search = req.body.search ? req.body.search : "''";
  User.fuzzySearch(search, async (err, docs) => {
    if (err) {
      return res.status(500).json({error: err});
    } else {
      const result = [];
      for (const doc of docs) {
        const data = await User.findById(doc._id)
            .select('_id username profile_photo first_name last_name')
            .populate('profile_photo', 'blurhash mimetype key')
            .exec();
        result.push({
          data: data,
          score: doc._doc.confidenceScore,
        });
      }
      return res.status(200).send(result);
    }
  });
};


/**
 * @desc Retrieve an organization
 * @param {Request} req : HTTP Request object
 * @param {Response} res : HTTP Response object
 */
const searchOrganizations = (req, res) => {
  const search = req.body.search ? req.body.search : "''";
  Organization.fuzzySearch(search, async (err, docs) => {
    if (err) {
      return res.status(500).json({error: err});
    } else {
      const result = [];
      for (const doc of docs) {
        const data = await Organization.findById(doc._id)
            .select('_id name logo')
            .populate('logo', 'blurhash mimetype key')
            .exec();
        result.push({
          data: data,
          score: doc._doc.confidenceScore,
        });
      }
      return res.status(200).send(result);
    }
  });
};


export default {
  searchUsers,
  searchOrganizations,
};
