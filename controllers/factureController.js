const factureModel = require("../models/factureModel");
const factureCompteurModel = require("../models/factureCompteurModel");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration multer pour l'upload de logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, bmp, webp)'));
    }
  }
});

// Helper function to get initialized Facture model
const getFactureModel = () => {
  return factureModel.initModel();
};

// Helper function to generate facture number using counter
const generateFactureNumber = async () => {
  try {
    const FactureCompteur = factureCompteurModel.initModel();
    const Facture = getFactureModel();

    if (!FactureCompteur || !Facture) {
      throw new Error('Models not initialized');
    }

    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    // Get current counter
    let counter = await FactureCompteur.findOne();
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = await FactureCompteur.create({
        factureComptValue: '1',
        datefacturecompt: new Date()
      });
    }

    // Find the highest existing facture number for this year to sync counter
    const existingFactures = await Facture.find({
      factureNumber: { $regex: `^\\d+/${yearSuffix}$` }
    }).sort({ factureNumber: -1 }).limit(1);

    // Use the current counter value as the next facture number
    let nextNumber = parseInt(counter.factureComptValue, 10);

    // Check if the generated number already exists (extra safety)
    let factureNumber = `${nextNumber}/${yearSuffix}`;
    while (await Facture.findOne({ factureNumber })) {
      nextNumber++;
      factureNumber = `${nextNumber}/${yearSuffix}`;
    }

    // Update counter to next number for the next facture
    counter.factureComptValue = (nextNumber + 1).toString();
    counter.datefacturecompt = new Date();
    await counter.save();

    console.log(`Generated facture number: ${factureNumber}`);
    return factureNumber;
  } catch (error) {
    console.error('Error generating facture number:', error);
    throw error;
  }
};

// Get all facture items
const getAllFactureItems = async (req, res) => {
  try {
    const Facture = getFactureModel();
    if (!Facture) {
      return res.status(500).json({ message: "Facture model not initialized" });
    }
    const factureItems = await Facture.find().sort({ createdAt: -1 });
    res.json(factureItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching facture items" });
  }
};

// Get facture by ID
const getFactureById = async (req, res) => {
  try {
    const Facture = getFactureModel();
    if (!Facture) {
      return res.status(500).json({ message: "Facture model not initialized" });
    }
    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({ message: "Facture not found" });
    }
    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: "Error fetching facture" });
  }
};

// Create new facture
const createFacture = async (req, res) => {
  try {
    console.log('Creating facture with data:', JSON.stringify(req.body, null, 2));

    const Facture = getFactureModel();
    if (!Facture) {
      console.error('Facture model not initialized');
      return res.status(500).json({ message: "Facture model not initialized" });
    }

    // Validate required fields
    if (!req.body.clientName || !req.body.clientAddress || !req.body.clientPhone) {
      return res.status(400).json({
        message: "Missing required fields: clientName, clientAddress, clientPhone"
      });
    }

    // Validate enterprise-specific fields
    if (req.body.clientType === 'entreprise') {
      if (!req.body.companyName || !req.body.rc) {
        return res.status(400).json({
          message: "Missing required fields for enterprise: companyName, rc"
        });
      }
    }

    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        message: "Items array is required and must not be empty"
      });
    }

    // Validate items
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      if (!item.quantity || !item.description || item.unitPrice === undefined) {
        return res.status(400).json({
          message: `Item ${i + 1} is missing required fields: quantity, description, unitPrice`
        });
      }
    }

    const factureNumber = await generateFactureNumber();
    console.log('Generated facture number:', factureNumber);

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;

    const items = req.body.items.map(item => {
      const itemTotal = (item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100);
      subtotal += item.quantity * item.unitPrice;
      totalDiscount += (item.quantity * item.unitPrice) * ((item.discount || 0) / 100);
      return {
        ...item,
        discount: item.discount || 0,
        total: itemTotal
      };
    });

    const totalHT = subtotal - totalDiscount;

    // Calculate TVA for both particulier and entreprise
    const clientType = req.body.clientType || 'particulier';
    const tvaRate = req.body.tvaRate || 19; // TVA pour tous les types de clients
    const tvaAmount = totalHT * tvaRate / 100;
    const totalTTC = totalHT + tvaAmount;

    // totalAmount = totalTTC for both types
    const totalAmount = totalTTC;

    const factureData = {
      ...req.body,
      clientType,
      factureNumber,
      items,
      subtotal,
      totalDiscount,
      totalHT,
      tvaRate,
      tvaAmount,
      totalTTC,
      totalAmount
    };

    console.log('Creating facture with processed data:', JSON.stringify(factureData, null, 2));

    const newFacture = new Facture(factureData);
    const savedFacture = await newFacture.save();

    console.log('Facture created successfully:', savedFacture._id);
    res.status(201).json(savedFacture);
  } catch (err) {
    console.error('Error creating facture:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: "Error creating facture", error: err.message });
  }
};

