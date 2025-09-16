const devisModel = require("../models/devisModel");
const devisCompteurModel = require("../models/devisCompteurModel");
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
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

// Helper function to get initialized Devis model
const getDevisModel = () => {
  return devisModel.initModel();
};

// Helper function to generate devis number using counter
const generateDevisNumber = async () => {
  try {
    const DevisCompteur = devisCompteurModel.initModel();
    const Devis = getDevisModel();

    if (!DevisCompteur || !Devis) {
      throw new Error('Models not initialized');
    }

    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    // Get current counter
    let counter = await DevisCompteur.findOne();
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = await DevisCompteur.create({
        devisComptValue: '1',
        datedeviscompt: new Date()
      });
    }

    // Find the highest existing devis number for this year to sync counter
    const existingDevis = await Devis.find({
      devisNumber: { $regex: `^\\d+/${yearSuffix}$` }
    }).sort({ devisNumber: -1 }).limit(1);

    // Use the current counter value as the next devis number
    let nextNumber = parseInt(counter.devisComptValue, 10);

    // Check if the generated number already exists (extra safety)
    let devisNumber = `${nextNumber}/${yearSuffix}`;
    while (await Devis.findOne({ devisNumber })) {
      nextNumber++;
      devisNumber = `${nextNumber}/${yearSuffix}`;
    }

    // Update counter to next number for the next devis
    counter.devisComptValue = (nextNumber + 1).toString();
    counter.datedeviscompt = new Date();
    await counter.save();

    console.log(`Generated devis number: ${devisNumber}`);
    return devisNumber;
  } catch (error) {
    console.error('Error generating devis number:', error);
    throw error;
  }
};

// Get all devis items
const getAllDevisItems = async (req, res) => {
  try {
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }
    const devisItems = await Devis.find().sort({ createdAt: -1 });
    res.json(devisItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching devis items" });
  }
};

// Get devis by ID
const getDevisById = async (req, res) => {
  try {
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ message: "Devis not found" });
    }
    res.json(devis);
  } catch (err) {
    res.status(500).json({ message: "Error fetching devis" });
  }
};

// Create new devis
const createDevis = async (req, res) => {
  try {
    console.log('=== DEVIS CREATION DEBUG ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('clientType received:', req.body.clientType);
    console.log('clientType type:', typeof req.body.clientType);

    const Devis = getDevisModel();
    if (!Devis) {
      console.error('Devis model not initialized');
      return res.status(500).json({ message: "Devis model not initialized" });
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

    const devisNumber = await generateDevisNumber();
    console.log('Generated devis number:', devisNumber);

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

    // Calculate TVA for enterprises
    const clientType = req.body.clientType || 'particulier';
    console.log('Processing clientType:', clientType);
    console.log('Is entreprise?', clientType === 'entreprise');
    
    const tvaRate = clientType === 'entreprise' ? (req.body.tvaRate || 19) : 0;
    const tvaAmount = clientType === 'entreprise' ? (totalHT * tvaRate / 100) : 0;
    const totalTTC = totalHT + tvaAmount;

    // For particulier: totalAmount = totalHT, for entreprise: totalAmount = totalTTC
    const totalAmount = clientType === 'entreprise' ? totalTTC : totalHT;
    
    console.log('TVA calculations:');
    console.log('- tvaRate:', tvaRate);
    console.log('- tvaAmount:', tvaAmount);
    console.log('- totalTTC:', totalTTC);
    console.log('- totalAmount:', totalAmount);

    const devisData = {
      ...req.body,
      clientType,
      devisNumber,
      items,
      subtotal,
      totalDiscount,
      totalHT,
      tvaRate,
      tvaAmount,
      totalTTC,
      totalAmount,
      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
    };

    console.log('Final devis data before save:', JSON.stringify(devisData, null, 2));
    console.log('clientType in final data:', devisData.clientType);

    const newDevis = new Devis(devisData);
    const savedDevis = await newDevis.save();

    console.log('Devis saved successfully with ID:', savedDevis._id);
    console.log('Saved devis clientType:', savedDevis.clientType);
    console.log('Saved devis companyName:', savedDevis.companyName);
    console.log('Saved devis rc:', savedDevis.rc);
    console.log('=== END DEVIS CREATION DEBUG ===');
    
    res.status(201).json(savedDevis);
  } catch (err) {
    console.error('Error creating devis:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: "Error creating devis", error: err.message });
  }
};

// Update a devis by _id
const updateDevisById = async (req, res) => {
  try {
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }
    
    const id = req.params.id;
    
    // Recalculate totals if items are updated
    if (req.body.items) {
      let subtotal = 0;
      let totalDiscount = 0;
      
      const items = req.body.items.map(item => {
        const itemTotal = (item.quantity * item.unitPrice) * (1 - item.discount / 100);
        subtotal += item.quantity * item.unitPrice;
        totalDiscount += (item.quantity * item.unitPrice) * (item.discount / 100);
        return {
          ...item,
          total: itemTotal
        };
      });
      
      req.body.items = items;
      req.body.subtotal = subtotal;
      req.body.totalDiscount = totalDiscount;
      req.body.totalAmount = subtotal - totalDiscount;
    }
    
    req.body.updatedAt = new Date();
    
    const devisItem = await Devis.findByIdAndUpdate(id, req.body, { new: true });
    if (!devisItem) {
      return res.status(404).json({ message: "Devis item not found" });
    }
    res.json(devisItem);
  } catch (err) {
    res.status(500).json({ message: "Error updating devis", error: err.message });
  }
};

// Delete a devis by _id
const deleteDevisById = async (req, res) => {
  try {
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }
    
    const id = req.params.id;
    const deletedDevis = await Devis.findByIdAndDelete(id);
    if (!deletedDevis) {
      return res.status(404).json({ message: "Devis item not found" });
    }
    res.json({ message: "Devis item deleted successfully" });
  } catch (err) {
    console.error('Error deleting devis:', err);
    res.status(500).json({ message: "Error deleting devis", error: err.message });
  }
};

// Generate PDF for devis
const generateDevisPDF = async (req, res) => {
  try {
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }

    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ message: "Devis not found" });
    }

    // Choose PDF generation based on client type
    if (devis.clientType === 'entreprise') {
      return generateEntreprisePDF(devis, res);
    } else {
      return generateParticulierPDF(devis, res);
    }
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

