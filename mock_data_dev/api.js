const fetch = require("node-fetch");

const IP = "localhost";
const PORT = 3000;

const SERVER = `http://${IP}:${PORT}`;

const getHeaders = async (token) => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleError = async (res) => {
    const status = res.status;
    const err = await res.json();
    return new Error(
      JSON.stringify({
        status: status,
        message: err,
      })
    );
  };

const SignUp = async (data) => {
  const res = await fetch(`${SERVER}/api/users`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const result = await res.json();
    return result.token;
  } else {
    throw await handleError(res);
  }
};

exports.SignUp = SignUp;
