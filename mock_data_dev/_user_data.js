'use strict';

const UserData = [
  {
    username: 'paulasullivan',
    first_name: 'Paula',
    last_name: 'Sullivan',
    email: 'paula.sullivan@gmail.com',
    phone_number: '+15024567890',
    password: 'Pass@123',
    avatar : process.cwd() + '/mock_data_dev/assets/profile_imgs/male_1.jpg',
    follows : [1,2,3],
    posts : [{
      type: "ContentPost",
      price: 59.99,
      caption: "Big fan of this look, especially the jeans.",
      tags: "jeans,designer",
      media : process.cwd() + '/mock_data_dev/assets/content_posts/content_1.png',
      comments : [
        {
          "user" : 0,
          "text" : "You think @KanyeWest would wear this?",
          replies : [{
            "user" : 1,
            "text" : "no way @paulasullivan"
          }]
        }]
      }]
  },
  {
    username: 'mattthewpburruss',
    first_name: 'Matthew',
    last_name: 'Burruss',
    email: 'matthew.burruss@gmail.com',
    phone_number: '+15026891822',
    password: 'Pass@123',
    avatar : process.cwd() + '/mock_data_dev/assets/profile_imgs/male_2.jpg',
    follows : [],
    posts: []
  },
  {
    username: 'alexa_garcia12',
    first_name: 'Alexa',
    last_name: 'Garcia',
    email: 'soccer_chick@gmail.com',
    phone_number: '+15023214343',
    password: 'Pass@123',
    avatar : process.cwd() + '/mock_data_dev/assets/profile_imgs/women_1.jpg',
    follows : [0,1],
    posts : [{
      type: "ContentPost",
      price: 89.99,
      caption: "It's like camo 2.0 :)",
      tags: "yoga,pants,matching",
      media : process.cwd() + '/mock_data_dev/assets/content_posts/content_2.png',
      },
      {
        type: "ContentPost",
        price: 119.99,
        caption: "I'm actually not this fancy, but hey I can dream!",
        tags: "blue,dress",
        media : process.cwd() + '/mock_data_dev/assets/content_posts/content_3.jpg',
      }
    ]
  },
  {
    username: 'KanyeWest',
    first_name: 'Kanye',
    last_name: 'West',
    email: 'kanye_west@gmail.com',
    phone_number: '+15022323212',
    password: 'Pass@123',
    avatar : process.cwd() + '/mock_data_dev/assets/profile_imgs/male_3.jpg',
    follows : [0,1,2,4],
    posts : [{
      type: "ContentPost",
      price: 399.99,
      caption: "Is this for Kim or for me? #yeezy",
      tags: "Kanye",
      media : process.cwd() + '/mock_data_dev/assets/content_posts/content_5.jpeg',
    }]
  },
  {
    username: 'blondie',
    first_name: 'Becca',
    last_name: 'Karen',
    email: 'becca_karen@gmail.com',
    phone_number: '+15021112212',
    password: 'Pass@123',
    avatar : process.cwd() + '/mock_data_dev/assets/profile_imgs/women_2.jpg',
    follows : [2,3],
    posts : [{
      type: "ContentPost",
      price: 49.99,
      caption: "Finally I can match nature",
      tags: "green,long",
      media : process.cwd() + '/mock_data_dev/assets/content_posts/content_4.jpeg',
    },{
      type: "ContentPost",
      price: 249.99,
      caption: "Catwalk",
      tags: "designer,floral,dress",
      media : process.cwd() + '/mock_data_dev/assets/content_posts/content_7.jpeg',
    }]
  }
];

exports.data = UserData;
