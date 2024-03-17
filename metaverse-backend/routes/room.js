const express = require("express");
const roomRouter = express.Router();
const Room = require("../models/room.js");

roomRouter.get("/api/v1/room/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

roomRouter.get("/api/v1/room", async (req, res) => {
  try {
    const room = await Room.find();
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = roomRouter;