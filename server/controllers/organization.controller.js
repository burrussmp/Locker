/* eslint-disable max-len */
'use strict';
// imports
import Organization from '../models/organization.model';
import Media from '../models/media.model';
import Employee from '../models/employee.model';
import RBAC from '../models/rbac.model';
import mediaCtrl from '../controllers/media.controller';
import errorHandler from '../services/dbErrorHandler';
import StaticStrings from '../../config/StaticStrings';
import s3Services from '../services/S3.services';
import _ from 'lodash';

const OrganizationControllerErrors = StaticStrings.OrganizationControllerErrors;

/**
 * @desc Filter an organization to return public information
 * @param {object} organization The Mongoose information of an
 * Organization model
 * @return {object} A filtered organization
 */
const filterOrganization = (organization) => {
  organization.__v = undefined;
  return organization;
};

/**
 * @desc Middleware to parse url parameter :organizationId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the organization
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the organization is not
 * found.
 */
const organizationByID = async (req, res, next, id) => {
  try {
    const organization = await Organization.findById(id)
        .populate('logo', 'key blurhash mimetype')
        .exec();
    if (!organization) {
      return res.status(404).json({error: OrganizationControllerErrors.NotFoundError});
    }
    req.organization = organization;
    next();
  } catch (err) {
    return res.status(404).json({error: OrganizationControllerErrors.NotFoundError});
  }
};

/**
 * @desc enforce that requester is in the requested organization or has admin privilege
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 403 is sent if requester not in the same organization and does
 * not have admin privilege
 */
const enforceRequesterInOrganization = async (req, res, next) => {
  if (req.auth.level != 0 && req.organization._id.toString() != req.auth.organization.toString()) {
    return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg});
  } else {
    next();
  }
};

