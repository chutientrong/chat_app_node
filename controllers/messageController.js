const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");

const sendMessage = asyncHandler(async (req, res) => {
	try {
		const { content, chatId } = req.body;

		if (!content || !chatId || !req.user.id) {
			return res.status(400).json("Not found");
		}

		var newMessage = {
			sender: req.user.id,
			content: content,
			chat: chatId,
		};

		// create message
		var message = await Message.create(newMessage);
		message = await message.populate("sender", "name");
		message = await message.populate("chat");
		message = await User.populate(message, {
			path: "chat.users",
			select: "name email",
		});

		if (!message) return res.status(400).json("Create Message Fails");

		// update chat
		await Chat.findByIdAndUpdate(req.body.chatId, {
			latestMessage: message,
		});

		return res.status(200).json(message);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

// Fetching all messages
const allMessages = asyncHandler(async (req, res) => {
	try {
		const { chatId } = req.params;
		if (!chatId) return res.status(400).json("Not found");

		// get all message
		const messages = await Message.find({ chat: chatId })
			.populate("sender", "name pic email")
			.populate("chat");

		if (!messages) return res.status(400).json("Getting Messages Fails");
		
		return res.status(200).json(messages);
	} catch (error) {
		return res.status(400).json(error.message);
	}
});

module.exports = { sendMessage, allMessages };
