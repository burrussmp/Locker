/**
 * @desc Controller for following/followers
 * @author Matthew P. Burruss
 * @date 2/20/2021
 */

import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';

import StreamClient from '@server/services/stream/client';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';

/**
 * @desc A helper function to validate a relationship type.
 * @param {string} relationshipType Must be a valid relationship type e.g. User, Organization
 */
const validateRelationshipType = (relationshipType) => {
    const supportedRelationshipTypes = ['User', 'Organization'];
    if (!supportedRelationshipTypes.includes(relationshipType)) {
        throw new Error(`The relationship type ${relationshipType} is invalid. Valid types include ${supportedRelationshipTypes}`);
    }
}

/**
 * @desc A middleware constructor to list follower stats and info
 * @param {string} relationshipType A relationship type
 */
const listFollow = (relationshipType) => {
    validateRelationshipType(relationshipType);
    /**
     * @desc Get all the followers of either a user or an organization
     * @param {Request} req HTTP request object
     * @param {Response} res HTTP response object
     * @return {Promise<Response>} A 200 if success else an error message
    */
    return async (req, res) => {

      const model = relationshipType === 'User' ? User : Organization;

      const objectB = relationshipType === 'User' ? req.params.userId : req.params.organizationId;

      const offset = req.query.offset || 0;
      const limit = req.query.limit || 25;

      try {
        const query = {'_id': objectB};
        const doc = await model.findById(query)
            .populate('following.actor')
            .populate('followers.actor')
            .exec();
        const response = {
          'following': doc.following.slice(offset, limit),
          'followers': doc.followers.slice(offset, limit),
        };
        // const stats = (await StreamClient.follow.getFollowingStats[relationshipType](objectB)).results;
        // const following = (await StreamClient.getFollowers[relationshipType](objectB)).result;

        return res.status(200).json(response);
      } catch (err) {
        return res.status(400).json({error: ErrorHandler.getErrorMessage(err)});
      }
  }
};

/**
 * @desc A middleware constructor to follow
 * @param {string} relationshipType A relationship type
 */
const follow = (relationshipType) => {
    validateRelationshipType(relationshipType);
    /**
     * @desc Follow
     * @param {Request} req HTTP request object
     * @param {Response} res HTTP response object
     * @return {Promise<Response>} A 200 if success else an error message
    */
    return async (req, res) => {          
      // get model type dynamically
      const modelA = User;
      const modelB = relationshipType === 'User' ? User : Organization;
      const objectA = req.auth._id;
      const objectB = relationshipType === 'User' ? req.params.userId : req.params.organizationId;
      
      if (!objectA || !objectB) {
          return res.status(400).json({error: StaticStrings.RelationshipControllerErrors.MissingLeftOrRightSide});
          }
          if (objectA == objectB) {
          return res.status(422).json({error: StaticStrings.RelationshipControllerErrors.FollowSelfError}); // cannot follow self
          } else {
              try {
                  await modelB.findOneAndUpdate(
                      {'_id': objectB}, {$addToSet: {followers: { actor: objectA, type: 'User'}}});// update their account
                  try {
                    await modelA.findOneAndUpdate(
                      {'_id': objectA}, {$addToSet: {following: { actor: objectB, type: relationshipType}}}); // update our account
                  } catch (err) {
                    await modelB.findOneAndUpdate(
                      {'_id': objectB}, {$pull: {followers: { actor: objectA}}}); // if updating theirs succeeded, but ours didnt
                    return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // send the error
                  }
                  await StreamClient.feed.follow[relationshipType](objectA, objectB);
                  return res.status(200).json({message: StaticStrings.AddedFollowerSuccess});
              } catch (err) {
                  return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // no accounts were changed
              }
          }
      }
};

/**
 * @desc A middleware constructor to unfollow
 * @param {string} relationshipType A relationship type
 */
const unfollow = (relationshipType) => {
    validateRelationshipType(relationshipType);
    /**
     * @desc unfollow
     * @param {Request} req HTTP request object
     * @param {Response} res HTTP response object
     * @return {Promise<Response>} A 200 if success else an error message
    */
    return async (req, res) => {
      // get model type dynamically
      const modelA = User;
      const modelB = relationshipType === 'User' ? User : Organization;
      const objectA = req.auth._id;
      const objectB = relationshipType === 'User' ? req.params.userId : req.params.organizationId;
      
      if (!objectA || !objectB) {
          return res.status(400).json({error: StaticStrings.RelationshipControllerErrors.MissingLeftOrRightSide});
          }
          if (objectA == objectB) {
          return res.status(422).json({error: StaticStrings.RelationshipControllerErrors.UnfollowSelfError}); // cannot follow self
          } else {
              try {
                  await modelB.findOneAndUpdate({'_id': objectB}, {$pull: {followers: { actor: objectA}}}); // update their account
                  try {
                      await modelA.findOneAndUpdate({'_id': objectA}, {$pull: {following: { actor: objectB}}}); // update our account
                  } catch (err) {
                      await modelB.findOneAndUpdate(
                        {'_id': objectB}, {$addToSet: {followers: { actor: objectA, type: 'User'}}}); // if updating ours failed
                      return res.status(500).json({error: err.message});
                  }
                  await StreamClient.feed.unfollow['User'](objectA, objectB);
                  return res.status(200).json({message: StaticStrings.RemovedFollowerSuccess}); // else all succeeded and we are good
              } catch (err) {
                  return res.status(500).json({error: ErrorHandler.getErrorMessage(err)});
              }
          }
      }
};
  
export default {
    listFollow,
    follow,
    unfollow,
};
