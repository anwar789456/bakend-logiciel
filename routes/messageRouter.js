const express = require("express");
const router = express.Router();

const { getAllChatItems } = require("../controllers/messagerieController");

// Get all carousel items
router.get("/admin/api/get-chat-from-database", getAllChatItems);


module.exports = router;