// Update a facture by _id
const updateFactureById = async (req, res) => {
  try {
    const Facture = getFactureModel();
    if (!Facture) {
      return res.status(500).json({ message: "Facture model not initialized" });
    }
    
    const id = req.params.id;
    
    // Recalculate totals if items are updated
    if (req.body.items) {
      let subtotal = 0;
      let totalDiscount = 0;
      
      const items = req.body.items.map(item => {
        const itemTotal = (item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100);
        subtotal += item.quantity * item.unitPrice;
        totalDiscount += (item.quantity * item.unitPrice) * ((item.discount || 0) / 100);
        return {
          ...item,
          total: itemTotal
        };
      });
      
      const totalHT = subtotal - totalDiscount;
      const clientType = req.body.clientType || 'particulier';
      const tvaRate = clientType === 'entreprise' ? (req.body.tvaRate || 19) : 0;
      const tvaAmount = clientType === 'entreprise' ? (totalHT * tvaRate / 100) : 0;
      const totalTTC = totalHT + tvaAmount;
      const totalAmount = clientType === 'entreprise' ? totalTTC : totalHT;
      
      req.body.items = items;
      req.body.subtotal = subtotal;
      req.body.totalDiscount = totalDiscount;
      req.body.totalHT = totalHT;
      req.body.tvaAmount = tvaAmount;
      req.body.totalTTC = totalTTC;
      req.body.totalAmount = totalAmount;
    }
    
    req.body.updatedAt = new Date();
    
    const factureItem = await Facture.findByIdAndUpdate(id, req.body, { new: true });
    if (!factureItem) {
      return res.status(404).json({ message: "Facture item not found" });
    }
    res.json(factureItem);
  } catch (err) {
    res.status(500).json({ message: "Error updating facture", error: err.message });
  }
};

// Delete a facture by _id
const deleteFactureById = async (req, res) => {
  try {
    const Facture = getFactureModel();
    if (!Facture) {
      return res.status(500).json({ message: "Facture model not initialized" });
    }
    
    const id = req.params.id;
    const deletedFacture = await Facture.findByIdAndDelete(id);
    if (!deletedFacture) {
      return res.status(404).json({ message: "Facture item not found" });
    }
    res.json({ message: "Facture item deleted successfully" });
  } catch (err) {
    console.error('Error deleting facture:', err);
    res.status(500).json({ message: "Error deleting facture", error: err.message });
  }
};

