const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const IP = 'localhost';
const PORT = 3000;

const SERVER = `http://${IP}:${PORT}`;

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

const SignUp = async (data) => {
  const res = await fetch(`${SERVER}/api/users`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const result = await res.json();
    return {
      token: result.access_token,
      _id: result._id,
    };
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
    const result = await res.json();
    return result.message;
  } else {
    throw await handleError(res);
  }
};

const CreateContentPost = async (data, token) => {
  const form = new FormData();
  form.append('media', fs.createReadStream(data.media));
  form.append('price', data.price);
  form.append('caption', data.caption);
  form.append('tags', data.tags);
  const res = await fetch(
      `${SERVER}/api/posts?type=ContentPost&access_token=${token}`,
      {
        method: 'POST',
        body: form,
      },
  );
  if (res.ok) {
    const result = await res.json();
    return result._id;
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

const CreateComment = async (data, postId, token) => {
  const res = await fetch(`${SERVER}/api/${postId}/comments`, {
    method: 'POST',
    headers: await getHeaders(token),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const result = await res.json();
    return result._id;
  } else {
    throw await handleError(res);
  }
};

const CreateReply = async (data, commentId, token) => {
  const res = await fetch(`${SERVER}/api/${commentId}/replies`, {
    method: 'POST',
    headers: await getHeaders(token),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const result = await res.json();
    return result._id;
  } else {
    throw await handleError(res);
  }
};

exports.SignUp = SignUp;
exports.Follow = Follow;
exports.UpdateProfilePhoto = UpdateProfilePhoto;
exports.CreateContentPost = CreateContentPost;
exports.CreateReply = CreateReply;
exports.CreateComment = CreateComment;
