"use strict";

const removeArrayAsSet = (array, elem) => {
    let arraySet = new Set(array);
    arraySet.delete(elem);
    return Array.from(arraySet)
}

const addArrayAsSet = (array, elem) => {
    let arraySet = new Set(array);
    arraySet = arraySet.add(elem);
    return Array.from(arraySet);
};

export default {
    removeArrayAsSet,
    addArrayAsSet,
}