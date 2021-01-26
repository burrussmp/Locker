const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const SecretManagerServices = require('@server/services/secret.manager');

const SERVER = `http://localhost:8080`;

const getHeaders = async (token) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleError = async (res) => {
  const status = res.status;
  const err = await res.json();
  return new Error(
      JSON.stringify({
        status: status,
        message: err,
      }),
  );
};

const LoginAdminEmployee = async () => {
  const secrets = await SecretManagerServices.default.getSecrets();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER}/auth/ent/login`, {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify({
        login: secrets['admin_email'],
        password: secrets['admin_password'],
      }),
    }).then((res)=>resolve(res.json()));
  });
};

const SignUp = async (data) => {
  const res = await fetch(`${SERVER}/api/users`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    return await res.json();
  } else {
    throw await handleError(res);
  }
};

const Follow = async (userId, token) => {
  const res = await fetch(`${SERVER}/api/users/${userId}/follow`, {
    method: 'PUT',
    headers: await getHeaders(token),
  });
  if (res.ok) {
    return await res.json();
  } else {
    throw await handleError(res);
  }
};

const CreateProductPost = async (productId, token) => {
  const res = await fetch(
      `${SERVER}/api/posts?type=Product&access_token=${token}`,
      {
        method: 'POST',
        'headers': {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({product: productId}),
      },
  );
  if (res.ok) {
    return await res.json();
  } else {
    throw await handleError(res);
  }
};

const UpdateProfilePhoto = async (userId, token, imagePath) => {
  const form = new FormData();
  form.append('media', fs.createReadStream(imagePath));
  const res = await fetch(
      `${SERVER}/api/users/${userId}/avatar?access_token=${token}`,
      {
        method: 'POST',
        body: form,
      },
  );
  if (res.ok) {
    const result = await res.json();
    return result.message;
  } else {
    throw await handleError(res);
  }
};

// const CreateComment = async (data, postId, token) => {
//   const res = await fetch(`${SERVER}/api/${postId}/comments`, {
//     method: 'POST',
//     headers: await getHeaders(token),
//     body: JSON.stringify(data),
//   });
//   if (res.ok) {
//     const result = await res.json();
//     return result._id;
//   } else {
//     throw await handleError(res);
//   }
// };

// const CreateReply = async (data, commentId, token) => {
//   const res = await fetch(`${SERVER}/api/${commentId}/replies`, {
//     method: 'POST',
//     headers: await getHeaders(token),
//     body: JSON.stringify(data),
//   });
//   if (res.ok) {
//     const result = await res.json();
//     return result._id;
//   } else {
//     throw await handleError(res);
//   }
// };

exports.SignUp = SignUp;
exports.Follow = Follow;
exports.UpdateProfilePhoto = UpdateProfilePhoto;
exports.CreateProductPost = CreateProductPost;
// exports.CreateReply = CreateReply;
// exports.CreateComment = CreateComment;
exports.LoginAdminEmployee = LoginAdminEmployee;
