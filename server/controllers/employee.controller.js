/* eslint-disable max-len */
// imports
import _ from 'lodash';
import fs from 'fs';

import Employee from '@server/models/employee.model';
import Organization from '@server/models/organization.model';
import RBAC from '@server/models/rbac.model';
import Media from '@server/models/media.model';

import authController from './auth.controller';
import mediaController from './media.controller';

import S3Services from '@server/services/S3.services';
import CognitoAPI from '@server/services/Cognito.services';

import errorHandler from '@server/services/dbErrorHandler';
import StaticStrings from '@config/StaticStrings';


const CognitoServices = CognitoAPI.EmployeeCognitoPool;

const DefaultProfilePhoto = process.cwd() + '/client/assets/images/profile-pic.png';

const Errors = StaticStrings.EmployeeControllerErrors;

/**
 * @desc Filter employee for only public data
 * @param {Object} employee employee Mongoose document
 * @return {Object} Filtered employee object
 */
const filterEmployee = (employee) => {
  employee.permissions = undefined;
  employee.__v = undefined;
  return employee;
};

/**
 * @desc Middleware to parse url parameter :employeeId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the employee
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the employee is not
 * found.
 */
const employeeByID = async (req, res, next, id) => {
  try {
    const employee = await Employee.findById(id)
        .populate('permissions')
        .populate('profile_photo', 'key blurhash mimetype')
        .exec();
    if (!employee) {
      return res.status('404').json({error: Errors.EmployeeNotFound});
    }
    req.profile = employee;
    req.owner = id;
    next();
  } catch (err) {
    return res.status('404').json({error: Errors.EmployeeNotFound});
  }
};

/**
 * @desc Create a new employee
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Creates a new employee
 */
