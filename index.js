// Setup basic express server
var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;
var os = require("os");
let network = os.networkInterfaces();
let ip;
Object.keys(os.networkInterfaces()).forEach(key => {
  let values = network[key];
  values.forEach(value => {
    if (value.family === "IPv4") {
      ip = value.address;
    }
  });
});
server.listen(port, () => {
  console.log("Server listening at port ", "10.37.4.252", port);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));

// Chatroom

var numUsers = 0;

io.on("connection", socket => {
  let ip;
  try {
    ip = socket.request.socket._peername.address;
  } catch (error) {}
  var addedUser = false;
  socket.ip = ip;
  // when the client emits 'new message', this listens and executes
  socket.on("new message", data => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username + ip,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on("add user", username => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username + socket.ip;
    ++numUsers;
    addedUser = true;
    socket.emit("login", {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", () => {
    socket.broadcast.emit("typing", {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing", {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