// Generate PDF for entreprise clients
const generateEntreprisePDF = async (devis, res) => {
  const PDFDocument = require("pdfkit");
  const QRCode = require("qrcode");
  const path = require('path');

  const doc = new PDFDocument({ margin: 20, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=devis-entreprise-${devis.devisNumber}.pdf`
  );

  doc.pipe(res);

  // Génération QR code
  const qrData = `DEVIS ${devis.devisNumber} - ${devis.companyName || devis.clientName} - ${devis.totalAmount} DT`;
  const qrCodeBuffer = await QRCode.toBuffer(qrData, {
    width: 80,
    margin: 1,
  });

  // Logo et en-tête - utiliser le logo personnalisé ou le logo par défaut
  let imagePath;
  if (devis.customLogo && fs.existsSync(path.join(__dirname, '..', 'uploads', 'logos', devis.customLogo))) {
    imagePath = path.join(__dirname, '..', 'uploads', 'logos', devis.customLogo);
  } else {
    imagePath = path.join(__dirname, '..', 'images', 'image.png');
  }

  // En-tête société
  doc.fontSize(8).fillColor("#000").text("SATRACO s.a.r.l - IU:1280963K", 20, 20);

  // Logo SAMET HOME
  doc.image(imagePath, 20, 40, { width: 180 });

  // QR code
  doc.image(qrCodeBuffer, 20, 90, { width: 80, height: 80 });

  // Informations client entreprise (à droite)
  let clientStartY = 50;
  doc.font("Helvetica-Bold").fontSize(9);

  doc.text("CLIENT : ", 400, clientStartY);
  doc.font("Helvetica").text(devis.companyName || devis.clientName, 460, clientStartY);

  doc.font("Helvetica-Bold").text("ADRESSE : ", 400, clientStartY + 18);
  doc.font("Helvetica").text(devis.clientAddress, 460, clientStartY + 18);

  doc.font("Helvetica-Bold").text("CODE CLIENT : ", 400, clientStartY + 36);
  doc.font("Helvetica").text(devis.clientName, 460, clientStartY + 36);

  doc.font("Helvetica-Bold").text("R.C : ", 400, clientStartY + 54);
  doc.font("Helvetica").text(devis.rc || '', 460, clientStartY + 54);

  doc.font("Helvetica-Bold").text("Tel : ", 400, clientStartY + 72);
  doc.font("Helvetica").text(devis.clientPhone, 460, clientStartY + 72);

  doc.font("Helvetica-Bold").text("Fax : ", 400, clientStartY + 90);
  doc.font("Helvetica").text('', 460, clientStartY + 90);

  doc.font("Helvetica-Bold").text("Contact : ", 400, clientStartY + 108);
  doc.font("Helvetica").text(devis.clientName, 460, clientStartY + 108);

  if (devis.taxId) {
    doc.font("Helvetica-Bold").text("CRM : ", 400, clientStartY + 126);
    doc.font("Helvetica").text(devis.taxId, 460, clientStartY + 126);
    clientStartY += 18; // Ajuster pour le champ suivant
  }

  doc.font("Helvetica-Bold").text("Adresse Mail : ", 400, clientStartY + 144);
  doc.font("Helvetica").text(devis.email || '', 460, clientStartY + 144);

  // Titre centré
  doc.fontSize(16).fillColor("#000");
  doc.font("Helvetica-Bold").text(`DEVIS N° ${devis.devisNumber}`, 0, 200, {
    align: "center",
    width: doc.page.width,
  });

  doc.fontSize(10).font("Helvetica");
  doc.text(`Ariana le: ${new Date(devis.date).toLocaleDateString("fr-FR")}`, 0, 225, {
    align: "center",
    width: doc.page.width,
  });

  // Tableau des articles
  const startY = 280;
  const startX = 20;
  const tableWidth = 555;

  // Colonnes pour devis (sans TVA)
  const colWidths = [60, 300, 95, 100]; // Quantité, Description, Prix Unitaire, Total
  const headers = ["Quantité", "Description", "Prix Unitaire", "Total"];

  let currentX = startX;

  // Table header avec style gris
  doc.fontSize(10).fillColor("#666666");

  headers.forEach((header, index) => {
    if (index < colWidths.length) {
      doc.text(header, currentX + 2, startY + 8, {
        width: colWidths[index] - 4,
        align: index === 0 ? "left" : "center",
      });
      currentX += colWidths[index];
    }
  });

  // Ligne de séparation sous l'en-tête
  doc.strokeColor("#000000").lineWidth(1);
  doc.moveTo(startX, startY + 25).lineTo(startX + tableWidth, startY + 25).stroke();

  // Lignes des articles
  let rowY = startY + 25;
  devis.items.forEach((item) => {
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

    // Quantité
    doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
      width: colWidths[0] - 4,
      align: "center",
    });
    currentX += colWidths[0];

    // Description du produit
    doc.text(item.description, currentX + 2, rowY + 8, {
      width: colWidths[1] - 4,
      align: "left",
    });
    currentX += colWidths[1];

    // Prix unitaire du produit de base
    doc.text(`${basePrice.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[2] - 4,
      align: "center",
    });
    currentX += colWidths[2];

    // Total du produit de base
    doc.text(`${baseTotalAfterDiscount.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[3] - 4,
      align: "center",
    });

    rowY += 25;

    // Ligne séparée pour l'option si elle existe - sans bordures
    if (item.selectedOption && optionPrice > 0) {
      const optionTotal = quantity * optionPrice;
      currentX = startX;
      doc.fontSize(10).fillColor("#333333");
      
      // Quantité vide pour l'option
      currentX += colWidths[0];
      
      // Description de l'option
      doc.text(`(Option: ${item.selectedOption.option_name})`, currentX + 2, rowY + 8, {
        width: colWidths[1] - 4,
        align: "left",
      });
      currentX += colWidths[1];
      
      // Prix unitaire de l'option
      doc.text(`${optionPrice.toFixed(0)} DT`, currentX + 2, rowY + 8, {
        width: colWidths[2] - 4,
        align: "center",
      });
      currentX += colWidths[2];
      
      // Total de l'option
      doc.text(`${optionTotal.toFixed(0)} DT`, currentX + 2, rowY + 8, {
        width: colWidths[3] - 4,
        align: "center",
      });
      
      rowY += 25;
    }
  });

  // Ligne de total séparée et alignée à droite
  rowY += 20;
  const totalRowHeight = 25;
  const totalBoxWidth = 200;
  
  // Dessiner le cadre du total aligné à droite
  const totalBoxX = startX + tableWidth - totalBoxWidth;
  
  // Texte "Total" à gauche
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333");
  doc.text("Total", totalBoxX + 2, rowY + 8, {
    width: totalBoxWidth - 82,
    align: "center",
  });
  
  // Montant total à droite
  doc.text(`${devis.totalAmount.toFixed(0)}`, totalBoxX + totalBoxWidth - 78, rowY + 8, {
    width: 76,
    align: "center",
  });
  
  rowY += totalRowHeight;

  // Conditions de livraison
  rowY += 40;
  doc.fontSize(10).fillColor("#000");
  doc.text("LA LIVRAISON EST GRATUITE UNIQUEMENT SUR LE GRAND TUNIS (TUNIS, ARIANA, MANOUBA, BEN AROUS)", 0, rowY, {
    width: doc.page.width,
    align: "center",
  });

  // Footer
  doc.font("Helvetica").fontSize(8).fillColor("#000");
  doc.text(
    "SATRACO s.a.r.l au Capital de 10.000 DT Av Abou Kacem Chebbi - 2080 - Ariana RC. B038912013    MF. 1280963K/A/M/000",
    0,
    doc.page.height - 30,
    {
      width: doc.page.width,
      align: "center",
    }
  );

  doc.end();
};

// Generate PDF for particulier clients (existing function)
const generateParticulierPDF = async (devis, res) => {
  const PDFDocument = require("pdfkit");
  const QRCode = require("qrcode");
  const path = require('path');

  const doc = new PDFDocument({ margin: 20, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=devis-${devis.devisNumber}.pdf`
  );

  doc.pipe(res);

  // Génération QR code
  const qrData = `DEVIS ${devis.devisNumber} - ${devis.clientName} - ${devis.totalAmount} DT`;
  const qrCodeBuffer = await QRCode.toBuffer(qrData, {
    width: 80,
    margin: 1,
  });

  // Logo - utiliser le logo personnalisé ou le logo par défaut
  let imagePath;
  if (devis.customLogo && fs.existsSync(path.join(__dirname, '..', 'uploads', 'logos', devis.customLogo))) {
    imagePath = path.join(__dirname, '..', 'uploads', 'logos', devis.customLogo);
  } else {
    imagePath = path.join(__dirname, '..', 'images', 'image.png');
  }

  // En-tête société
  doc.fontSize(8).fillColor("#000").text("SATRACO s.a.r.l - IU:1280963K", 20, 20, {
    characterSpacing:1,
  });

  // Logo SAMET HOME
  doc.image(imagePath, 20, 40, { width: 180 });

  // QR code
  doc.image(qrCodeBuffer, 20, 90, { width: 80, height: 80 });

  // Infos client
  let clientStartY = 50;
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("CLIENT : ", 400, clientStartY);
  doc.font("Helvetica").text(devis.clientName, 460, clientStartY);

  doc.font("Helvetica-Bold").text("ADRESSE : ", 400, clientStartY + 15);
  doc.font("Helvetica").text(devis.clientAddress, 460, clientStartY + 15);

  doc.font("Helvetica-Bold").text("Téléphone : ", 400, clientStartY + 36);
  doc.font("Helvetica").text(devis.clientPhone, 460, clientStartY + 36);

  // Titre centré
  doc.fontSize(16).fillColor("#000");
  doc.font("Helvetica-Bold").text(`DEVIS N° ${devis.devisNumber}`, 0, 200, {
    align: "center",
    width: doc.page.width,
  });

  doc.fontSize(10).font("Helvetica");
  doc.text(`Ariana le: ${new Date(devis.date).toLocaleDateString("fr-FR")}`, 0, 225, {
    align: "center",
    width: doc.page.width,
  });

  // Tableau avec style facture - sans bordures
  const startY = 280;
  const startX = 20;
  const tableWidth = 555;

  // Colonnes pour devis (sans TVA) - style facture avec Ref Color
  const colWidths = [240, 60, 95, 80, 80]; // Description, Quantité, Ref Color, Prix Unitaire, Total
  const headers = ["Description", "Quantité", "Ref Color", "Prix Unitaire", "Total"];

  let currentX = startX;

  // En-têtes avec style gris
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

  let rowY = startY + 25;
  devis.items.forEach((item) => {
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
    doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
      width: colWidths[1] - 4,
      align: "center",
    });
    currentX += colWidths[1];

    // Ref Color
    doc.text(item.refColor || "", currentX + 2, rowY + 8, {
      width: colWidths[2] - 4,
      align: "center",
    });
    currentX += colWidths[2];

    // Prix unitaire du produit de base
    doc.text(`${basePrice.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[3] - 4,
      align: "center",
    });
    currentX += colWidths[3];

    // Total du produit de base
    doc.text(`${baseTotalAfterDiscount.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[4] - 4,
      align: "center",
    });

    rowY += 25;

    // Ligne séparée pour l'option si elle existe - sans bordures
    if (item.selectedOption && optionPrice > 0) {
      const optionTotal = quantity * optionPrice;
      currentX = startX;
      doc.fontSize(10).fillColor("#333333");
      
      // Description de l'option
      doc.text(`(Option: ${item.selectedOption.option_name})`, currentX + 2, rowY + 8, {
        width: colWidths[0] - 4,
        align: "left",
      });
      currentX += colWidths[0];
      
      // Quantité vide pour l'option
      currentX += colWidths[1];
      
      // Ref Color vide pour l'option
      currentX += colWidths[2];
      
      // Prix unitaire de l'option
      doc.text(`${optionPrice.toFixed(0)} DT`, currentX + 2, rowY + 8, {
        width: colWidths[3] - 4,
        align: "center",
      });
      currentX += colWidths[3];
      
      // Total de l'option
      doc.text(`${optionTotal.toFixed(0)} DT`, currentX + 2, rowY + 8, {
        width: colWidths[4] - 4,
        align: "center",
      });
      
      rowY += 25;
    }
  });

  // Ligne de séparation avant le total
  doc.strokeColor("#000000").lineWidth(1);
  doc.moveTo(startX, rowY + 10).lineTo(startX + tableWidth, rowY + 10).stroke();

  // Total avec style gris - espacement augmenté
  rowY += 40;
  const totalBoxWidth = 200;
  const totalBoxHeight = 25;
  const totalBoxX = startX + tableWidth - totalBoxWidth;
  
  // Dessiner le cadre du total
  doc.strokeColor("#000000").lineWidth(1);
  doc.rect(totalBoxX, rowY, totalBoxWidth, totalBoxHeight).stroke();
  
  // Ligne verticale pour séparer "Total" du montant
  doc.moveTo(totalBoxX + totalBoxWidth - 80, rowY).lineTo(totalBoxX + totalBoxWidth - 80, rowY + totalBoxHeight).stroke();
  
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#666666");
  doc.text("Total", totalBoxX + 2, rowY + 8, {
    width: totalBoxWidth - 82,
    align: "center",
  });
  
  doc.text(`${devis.totalAmount.toFixed(0)} DT`, totalBoxX + totalBoxWidth - 78, rowY + 8, {
    width: 76,
    align: "center",
  });
  rowY += 50;
  // DÉLAIS DE LIVRAISON
  doc.fontSize(10).fillColor("#000");
  doc.text(`Délais de livraison: ${devis.deliveryDelay}`, 0, rowY, {
    width: doc.page.width,
    align: "center",
  });

  // FOOTER
  rowY += 80;
  doc.font("Helvetica").fontSize(8).fillColor("#000");
  doc.text(
    "Rib Ste SATRACO: 20003032210028360584 Banque: BTK Agence: Ariana",
    0,
    rowY,
    {
      width: doc.page.width,
      align: "center",
    }
  );
  doc.text(devis.paymentTerms, 0, rowY + 15, {
    width: doc.page.width,
    align: "center",
  });

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text(devis.deliveryCondition, 0, rowY + 30, {
    width: doc.page.width,
    align: "center",
  });

  doc.font("Helvetica").fontSize(8);
  doc.text(
    "Avenue Abou Kacem Chebbi / Tél: 56 834 015 / 56 834 016",
    0,
    doc.page.height - 30,
    {
      width: doc.page.width,
      align: "center",
    }
  );

  doc.end();
};

// Upload logo for devis
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const logoPath = req.file.filename;
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
  getAllDevisItems, 
  getDevisById,
  createDevis,
  updateDevisById, 
  deleteDevisById,
  generateDevisPDF,
  uploadLogo,
  getLogo,
  upload
};