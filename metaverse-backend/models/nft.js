const mongoose = require("mongoose");

const nftSchema = mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  ownerId: {
    required: true,
    type: String,
  },
  imageUrl: {
    required: true,
    type: String,
  },
  openSeaUrl: {
    required: true,
    type: String,
  },
  imageId: {
    required: true,
    type: String,
  },

});

const Nft = mongoose.model("Nft", nftSchema);
module.exports = Nft;
