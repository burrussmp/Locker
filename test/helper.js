/* eslint-disable max-len */
'use strict';


import User from '../server/models/user.model';
import Employee from '../server/models/employee.model';
import Organization from '../server/models/organization.model';
import Post from '../server/models/post.model';
import permissions from '../server/permissions';
import fetch from 'node-fetch';

const createUser = async (data) => {
  return fetch('http://localhost:3000/api/users', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify(data),
  }).then((res)=>res.json());
};

const createEmployee = async (admin, data) => {
  const organization = await Organization.findOne({'name': data.organization});
  return new Promise((resolve, reject) => {
    data.organizationId = organization._id;
    if (!organization) {
      reject(Error(`Did not find organization with name ${data.organization}`));
    }
    fetch(`http://localhost:3000/api/ent/employees?access_token=${admin.access_token}`, {
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
        });
  });
};

const loginAdminEmployee = async () => {
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
  for (const model of [User, Post, Employee, Organization]) {
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

export {
  dropDatabase,
  bufferEquality,
  createUser,
  createEmployee,
  getAccessToken,
  loginAdminEmployee,
};
