"use strict";

// should be valid organization
const PostData = [
    {
        type: "ContentPost",
        price: 34.23,
        caption : "Check out the new product!",
        tags: ["cool,new,fancy,taggy"],
        postedBy: "5f406be51743670ded5a7917",
        comments: ["1","2","3","4","5"],
        reactions: [
            {
                type: "like",
                postedBy: "id0"
            },
            {
                type: "like",
                postedBy: "id1"
            },
            {
                type: "mad",
                postedBy: "id2"
            },
            {
                type: "mad",
                postedBy: "id3"
            },
            {
                type: "sad",
                postedBy: "id4"
            },
        ]
    },
    {
        type: "ContentPost",
        price: 66.73,
        caption : "This is the other product",
        tags: ["tag,tag,tag,tag"],
        postedBy: "5f406be51743670ded5a7917",
        comments: ["1","2"],
        reactions: [
            {
                type: "laugh",
                postedBy: "id2"
            },
            {
                type: "mad",
                postedBy: "id3"
            },
            {
                type: "sad",
                postedBy: "id4"
            },
        ]
    }
];

export {
    PostData
};