const create = async (req, res) => {
  const {password, email, organizationId} = req.body;
  const roleType = req.body.role_type;
  if (!roleType) {
    return res.status(400).json({error: Errors.MissingRoleType});
  }
  let session;
  let cognitoUsername;
  try {
    session = await CognitoServices.signup(email, password);
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
  try {
    cognitoUsername = CognitoServices.getCognitoUsername(session);
    let role;
    if (authController.isAdmin(req) && roleType == 'admin') {
      role = await RBAC.findOne({role: 'admin'});
    } else {
      if (!organizationId) {
        return res.status(400).json({error: Errors.MissingOrganizationId});
      }
      const org = await Organization.findById(organizationId);
      if (!org) {
        return res.status(404).json({error: Errors.OrganizationNotFound});
      }
      if (req.auth.level != 0 && organizationId != req.auth.organization) {
        return res.status(401).json({error: Errors.NotPartOfOrganization});
      }
      role = await RBAC.findOne({role: roleType});
      if (!role) {
        return res.status(404).json(
            {error: StaticStrings.RBACModelErrors.RoleNotFound});
      }
      if (req.auth.level > role.level) {
        const errMessage = `Requester authorization insufficient: Requester level ${req.auth.level} & level of attempt ${role.level}`;
        return res.status(401).json({error: errMessage});
      }
    }
    const newEmployee = {
      cognito_username: cognitoUsername,
      email: email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      date_of_birth: req.body.date_of_birth,
      permissions: role._id,
      organization: organizationId,
    };
    const employee = new Employee(newEmployee);
    await employee.save();
    res.cookie('t', session, {
      expire: new Date() + 9999,
    });
    const parsedSession = CognitoServices.parseSession(session);
    return res.json({
      access_token: parsedSession.accessToken,
      id_token: parsedSession.idToken,
      refresh_token: parsedSession.refreshToken,
      _id: employee._id,
    });
  } catch (err) {
    CognitoServices.deleteCognitoUser(cognitoUsername).then(() => {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }).catch((err) => {
      return res.status(500).json({error: StaticStrings.UnknownServerError + err});
    });
  }
};

/**
 * @desc Return the information of a specific employee in HTTP response
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The retrieved employee
 */
const read = (req, res) => {
  return res.status(200).json(filterEmployee(req.profile));
};

/**
 * @desc Lists all employees
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The retrieved employee
 */
const list = async (req, res) => {
  try {
    const employees = await Employee.find().select('_id email updatedAt createdAt');
    return res.json(employees);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Update an employee
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The updated employee JSON
 */
const update = async (req, res) => {
  const fieldsAllowed = ['first_name', 'last_name', 'email', 'date_of_birth'];
  const updateFields = Object.keys(req.body);
  const invalidFields = _.difference(updateFields, fieldsAllowed);
  if (invalidFields.length != 0) {
    const errMessage = `${StaticStrings.BadRequestInvalidFields} ${invalidFields}`;
    return res.status(422).json({error: errMessage});
  }
  try {
    const employee = await Employee.findOneAndUpdate(
        {_id: req.params.employeeId},
        req.body,
        {new: true, runValidators: true});
    if (!employee) {
      return res.status(500).json({error: StaticStrings.UnknownServerError});
    }
    await CognitoServices.updateCognitoUser(
        req.auth.cognito_username,
        req.body);
    return res.status(200).json(filterEmployee(employee));
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Delete an employee.
 *  Must be 1) At least a supervisor (unless admin)
 * 2) Have higher permissions than the authorizer (supervisor cannot delete admin)
 * 3) Be a part of the same organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The employee that was deleted
 * (unfiltered document)
 */
const remove = async (req, res) => {
  try {
    if (req.profile.permissions.level < req.auth.level) {
      const errMessage = `Requester authorization insufficient: Requester level ${req.auth.level} & level of requestee ${req.profile.permissions.level}`;
      return res.status(401).json({error: errMessage});
    }
    if (req.auth.level != 0 && req.profile.organization._id.toString() != req.auth.organization.toString()) {
      return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg});
    }
    const deletedEmployee = await req.profile.deleteOne();
    return res.json(deletedEmployee);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Change the password of an employee
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 status if success
 */
const changePassword = async (req, res) => {
  const fieldsRequired = ['password', 'old_password'];
  // check to see if only contains proper fields
  const updateFields = Object.keys(req.body);
  const fieldsNeeded = _.difference(fieldsRequired, updateFields);
  if (fieldsNeeded.length != 0) {
    const errMessage = `${StaticStrings.BadRequestFieldsNeeded} ${fieldsNeeded}`;
    return res.status(422).json({error: errMessage});
  }
  // check to see if it has an extra fields
  const fieldsExtra = _.difference(updateFields, fieldsRequired);
  if (fieldsExtra.length != 0) {
    const errMessage = `${StaticStrings.BadRequestInvalidFields} ${fieldsExtra}`;
    return res.status(422).json({error: errMessage});
  }
  if (req.body.old_password == req.body.password) {
    return res.status(400).json({error: Errors.PasswordUpdateSame});
  }
  try {
    await CognitoServices.changePassword(
        req.query.access_token,
        req.body.old_password,
        req.body.password);
    return res.status(200).json({message: StaticStrings.UpdatedPasswordSuccess});
  } catch (err) {
    const errMessage = errorHandler.getErrorMessage(err);
    if (errMessage == 'Incorrect username or password.') {
      res.status(400).json({error: Errors.PasswordUpdateIncorrectError});
    } else {
      return res.status(400).json({error: errMessage});
    }
  }
};

/**
 * @desc Retrieve the profile photo. Default returned if employee
 * has not uploaded a profile photo
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 */
const getProfilePhoto = (req, res) => {
  if (req.profile.profile_photo && req.profile.profile_photo.key) {
    res.locals.key = req.profile.profile_photo.key;
    mediaController.getMedia(req, res);
  } else {
    fs.createReadStream(DefaultProfilePhoto).pipe(res);
  }
};

/**
 * @desc Upload a profile photo for an employee
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 */
const uploadProfilePhoto = (req, res) => {
  const mediaMeta = {
    'type': 'Avatar',
    'uploadedBy': req.params.employeeId,
    'uploadedByType': 'Employee',
    'fields': [
      {name: 'media', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: true},
    ],
  };
  S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    // upload to s3
    const media = allImages['media'][0];
    const query = {_id: req.params.employeeId};
    const update = {$set: {profile_photo: media._id}};
    try {
      const employee = await Employee.findOneAndUpdate(query, update, {runValidators: true}); // update
      if (employee.profile_photo) {
        const media = await Media.findOne({key: req.profile.profile_photo.key});
        await media.deleteOne();
        res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess});
      } else {
        res.status(200).json({message: StaticStrings.UploadProfilePhotoSuccess});
      }
    } catch (err) {
      try {
        const image = await Media.findById(media._id);
        await image.deleteOne(); // delete the new one
        res.status(500).json({error: StaticStrings.UnknownServerError + `\nS3 Cleaned.\nOriginal error ${err.message}.`});
      } catch (err2) {
        res.status(500).json({error: StaticStrings.UnknownServerError + `.\nUnable to clean S3 because ${err2.message}.\nOriginal error ${err.message}.`});
      }
    }
  });
};

