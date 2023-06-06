const express = require("express");
const app = express();
const dotenv = require("dotenv");
const logger = require("morgan");
const cors = require("cors");
const connectDB = require("./database/db");
const userRouter = require("./routes/userRoutes");
const chatRouter = require("./routes/chatRoutes");
const messageRouter = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
dotenv.config();

// Connect DB
connectDB();

// Middlewares
app.use(express.json());
app.use(logger("tiny"));
app.use(cors());

// Routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

app.get("/", (req, res) => {
	res.send(`API running successfully`);
});

// Deployment

// Error middleware
app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.PORT || 4000, () => {
	console.log(`Server is up on http://localhost:${process.env.PORT || 4000}`);
});

// setup socket io
const io = require("socket.io")(server, {
	pingTimeout: 60000,
	cors: {
		origin: "http://localhost:3000",
	},
});

// connection
io.on("connection", (socket) => {
	console.log(`Connected to socket.io`);

	socket.on("setup", (userData) => {
		socket.join(userData._id);
		// console.log("userData._id",userData._id);
		socket.emit("USER CONNECTED");
	});

	socket.on("join chat", (room) => {
		socket.join(room);
		// console.log("User joined room: " + room);
	});

	socket.on("typing", (room) => socket.in(room).emit("typing"));
	socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

	socket.on("new message", (newMessageReceived) => {
		var chat = newMessageReceived.chat;

		if (!chat.users) return console.log("chat.users not defined");

		chat.users.forEach((user) => {
			// console.log("caht user _id",user._id,newMessageReceived.sender?._id)
			if (user._id == newMessageReceived.sender?._id) return;

			socket.in(user._id).emit("message received", newMessageReceived);
		});
	});

	socket.off("setup", () => {
		console.log("USER DISCONNECTED");
		socket.leave(userData._id);
	});
});
