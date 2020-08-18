"use strict";
import Organization from '../server/models/organization.model';

// should be valid organization
const OrganizationData = [{
        name: 'CoffeeShop'
    },
    {
        name: 'Grains'
    },
    {
        name: 'HeartBrewery'
    },
];

const addOrganization = async () => {
    console.log('Adding Organizations to DB');
    for (let fake_org of OrganizationData) {
        let org = new Organization(fake_org);
        await org.save();
        console.log(`   Added org ${org.name}`)
    }
    console.log(`Done Adding Organization to DB`)
}

export {
    OrganizationData,
    addOrganization
};