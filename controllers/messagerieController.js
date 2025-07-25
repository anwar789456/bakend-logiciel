const chatModel = require("../models/messagerieModel");
let Chat = chatModel.initModel();

const getAllChatItems = async (req, res) => {
    try {
        const items = await Chat.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching carousel items", error });
    }
};


module.exports = { getAllChatItems };