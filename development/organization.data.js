"use strict";

const OrganizationData = [
    {
        name: 'Gymshark',
        logo: process.cwd() + '/test/resources/gymshark_logo.png',
        description: 'a short description about gymshark',
        url: 'https://www.gymshark.com/'
    },
    {
        name: 'Agolde',
        logo: process.cwd() + '/test/resources/agolde_logo.jpeg',
        description: '',
        url: 'https://agolde.com/'
    },
    {
        name: 'Alo Yoga',
        logo: process.cwd() + '/test/resources/alo_yoga_logo.png',
        description: 'A yoga brand',
        url: 'https://www.aloyoga.com/'
    },
]

const getConstructorData = (data) => {
    return {
        name: data.name,
        description: data.description,
        url: data.url
    }
};

export {
    OrganizationData,
    getConstructorData
};