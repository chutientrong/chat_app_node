const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const User = require("../models/userModel");

// Register user
const registerUser = asyncHandler(async (req, res) => {
	try {
		const { name, email, password, pic } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json("Please enter all the fields");
		}

		// get and check user exists
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json("User Already Exists");
		}

		// create user
		const user = await User.create({
			name,
			email,
			password,
		});

		if (!user) return res.status(400).json("Failed to create the user");

		return res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			token: generateToken(user._id),
		});
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// POST: Login user
const loginUser = asyncHandler(async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json("Please enter all the fields");
		}
		// find user by email
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json("Email or password is incorrect");
		}
		// compare password
		const userPassword = await user.matchPassword(password);

		if (!userPassword) {
			return res.status(400).json("Email or password is incorrect");
		}

		if (!user && !password) return res.status(400).json("Failed to login");

		return res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id),
		});
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Find user
const allUsers = asyncHandler(async (req, res) => {
	try {
		const { searchQuery } = req.query;

		const keyword = searchQuery
			? {
					$or: [
						{ name: { $regex: searchQuery, $options: "i" } },
						{ email: { $regex: searchQuery, $options: "i" } },
					],
			  }
			: {};
		// find all user
		const users = await User.find(keyword).find({ _id: { $ne: req.user.id } });
		if (!users) {
			return res.status(400).json("User is not in database");
		}

		return res.status(200).json(users);
	} catch (err) {
		return res.status(400).json(`Error occured ${err}`);
	}
});

module.exports = { registerUser, loginUser, allUsers };
