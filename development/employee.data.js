"use strict";

const EmployeeData = [
    {
        first_name: 'matthew',
        last_name: 'burruss',
        email: 'burrussmatthew@gmail.com',
        password: 'Admin123$',
        role_type: 'supervisor',
        company: 'locker',
        profile: process.cwd() + '/test/resources/profile1.png'
    },
    {
        first_name: 'Matthew',
        last_name: 'Burruss',
        email: 'matthew@mail.com',
        password: 'Pass@123',
        role_type: 'supervisor',
        company: 'gymshark',
        profile: process.cwd() + '/test/resources/profile2.jpg'
    },
    {
        first_name: 'Paul',
        last_name: 'Sullivan',
        email: 'paul@mail.com',
        password: 'Admin125$',
        role_type: 'employee',
        company: 'gymshark',
        profile: process.cwd() + '/test/resources/profile1.png'
    },
]

const getEmployeeConstructor = (data) => {
    return {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role_type: data.role_type
    }
};

export {
    EmployeeData,
    getEmployeeConstructor
};