const jwt = require("jsonwebtoken");
import * as dotenv from 'dotenv';
dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn:  process.env.JWT_LIFE_ACCESS_TOKEN,
  });
};

module.exports = generateToken;
