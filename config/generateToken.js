const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn:  process.env.JWT_LIFE_ACCESS_TOKEN,
  });
};

module.exports = generateToken;
