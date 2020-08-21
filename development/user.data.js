"use strict";
import User from '../server/models/user.model';

// should be valid users
const UserData = [{
        username: 'admin',
        phone_number: '502-682-1822',
        first_name: 'admin',
        last_name: 'admin',
        email: 'a@mail.com',
        password: 'Admin123$',
    },
    {
        username: 'matthewpburruss',
        first_name: 'Matthew',
        phone_number: '502-354-1823',
        last_name: 'Burruss',
        email: 'matthew@mail.com',
        password: 'Admin124$',
    },
    {
        username: 'paulsullivan',
        first_name: 'Paul',
        phone_number: '502-682-7341',
        last_name: 'Sullivan',
        email: 'paul@mail.com',
        password: 'Admin125$',
    },
]

export {
    UserData
};