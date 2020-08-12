"use strict";
import User from '../server/models/user.model';

const UserData = [{
        name: 'admin',
        email: 'a@mail.com',
        password: 'admin123',
    },
    {
        name: 'matthew',
        email: 'm@mail.com',
        password: 'admin123',
    },
    {
        name: 'paul',
        email: 'p@mail.com',
        password: 'admin124',
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