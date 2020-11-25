/* eslint-disable max-len */
'use strict';
// imports
import Organization from '../models/organization.model';
import Employee from '../models/employee.model';

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
  };
  s3Services.uploadSingleMediaS3(req, res, mediaMeta,
      async (req, res, image) => {
        const {name, url, description} = req.body;
        let organization;
        try {
          organization = new Organization({
            name: name,
            url: url,
            description: description,
            logo: image._id,
          });
          organization = await organization.save();
        } catch (err) {
          return res.status(400).json({error: errorHandler.getErrorMessage(err)});
        }
        try {
          return res.status(200).json({'_id': organization._id});
        } catch (err) {
          return s3Services.deleteMediaS3(req.file.key).then(() => {
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
  return res.status(501).json({
    error: StaticStrings.NotImplementedError,
  });
};

/**
 * @desc Retrieve the logo of an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const getLogo = async (req, res) => {
  return res.status(501).json({
    error: StaticStrings.NotImplementedError,
  });
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
 * @desc Add an employee to an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const addEmployee = async (req, res) => {
  const employeeId = req.body.employeeId;
  const organizationId = req.organization._id;
  if (!employeeId) {
    return res.status(400).json(
        {error: OrganizationControllerErrors.MissingID});
  }
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json(
        {error: StaticStrings.EmployeeControllerErrors.EmployeeNotFound});
  }
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json(
        {error: StaticStrings.OrganizationControllerErrors.NotFoundError});
  }
  if (employee.organization) {
    return res.status(400).json({error: StaticStrings.OrganizationControllerErrors.EmployeeAlreadyInOrganization});
  }
  try {
    await Employee.findOneAndUpdate({'_id': employeeId}, {organization: organizationId}); // update their account
    return res.status(200).json({message: StaticStrings.AddedFollowerSuccess});
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError+err.message}); // no accounts were changed
  }
};

/**
 * @desc Remove an employee from an organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const removeEmployee = async (req, res) => {
  const employeeId = req.body.employeeId;
  const organizationId = req.organization._id;
  if (!employeeId) {
    return res.status(400).json({error: OrganizationControllerErrors.MissingID});
  }
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({error: StaticStrings.EmployeeControllerErrors.EmployeeNotFound});
  }
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json({error: StaticStrings.OrganizationControllerErrors.NotFoundError});
  }
  if (employee.organization) {
    return res.status(400).json({error: StaticStrings.OrganizationControllerErrors.EmployeeAlreadyInOrganization});
  }
  try {
    await Employee.findOneAndUpdate({'_id': employeeId}, {organization: undefined}); // update their account
    return res.status(200).json({message: StaticStrings.AddedFollowerSuccess});
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
  addEmployee,
  removeEmployee,
  updateLogo,
  getLogo,
};
