"use strict";
import User from '../server/models/user.model';

const UserData = [{
        username: 'admin',
        first_name: 'admin',
        last_name: 'admin',
        email: 'a@mail.com',
        password: 'Admin123$',
    },
    {
        username: 'matthewpburruss',
        first_name: 'Matthew',
        last_name: 'Burruss',
        email: 'matthew@mail.com',
        password: 'Admin124$',
    },
    {
        username: 'paulsullivan123',
        first_name: 'Paul',
        last_name: 'Sullivan',
        email: 'paul@mail.com',
        password: 'Admin125$',
    },
]

const addUsers = async () => {
    console.log('Adding Users to DB');
    for (let fake_user of UserData) {
        let user = new User(fake_user);
        user = await user.save()
        console.log(`   Added user ${user.name}`);
    }
    console.log(`Done adding Users to DB`);
}

export {
    UserData,
    addUsers
};