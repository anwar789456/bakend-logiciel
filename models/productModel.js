const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const productSchema = new mongoose.Schema({
    idProd: String,
    typeProd: String,
    nom: String,
    description: String,
    quantite: String,
    images: [{
        img: String,
        hyperPoints: [{ produitID: String, posX: String, posY: String }]
    }],
    minPrice: String,
    maxPrice: String,
    longueur: String,
    largeur: String,
    hauteur: String,
    profondeur_assise: { type: String, default: "" },
    display: { type: String, default: "oui" },
    categorie: String,
    disponibilite: String,
    options: [{option_name: String,prix_option: String,}],
    sizes: [{longueur: String,largeur: String,prix_option: String,prix_coffre: String,img_path: String}],
    mousse: [{mousse_name: String,mousse_prix: String,}],
    subcategorie: String,
    direction: String,
    delai: String,
    dimensions: [{
        display : String,
        thedimensiontype: String,
        longueur: String,
        largeur: String,
        hauteur: String,
        long: String,
        larg: String,
        image_url: String,
    }]
});
// This model will be initialized after the database connections are established
let Product;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Product && conn2) {
        Product = conn2.model('product', productSchema, 'produits');
    }
    return Product;
};

// Export both the model initialization function and the model
module.exports = {
    Product: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Product = model;
        return model;
    }
};