/**
 * @desc Remove a profile photo for an employee
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A HTTP response indicating that the profile
 * photo has been removed. Default profile will now be retrieved
 */
const removeProfilePhoto = async (req, res) => {
  const query = {_id: req.params.employeeId};
  const update = {$unset: {profile_photo: ''}};
  const employee = req.profile;
  try {
    await Employee.findOneAndUpdate(query, update);
    if (employee.profile_photo && employee.profile_photo.key) {
      await employee.profile_photo.deleteOne();
      res.status(200).json({message: StaticStrings.RemoveProfilePhotoSuccess});
    } else {
      res.status(404).json({error: StaticStrings.UserControllerErrors.ProfilePhotoNotFound});
    }
  } catch (err) {
    res.status(500).json({error: StaticStrings.UnknownServerError + err.message});
  }
};

/**
 * @desc Change the role of an employee. The following checks are performed for this request to succeed
 *  1. The requester has a lower role level (higher auth) than the requested role and the requestee current role
 *  2. The requester and the requestee are part of the same organization or the requestee is an admin
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} An HTTP response indicating if the role
 * has changed successfully
 */
const changeRole = async (req, res) => {
  const newRoleName = req.body.new_role;
  const employeeId = req.params.employeeId;
  const employeeRole = req.profile.permissions;
  const newRole = await RBAC.findOne({role: newRoleName});
  if (!newRole) { // if the role doesn't exist
    return res.status(400).json({error: StaticStrings.RBACModelErrors.RoleNotFound});
  }
  if (req.auth.level > newRole.level) { // if requester is less authorized than requested role
    const errMessage = `Requester authorization insufficient: Requester level ${req.auth.level} & level of attempt ${newRole.level}`;
    return res.status(401).json({error: errMessage});
  }
  if (req.auth.level > employeeRole.level) { // if requester is less authorized than requestee
    return res.status(401).json({error: Errors.ChangeRoleCannotUpdateSuperior});
  }
  if (req.auth.level != 0 && req.auth.organization.toString() != req.profile.organization.toString()) { // Not part of the same organization
    return res.status(401).json({error: Errors.RequireAdminOrRequesteeandRequesterInSameOrg});
  }
  try {
    const update = {permissions: newRole._id};
    const query = {_id: employeeId};
    await Employee.findOneAndUpdate(query, update);
    return res.status(200).json({'role_id': newRole._id, 'employee_id': employeeId});
  } catch (err) {
    res.status(500).json({error: StaticStrings.UnknownServerError + err.message});
  }
};

export default {
  create,
  employeeByID,
  read,
  list,
  remove,
  update,
  getProfilePhoto,
  uploadProfilePhoto,
  removeProfilePhoto,
  changePassword,
  changeRole,
};
