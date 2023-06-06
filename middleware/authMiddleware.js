const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

const protect = asyncHandler(async (req, res, next) => {
	let token =
		req.body.token ||
		req.query.token ||
		req.headers["authorization"] ||
		req.headers.token ||
		req.cookies.accessToken;
	try {
		if (token) {
			token = token.replace(/^Bearer\s+/, ""); //Vì chuẩn W3C của token sẽ có prefix phía trước Bearer nên phải thay thế Bearer
			const decode = jwt.verify(
				token,
				`${process.env.JWT_KEY}`,
				(err, resultToken) => {
					if (err) {
						return res.status(403).send({ message: "Token Is Not Valid" });
					}
					req.user = resultToken;
					console.log(req.user);
					next();
				}
			);
		} else {
			return res.status(401).send({ message: "You Are Not Authenticated" });
		}
	} catch (err) {
		return res.status(401).send({ message: err.message });
	}
});

module.exports = { protect };
