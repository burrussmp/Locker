/* eslint-disable max-len */
'use strict';


import User from '@server/models/user.model';
import Collection from '@server/models/collection.model';
import Employee from '@server/models/employee.model';
import Locker from '@server/models/locker/locker.model';
import Organization from '@server/models/organization.model';
import Product from '@server/models/product.model';
import Post from '@server/models/post.model';
import RBAC from '@server/models/rbac.model';
import permissions from '@server/permissions';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

import {getProductPostConstructor} from '@development/product.data';
import {getCollectionConstructor} from '@development/collection.data';

const createUser = async (data) => {
  return fetch('http://localhost:3000/api/users', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify(data),
  }).then((res)=>res.json());
};

const createOrg = async (adminAccessToken, orgData) => {
  const form = new FormData();
  form.append('media', fs.createReadStream(orgData.logo));
  form.append('name', orgData.name);
  form.append('url', orgData.url);
  form.append('description', orgData.description);
  return fetch(`http://localhost:3000/api/organizations?access_token=${adminAccessToken}`, {
    method: 'POST',
    body: form,
  }).then((res) => res.json());
};

const createLocker = async (adminAccessToken, lockerData) => {
  return fetch(`http://localhost:3000/api/lockers?access_token=${adminAccessToken}`, {
    method: 'POST',
    body: JSON.stringify(lockerData),
  }).then((res) => res.json());
};

const addEmployeeToOrg = async (adminAccessToken, organizationId, employeeId) => {
  await fetch(`http://localhost:3000/api/organizations/${organizationId}/employees/?access_token=${adminAccessToken}`, {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify({
      employeeId: employeeId,
    }),
  }).then((res) => res.json());
};

const createEmployee = async (admin, data) => {
  const organization = await Organization.findOne({'name': data.organization});
  return new Promise((resolve, reject) => {
    if (!organization) {
      reject(Error(`Did not find organization with name ${data.organization}`));
    }
    data.organizationId = organization._id;
    fetch(`http://localhost:3000/api/employees?access_token=${admin.access_token}`, {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify(data),
    }).then((res)=>res.json())
        .then((data)=>{
          resolve({
            id: data._id,
            access_token: data.access_token,
          });
        }).catch((err)=>{
          console.log(err);
        });
  });
};

const createProduct = async (productData, accessToken = undefined) => {
    if (!accessToken) {
      const admin = await loginAdminEmployee();
      accessToken = admin.access_token;

      const anyOrg = await Organization.findOne();
      
      productData = JSON.parse(JSON.stringify(productData));
      productData.organization = anyOrg._id.toString();
    }
    // create a product
    const form = FormData();
    form.append('media', fs.createReadStream(productData.media));
    for (let i = 0; i < productData.additional_media.length; ++i) {
        form.append('additional_media', fs.createReadStream(productData.additional_media[i]));
    }
    for ( let key in productData ) {
      if (Array.isArray(productData[key])) {
        for (let item in productData[key]) {
          form.append(`${key}[]`, productData[key][item]);
        }
      } else {
        productData[key] = typeof productData[key] == 'object' ?  JSON.stringify(productData[key]) : productData[key];
        form.append(key, productData[key]);
      }
    }
    return await fetch(`http://localhost:3000/api/products?access_token=${accessToken}`, {
        method: 'POST',
        body: form,
    }).then(res=>res.json());
};

const createCollection = async (collectionData, accessToken) => {
  const form = FormData();
  form.append('hero', fs.createReadStream(collectionData.hero));

  const fields = getCollectionConstructor(collectionData);
  for ( let key in fields ) {
    if (Array.isArray(fields[key])) {
      for (let item in fields[key]) {
        form.append(`${key}[]`, fields[key][item]);
      }
    } else {
      fields[key] = typeof fields[key] == 'object' ?  JSON.stringify(fields[key]) : fields[key];
      form.append(key, fields[key]);
    }
  }
  return await fetch(`http://localhost:3000/api/collections?access_token=${accessToken}`, {
      method: 'POST',
      body: form,
  }).then(res=>res.json());
};

const loginAdminEmployee = async () => {
  // eslint-disable-next-line no-unused-vars
  return new Promise((resolve, reject) => {
    fetch('http://localhost:3000/auth/ent/login', {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify({
        login: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    }).then((res)=>res.json())
        .then((data) => {
          resolve({
            access_token: data.access_token,
            id: data._id,
          });
        });
  });
};

const getAccessToken = async (data) => {
  const loginInfo = {
    'login': data.username,
    'password': data.password,
  };
  const session = await fetch('http://localhost:3000/auth/login', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify(loginInfo),
  }).then((res)=>res.json());
  return session.access_token;
};

const dropDatabase = async () => {
  for (const model of [User, Employee, Locker, Post, Organization, Product, RBAC, Collection]) {
    const cursor = model.find().cursor();
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      await doc.deleteOne();
    }
  }
  await permissions.setUpRBAC();
};

const bufferEquality = (buf1, buf2) => {
  if (buf1.byteLength != buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
};

const createProductPostAgent = (agent, data, accessToken=undefined) => {
  const path = accessToken ? `/api/products?access_token=${accessToken}` : '/api/products';
  let postAgent = agent.post(path).field(getProductPostConstructor(data)).attach('media', data.media);
  for (let i = 0; i < data.additional_media.length; ++i) {
    postAgent = postAgent.attach(`additional_media`, data.additional_media[i]);
  }
  return postAgent;
};

export {
  dropDatabase,
  bufferEquality,
  createUser,
  createEmployee,
  getAccessToken,
  loginAdminEmployee,
  createOrg,
  addEmployeeToOrg,
  createProductPostAgent,
  createProduct,
  createCollection,
  createLocker,
};
