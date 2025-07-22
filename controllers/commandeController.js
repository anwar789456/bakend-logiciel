const commandeModel = require("../models/Commande");
let Commande = commandeModel.initModel();

const getAllCommandeItems = async (req, res) => {
    try {
        const items = await Commande.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching Commande items", error });
    }
};

module.exports = { getAllCommandeItems };