// Generate PDF for facture - matching the provided template exactly
const generateFacturePDF = async (req, res) => {
  try {
    const Facture = getFactureModel();
    if (!Facture) {
      return res.status(500).json({ message: "Facture model not initialized" });
    }

    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({ message: "Facture not found" });
    }

    const PDFDocument = require("pdfkit");
    const path = require('path');
    const fs = require('fs');

    const doc = new PDFDocument({ margin: 20, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=facture-${facture.factureNumber}.pdf`
    );

    doc.pipe(res);

    // Company info at top left
    doc.fontSize(8).fillColor("#000").text("Raison Sociale: SATRACO", 20, 20);
    doc.text("Code TVA: 1280963K/A/M/000", 20, 32);
    doc.text("Adresse: Avenue Abou El Kacem Al Chebbi", 20, 44);
    doc.text("GSM: 56834015", 20, 56);
    doc.text("E-Mail: design@samethome.com", 20, 68);

    // Logo - utiliser le logo personnalisé ou le logo par défaut
    let imagePath;
    console.log('Facture customLogo:', facture.customLogo);
    if (facture.customLogo && fs.existsSync(path.join(__dirname, '..', 'uploads', 'logos', facture.customLogo))) {
      imagePath = path.join(__dirname, '..', 'uploads', 'logos', facture.customLogo);
      console.log('Using custom logo:', imagePath);
    } else {
      imagePath = path.join(__dirname, '..', 'images', 'image.png');
      console.log('Using default logo:', imagePath);
    }
    doc.image(imagePath, 20, 90, { width: 180 });

    // Client info at top right
    let clientStartY = 63;
    doc.font("Helvetica-Bold").fontSize(9);

    doc.text("Client: ", 400, clientStartY);
    doc.font("Helvetica").text(facture.companyName || facture.clientName, 450, clientStartY);

    doc.font("Helvetica-Bold").text("Code TVA: ", 400, clientStartY + 18);
    doc.font("Helvetica").text(facture.taxId || '', 450, clientStartY + 18);

    doc.font("Helvetica-Bold").text("Adresse: ", 400, clientStartY + 36);
    doc.font("Helvetica").text(facture.clientAddress, 450, clientStartY + 36);

    doc.font("Helvetica-Bold").text("GSM: ", 400, clientStartY + 54);
    doc.font("Helvetica").text(facture.clientPhone, 450, clientStartY + 54);

    // Title centered
    doc.fontSize(16).fillColor("#000");
    doc.font("Helvetica-Bold").text(`FACTURE N°${facture.factureNumber}`, 0, 200, {
      align: "center",
      width: doc.page.width,
    });

    doc.fontSize(10).font("Helvetica");
    doc.text(`Ariana le: ${new Date(facture.date).toLocaleDateString("fr-FR")}`, 0, 225, {
      align: "center",
      width: doc.page.width,
    });

    // Table
    const startY = 280;
    const startX = 20;
    const tableWidth = 555;

    // Column widths matching the template
    const colWidths = [200, 60, 80, 60, 80]; // Description, Quantité, Prix unitaire, Taxes, Montant
    const headers = ["Description", "Quantité", "Prix unitaire", "Taxes", "Montant"];

    let currentX = startX;

    // Table header avec style gris
    doc.fontSize(10).fillColor("#666666");

    headers.forEach((header, index) => {
      doc.text(header, currentX + 2, startY + 8, {
        width: colWidths[index] - 4,
        align: index === 0 ? "left" : "center",
      });
      currentX += colWidths[index];
    });

    // Ligne de séparation sous l'en-tête
    doc.strokeColor("#000000").lineWidth(1);
    doc.moveTo(startX, startY + 25).lineTo(startX + tableWidth, startY + 25).stroke();

    // Lignes des articles
    let rowY = startY + 25;
    facture.items.forEach((item) => {
      const productTva = parseFloat(item.tva) || 19;
      const optionTva = parseFloat(item.optionTva) || parseFloat(item.selectedOption?.tva) || productTva;
      const basePrice = parseFloat(item.basePrice) || parseFloat(item.unitPrice) || 0;
      const optionPrice = item.selectedOption ? parseFloat(item.selectedOption.prix_option) || 0 : 0;
      const quantity = parseFloat(item.quantity) || 1;
      const discount = parseFloat(item.discount) || 0;
      
      // Calcul du prix après remise pour le produit de base
      const basePriceAfterDiscount = basePrice * (1 - discount / 100);
      const baseTotalAfterDiscount = quantity * basePriceAfterDiscount;

      // Ligne principale du produit - sans bordures
      currentX = startX;
      doc.fontSize(10).fillColor("#333333");

      // Description du produit
      doc.text(item.description, currentX + 2, rowY + 8, {
        width: colWidths[0] - 4,
        align: "left",
      });
      currentX += colWidths[0];

      // Quantité
      doc.text(item.quantity.toFixed(2), currentX + 2, rowY + 8, {
        width: colWidths[1] - 4,
        align: "center",
      });
      currentX += colWidths[1];

      // Prix unitaire du produit de base
      doc.text(`${basePrice.toFixed(2)}`, currentX + 2, rowY + 8, {
        width: colWidths[2] - 4,
        align: "center",
      });
      currentX += colWidths[2];

      // TVA du produit
      doc.text(`${productTva}%`, currentX + 2, rowY + 8, {
        width: colWidths[3] - 4,
        align: "center",
      });
      currentX += colWidths[3];

      // Montant du produit de base
      doc.text(`${baseTotalAfterDiscount.toFixed(3)} DT`, currentX + 2, rowY + 8, {
        width: colWidths[4] - 4,
        align: "center",
      });

      rowY += 25;

      // Ligne séparée pour l'option si elle existe - sans bordures
      if (item.selectedOption && optionPrice > 0) {
        const optionTotal = quantity * optionPrice;
        currentX = startX;
        
        // Description de l'option
        doc.text(item.selectedOption.option_name, currentX + 2, rowY + 8, {
          width: colWidths[0] - 4,
          align: "left",
        });
        currentX += colWidths[0];
        
        // Quantité
        doc.text(item.quantity.toFixed(2), currentX + 2, rowY + 8, {
          width: colWidths[1] - 4,
          align: "center",
        });
        currentX += colWidths[1];
        
        // Prix de l'option
        doc.text(`${optionPrice.toFixed(2)}`, currentX + 2, rowY + 8, {
          width: colWidths[2] - 4,
          align: "center",
        });
        currentX += colWidths[2];
        
        // TVA de l'option
        doc.text(`${optionTva}%`, currentX + 2, rowY + 8, {
          width: colWidths[3] - 4,
          align: "center",
        });
        currentX += colWidths[3];
        
        // Montant de l'option
        doc.text(`${optionTotal.toFixed(3)} DT`, currentX + 2, rowY + 8, {
          width: colWidths[4] - 4,
          align: "center",
        });
        
        rowY += 25;
      }
    });

    // Ajouter informations supplémentaires
    rowY += 30;
    doc.fontSize(10).fillColor("#666666");
    doc.text("Conditions de paiement : 21 jours", startX, rowY);
    rowY += 40;
    doc.text(`Communication de paiement : ${facture.factureNumber}`, startX, rowY);

    // Summary table à droite - style comme l'image
    const summaryX = 350;
    const summaryWidth = 200;
    let summaryY = rowY - 60;

    // Ligne de séparation en haut
    doc.strokeColor("#000000").lineWidth(1);
    doc.moveTo(summaryX, summaryY).lineTo(summaryX + summaryWidth - 20, summaryY).stroke();
    summaryY += 15;

    // MONTANT HORS TAXES d'abord
    doc.fontSize(10).fillColor("#333333");
    doc.text("Montant hors taxes", summaryX, summaryY);
    doc.text(`${facture.totalHT.toFixed(3)} DT`, summaryX + summaryWidth - 80, summaryY);
    summaryY += 25;

    // Ligne de séparation après montant HT
    doc.strokeColor("#000000").lineWidth(1);
    doc.moveTo(summaryX, summaryY).lineTo(summaryX + summaryWidth - 20, summaryY).stroke();
    summaryY += 15;

    // TVA Details après le montant HT - toujours afficher même pour particuliers
    // Regrouper les articles et options par taux de TVA
    const tvaGroups = {};
    
    facture.items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const basePrice = parseFloat(item.basePrice) || parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discount) || 0;
      const optionPrice = item.selectedOption ? parseFloat(item.selectedOption.prix_option) || 0 : 0;
      
      const productTva = parseFloat(item.tva) || 19;
      const optionTva = parseFloat(item.optionTva) || parseFloat(item.selectedOption?.tva) || productTva;
      
      // Montant HT après remise pour le produit
      const basePriceAfterDiscount = quantity * basePrice * (1 - discount / 100);
      
      // Ajouter au groupe TVA du produit
      if (!tvaGroups[productTva]) {
        tvaGroups[productTva] = 0;
      }
      tvaGroups[productTva] += basePriceAfterDiscount;
      
      // Ajouter au groupe TVA de l'option si elle existe
      if (item.selectedOption && optionPrice > 0) {
        const optionPriceTotal = quantity * optionPrice;
        
        if (!tvaGroups[optionTva]) {
          tvaGroups[optionTva] = 0;
        }
        tvaGroups[optionTva] += optionPriceTotal;
      }
    });
    
    // Afficher les détails TVA pour tous les clients
    Object.entries(tvaGroups).forEach(([rate, baseAmount]) => {
      const tvaAmount = baseAmount * parseFloat(rate) / 100;
      
      doc.fontSize(10).fillColor("#333333");
      doc.text(`TVA ${rate}% sur ${baseAmount.toFixed(3)} DT`, summaryX, summaryY);
      doc.text(`${tvaAmount.toFixed(3)} DT`, summaryX + summaryWidth - 60, summaryY);
      summaryY += 25;
    });

    // Ligne de séparation avant le total
    summaryY += 10;
    doc.strokeColor("#000000").lineWidth(1);
    doc.moveTo(summaryX, summaryY).lineTo(summaryX + summaryWidth - 20, summaryY).stroke();
    summaryY += 15;

    // TOTAL TTC uniquement (couleur grise)
    doc.fontSize(11).fillColor("#666666").font("Helvetica-Bold");
    doc.text("Total", summaryX, summaryY);
    doc.text(`${facture.totalAmount.toFixed(3)} DT`, summaryX + summaryWidth - 80, summaryY);


    // Footer
    doc.font("Helvetica").fontSize(8).fillColor("#000");
    doc.text(
      "SATRACO s.a.r.l au Capital de 10.000 DT / RC. B038912013 / MF. 1280963K/A/M/000",
      0,
      doc.page.height - 30,
      {
        width: doc.page.width,
        align: "center",
      }
    );

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

// Upload logo for facture
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const logoPath = req.file.filename;
    console.log('Logo uploaded for facture:', logoPath);
    res.json({ 
      message: "Logo uploadé avec succès",
      logoPath: logoPath,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: "Erreur lors de l'upload du logo", error: error.message });
  }
};

// Get uploaded logo
const getLogo = async (req, res) => {
  try {
    const logoName = req.params.logoName;
    const logoPath = path.join(__dirname, '..', 'uploads', 'logos', logoName);
    
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ message: "Logo non trouvé" });
    }
    
    res.sendFile(logoPath);
  } catch (error) {
    console.error('Error getting logo:', error);
    res.status(500).json({ message: "Erreur lors de la récupération du logo", error: error.message });
  }
};

module.exports = { 
  getAllFactureItems, 
  getFactureById,
  createFacture,
  updateFactureById, 
  deleteFactureById,
  generateFacturePDF,
  uploadLogo,
  getLogo,
  upload
};
