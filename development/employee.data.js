'use strict';

const EmployeeData = [
  {
    first_name: 'matthew',
    last_name: 'burruss',
    email: 'burrussmatthew@gmail.com',
    password: 'Admin123$',
    role_type: 'supervisor',
    organization: 'Locker Company',
    profile: process.cwd() + '/test/resources/profile1.png',
  },
  {
    first_name: 'Matthew',
    last_name: 'Burruss',
    email: 'matthew@mail.com',
    password: 'Pass@123',
    role_type: 'employee',
    organization: 'Locker Company',
    profile: process.cwd() + '/test/resources/profile2.jpg',
  },
  {
    first_name: 'Paul',
    last_name: 'Sullivan',
    email: 'paul@mail.com',
    password: 'Admin125$',
    role_type: 'employee',
    organization: 'Locker Company',
    profile: process.cwd() + '/test/resources/profile1.png',
  },
  {
    first_name: 'other company',
    last_name: 'Sullivan',
    email: 'paul@mail.com',
    password: 'Admin125$',
    role_type: 'employee',
    organization: 'Gymshark',
    profile: process.cwd() + '/test/resources/profile1.png',
  },
  {
    first_name: 'gym shark supervisor',
    last_name: 'gym shark supervisor',
    email: 'gym@mail.com',
    password: 'Admin125$',
    role_type: 'supervisor',
    organization: 'Gymshark',
    profile: process.cwd() + '/test/resources/profile1.png',
  },
];

const getEmployeeConstructor = (data) => {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: data.password,
    role_type: data.role_type,
    organization: data.organization,
  };
};

export {
  EmployeeData,
  getEmployeeConstructor,
};
