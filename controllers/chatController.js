const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
	try {
		const { userId } = req.body;

		if (!userId || !req.user.id) {
			return res.status(400).json("User is not found");
		}

		var isChat = await Chat.find({
			isGroupChat: false,
			$and: [
				{ users: { $elemMatch: { $eq: req.user.id } } },
				{ users: { $elemMatch: { $eq: userId } } },
			],
		})
			.populate("users", "-password")
			.populate("latestMessage");

		isChat = await User.populate(isChat, {
			path: "latestMessage.sender",
			select: "name email",
		});

		// if(!isChat) return res.status(400).json("Fails");

		if (isChat.length > 0) {
			return res.status(200).json(isChat[0]);
		} else {
			var chatData = {
				chatName: "sender",
				isGroupChat: false,
				users: [req.user.id, userId],
			};
			// create chat
			const createdChat = await Chat.create(chatData);
			if (!createdChat) return res.status(400).json("Create Chat Fails");
			// get full chat
			const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
				"users",
				"-password"
			);
			if (!fullChat) return res.status(400).json("Getting Chats Fails");
			return res.status(200).json(fullChat);
		}
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Fetch chats
const fetchChats = asyncHandler(async (req, res) => {
	try {
		if (!req.user.id) return res.status(400).json("Not found");
		// get all chats by user
		const results = await Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
			.populate("users", "-password")
			.populate("groupAdmin", "-password")
			.populate("latestMessage")
			.populate({
				path: "latestMessage.sender",
				select: "name email",
			})
			.sort({ updatedAt: -1 })
			// if(!results) return res.status(400).json("Getting Chats is Fails");
			return res.status(200).send(results);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Create group chat
const createGroupChat = asyncHandler(async (req, res) => {
	try {
		if (!req.body.users || !req.body.name) {
			return res.status(400).send("Please fill all the details");
		}

		var users = JSON.parse(req.body.users);

		if (users.length < 2) {
			return res
				.status(400)
				.json("More than 2 users are required to form a group chat");
		}

		users.push(req.user.id);
			// create group chat
		const groupChat = await Chat.create({
			chatName: req.body.name,
			users: users,
			isGroupChat: true,
			groupAdmin: req.user.id,
		});
		if (!groupChat) return res.status(400).json("Create group fails");
		// get all group chat by id 
		const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
			.populate("users", "-password")
			.populate("groupAdmin", "-password");

		if (!fullGroupChat) return res.status(400).json("Get group fails");
		return res.status(200).json(fullGroupChat);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Rename group title
const renameGroup = asyncHandler(async (req, res) => {
	try {
		const { chatId, chatName } = req.body;
		if (!chatId || !chatName) return res.status(400).json("Not found");
		const updatedChat = await Chat.findByIdAndUpdate(
			chatId,
			{
				chatName,
			},
			{
				new: true,
			}
		)
			.populate("users", "-password")
			.populate("groupAdmin", "-password");

		if (!updatedChat) return res.status(400).json("Rename group fails");

		return res.json(updatedChat);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Add to group
const addToGroup = asyncHandler(async (req, res) => {
	try {
		const { chatId, userId } = req.body;
		if (!chatId || !userId) return res.status(400).json("Not found");
		const added = await Chat.findByIdAndUpdate(
			chatId,
			{
				$push: { users: userId },
			},
			{ new: true }
		)
			.populate("users", "-password")
			.populate("groupAdmin", "-password");

		if (!added) return res.status(400).json("Add user to group fails");
		return res.status(200).json(added);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Remove an user from group
const removeFromGroup = asyncHandler(async (req, res) => {
	const { chatId, userId } = req.body;
	if (!chatId || !userId) return res.status(400).json("Not found");
	const removed = await Chat.findByIdAndUpdate(
		chatId,
		{
			$pull: { users: userId },
		},
		{ new: true }
	)
		.populate("users", "-password")
		.populate("groupAdmin", "-password");

	if (!removed) return res.status(400).json("Remove group fails");
	return res.status(200).res.json(removed);
});

module.exports = {
	accessChat,
	fetchChats,
	createGroupChat,
	renameGroup,
	addToGroup,
	removeFromGroup,
};
