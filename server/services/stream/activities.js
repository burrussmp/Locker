/**
 * @desc Stream activities creator
 * @author Matthew P. Burruss
 * @date 2/12/2021
 */

 /**
  * @desc Locker stream activities
  */
 const locker = {

    addLockerProduct: (userId, lockerProductId) => ({
        'actor': `User:${userId}`,
        'verb': 'addLockerProduct',
        'object': `LockerProduct:${lockerProductId}`,
        'foreign_id': lockerProductId,
        'time': new Date(),
    }),
    addLockerCollection: (userId, lockerCollectionId) => ({
        'actor': `User:${userId}`,
        'verb': 'addLockerCollection',
        'object': `LockerCollection:${lockerCollectionId}`,
        'foreign_id': lockerCollectionId,
        'time': new Date(),
    }),
 }

 /**
  * @desc Organization stream activities
  */
const organization = {

    addProduct: (organizationId, productId) => ({
        'actor': `Organization:${organizationId}`,
        'verb': 'addProduct',
        'object': `Product:${productId}`,
        'foreign_id': productId,
        'time': new Date(),
    }),
    addCollection: (organizationId, collectionId) => ({
        'actor': `Organization:${organizationId}`,
        'verb': 'addCollection',
        'object': `Collection:${collectionId}`,
        'foreign_id': collectionId,
        'time': new Date(),
    })
}

export default {
    locker,
    organization,
}