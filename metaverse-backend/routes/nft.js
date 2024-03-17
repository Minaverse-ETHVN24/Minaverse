const express = require("express");
const nftRouter = express.Router();
const Nft = require("../models/nft.js");



nftRouter.post("/api/v1/add-nft", async (req, res) => {
  try {
    let nft = new Nft(req.body);
    nft = await nft.save();
    res.json(nft);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

nftRouter.get("/api/v1/nft", async (req, res) => {
  try {
    const nft = await Nft.find();
    res.json(nft);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

nftRouter.get("/api/v1/nft/:id", async (req, res) => {
  try {
    const nft = await Nft.find({ownerId:req.params.id});
    res.json(nft);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

nftRouter.get("/api/v1/nft/:roomId/:imageId/imageUrl", async (req, res) => {
  try {
    const nft = await Nft.findOne({roomId:req.params.roomId,imageId:req.params.imageId});
    res.json(nft.imageUrl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

nftRouter.get("/api/v1/nft/:roomId/:imageId/openSeaUrl", async (req, res) => {
  try {
    const nft = await Nft.findOne({roomId:req.params.roomId,imageId:req.params.imageId});
    res.json(nft.openSeaUrl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = nftRouter;