/**
 * @desc Creates a new organization with information in request body
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const create = async (req, res) => {
  const mediaMeta = {
    'type': 'Logo',
    'uploadedBy': req.auth._id,
    'uploadedByType': 'employee',
    'fields': [
      {name: 'media', maxCount: 1, mimetypesAllowed: ['image/png', 'image/jpeg'], required: true},
    ],
  };
  return s3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const {name, url, description} = req.body;
    let organization;
    const media = allImages['media'][0];
    try {
      organization = new Organization({
        name: name,
        url: url,
        description: description,
        logo: media._id,
      });
      organization = await organization.save();
      return res.status(200).json({'_id': organization._id});
    } catch (err) {
      console.log(err);
      return s3Services.deleteMediaS3(media.key).then(() => {
        return res.status(400).json({error: errorHandler.getErrorMessage(err)});
      }).catch((err2) => {
        const errMessage = `Server Error: Unable to save logo to S3 because ${err.message} and ${err2.message}`;
        return res.status(500).json({error: errMessage});
      });
    }
  });
};

/**
 * @desc Retrieve the information of a single organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const read = (req, res) => {
  try {
    return res.status(200).json(filterOrganization(req.organization));
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc List off organizations
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  try {
    const organizations = await Organization.find().select(
        '_id updatedAt createdAt',
    );
    return res.json(organizations);
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc Update an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const update = async (req, res) => {
  const fieldsAllowed = [
    'name',
    'url',
    'description',
  ];
  const updateFields = Object.keys(req.body);
  const invalidFields = _.difference(updateFields, fieldsAllowed);
  if (invalidFields.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestInvalidFields} ${invalidFields}`});
  }
  try {
    const organization = await Organization.findOneAndUpdate({'_id': req.params.organizationId}, req.body, {new: true, runValidators: true});
    if (!organization) return res.status(500).json({error: StaticStrings.UnknownServerError}); // possibly unable to fetch
    return res.status(200).json(filterOrganization(organization));
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Update the logo of an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const updateLogo = async (req, res) => {
  const mediaMeta = {
    'type': 'Logo',
    'uploadedBy': req.auth._id,
    'uploadedByType': 'employee',
    'fields': [
      {name: 'media', maxCount: 1, mimetypesAllowed: ['image/png', 'image/jpeg'], required: true},
    ],
  };
  s3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages)=>{ // upload to s3
    const media = allImages['media'][0];
    const query = {'_id': req.params.organizationId}; // at this point we have uploaded to S3 and just need to clean up
    const update = {$set: {'logo': media._id}};
    try {
      const organization = await Organization.findOneAndUpdate(query, update, {runValidators: true}); // update
      if (organization.logo) {
        const media = await Media.findOne({key: req.organization.logo.key});
        await media.deleteOne();
      } else {
        console.log(`Server Error: Should not see this message, organization should always have logo`);
      }
      res.status(200).json({logo_key: req.organization.logo.key});
    } catch (err) {
      try {
        const image = await findById(media._id);
        await image.deleteOne(); // delete the new one
        res.status(500).json({error: StaticStrings.UnknownServerError + `\nS3 Cleaned.\nOriginal error ${err.message}.`});
      } catch (err2) {
        res.status(500).json({error: StaticStrings.UnknownServerError + `.\nUnable to clean S3 because ${err2.message}.\nOriginal error ${err.message}.`}); // should never see this... if we have req.file we parsed correctly
      }
    }
  });
};

/**
 * @desc Retrieve the logo of an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const getLogo = async (req, res) => {
  if (req.organization.logo && req.organization.logo.key) {
    res.locals.key = req.organization.logo.key;
    return mediaCtrl.getMedia(req, res);
  } else {
    return res.status(500).json({error: StaticStrings.UnknownServerError + '\nReason: Organization missing logo'});
  }
};


/**
 * @desc Delete an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
  try {
    const deletedOrganization = await req.organization.deleteOne();
    return res.json(deletedOrganization);
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc Add an employee to an organization with a provided role. The following checks are performed.
 *  1. The requester is at least a supervisor of organization :organizationId or an admin
 *  2. The requested employee exists and is not already assigned to an organization
 *  3. The requested employee's role level is lower auth than or equal to the requester role level
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const addEmployee = async (req, res) => {
  // validate input
  const fieldsRequired = ['employee_id', 'role'];
  const updateFields = Object.keys(req.body);
  const missingFields = _.difference(fieldsRequired, updateFields);
  if (missingFields.length != 0) {
    return res.status(422).json({error: `Missing required fields in body: ${missingFields}`});
  }
  const employeeId = req.body.employee_id;
  // validate employee_id
  let employee;
  try {
    employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({error: StaticStrings.EmployeeControllerErrors.EmployeeNotFound});
    }
    if (employee.organization) {
      return res.status(400).json({error: StaticStrings.OrganizationControllerErrors.EmployeeAlreadyInOrganization});
    }
  } catch (err) {
    return res.status(400).json({error: StaticStrings.EmployeeControllerErrors.InvalidEmployeeID});
  }
  // validate role
  let rbacRole;
  try {
    rbacRole = await RBAC.findOne({'role': req.body.role});
    if (!rbacRole) {
      return res.status(400).json({error: StaticStrings.RBACModelErrors.RoleNotFound});
    }
  } catch (err) {
    return res.status(400).json({error: err.message});
  }
  // validate auth
  if (req.auth.level > rbacRole.level) {
    const errMessage = `Requester authorization insufficient: Requester level ${req.auth.level} & level of role to create ${rbacRole.level}`;
    return res.status(401).json({error: errMessage});
  }
  // success
  try {
    const organizationId = req.organization._id;
    await Employee.findOneAndUpdate({'_id': employeeId}, {organization: organizationId, permissions: rbacRole._id}); // update their account
    return res.status(200).json({'employee_id': employeeId, 'org_id': organizationId});
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // no accounts were changed
  }
};

/**
 * @desc Remove an employee from an organization. In order to remove an employee from an organization the
 * following checks are performed.
 *  1. The requester is a supervisor of organization :organizationId or an admin
 *  2. The requested employee exists and is also in :organizationId
 *  3. The requested employee's role level is lower auth than or equal to the requester role level
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const removeEmployee = async (req, res) => {
  // validate input
  const employeeId = req.body.employee_id;
  if (!employeeId) {
    return res.status(422).json({error: `Missing required fields: employee_id`});
  }
  // validate employee_id
  let employee;
  try {
    employee = await Employee.findById(employeeId).populate('permissions').exec();
    if (!employee) {
      return res.status(404).json({error: StaticStrings.EmployeeControllerErrors.EmployeeNotFound});
    }
    if (employee.organization._id.toString() != req.organization._id.toString()) {
      return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireRequesteeInOrg});
    }
  } catch (err) {
    return res.status(400).json({error: StaticStrings.EmployeeControllerErrors.InvalidEmployeeID});
  }
  // validate auth
  if (req.auth.level > employee.permissions.level) {
    const errMessage = `Requester authorization insufficient: Requester level ${req.auth.level} & level of employee ${employee.permissions.level}`;
    return res.status(401).json({error: errMessage});
  }
  // success
  try {
    const NARole = await RBAC.findOne({'role': 'none'});
    await Employee.findOneAndUpdate({'_id': employeeId}, {organization: undefined, permissions: NARole._id});
    return res.status(200).json({'employee_id': employeeId, 'org_id': req.organization._id});
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // no accounts were changed
  }
};

export default {
  list,
  create,
  read,
  update,
  remove,
  organizationByID,
  enforceRequesterInOrganization,
  addEmployee,
  removeEmployee,
  updateLogo,
  getLogo,
};
