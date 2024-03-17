const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  
  roomId: {
    type: String,
    required: true,
  },
  ownerId: {
    required: true,
    type: String,
  },
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
