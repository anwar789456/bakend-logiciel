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

  // Colonnes pour entreprise
  const colWidths = [115, 180, 80, 80, 100]; // Description, Ref Color, Nombre d'unité, Prix, Total
  const headers = ["Description", "Ref Color", "Nombre d'unité", "Prix", "Total"];

  let currentX = startX;

  // En-tête du tableau
  doc.rect(startX, startY, tableWidth, 25).stroke();
  doc.fontSize(9).fillColor("#000");

  headers.forEach((header, index) => {
    if (index < colWidths.length) {
      doc.text(header, currentX + 2, startY + 8, {
        width: colWidths[index] - 4,
        align: "center",
      });
      currentX += colWidths[index];
    }
  });

  // Lignes verticales de l'en-tête
  currentX = startX;
  for (let i = 0; i < colWidths.length - 1; i++) {
    currentX += colWidths[i];
    doc.moveTo(currentX, startY).lineTo(currentX, startY + 25).stroke();
  }

  // Lignes des articles
  let rowY = startY + 25;
  devis.items.forEach((item) => {
    const rowHeight = 25;
    doc.rect(startX, rowY, tableWidth, rowHeight).stroke();
    currentX = startX;

    doc.fontSize(9).fillColor("#000");

    // Description
    doc.text(item.description, currentX + 2, rowY + 4, {
      width: colWidths[0] - 4,
    });
    currentX += colWidths[0];

    // Ref Color (colonne unique)
    doc.text(item.refColor || '', currentX + 2, rowY + 8, {
      width: colWidths[1] - 4,
      align: "center",
    });
    currentX += colWidths[1];

    // Nombre d'unité
    doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
      width: colWidths[2] - 4,
      align: "center",
    });
    currentX += colWidths[2];

    // Prix
    doc.text(`${item.unitPrice.toFixed(3)}`, currentX + 2, rowY + 8, {
      width: colWidths[3] - 4,
      align: "center",
    });
    currentX += colWidths[3];

    // Total
    doc.text(`${item.total.toFixed(3)}`, currentX + 2, rowY + 8, {
      width: colWidths[4] - 4,
      align: "center",
    });

    // Lignes verticales
    currentX = startX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      currentX += colWidths[i];
      doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
    }

    rowY += rowHeight;
  });

  // Ligne de total séparée et alignée à droite
  rowY += 20;
  const totalRowHeight = 25;
  const totalBoxWidth = 200;
  
  // Dessiner le cadre du total aligné à droite
  const totalBoxX = startX + tableWidth - totalBoxWidth;
  doc.rect(totalBoxX, rowY, totalBoxWidth, totalRowHeight).stroke();
  
  // Ligne verticale pour séparer "Total" du montant
  doc.moveTo(totalBoxX + totalBoxWidth - 80, rowY).lineTo(totalBoxX + totalBoxWidth - 80, rowY + totalRowHeight).stroke();
  
  // Texte "Total" à gauche
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000");
  doc.text("Total", totalBoxX + 2, rowY + 8, {
    width: totalBoxWidth - 82,
    align: "center",
  });
  
  // Montant total à droite
  doc.text(`${devis.totalAmount.toFixed(3)}`, totalBoxX + totalBoxWidth - 78, rowY + 8, {
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

  // Vérifier s'il y a des remises dans les articles
  const hasDiscounts = devis.items.some(item => item.discount > 0);

  // Tableau avec colonnes dynamiques
  const startY = 280;
  const startX = 20;
  const tableWidth = 555;

  // Ajuster les largeurs de colonnes selon la présence de remises
  let colWidths, headers;
  if (hasDiscounts) {
    colWidths = [45, 200, 120, 70, 50, 35]; // Avec remise
    headers = ["Quantité", "Description", "Ref Color", "Prix Unitaire", "Remise", "Total"];
  } else {
    colWidths = [45, 240, 120, 70, 45]; // Sans remise - redistribuer l'espace
    headers = ["Quantité", "Description", "Ref Color", "Prix Unitaire", "Total"];
  }

  let currentX = startX;

  doc.rect(startX, startY, tableWidth, 25).stroke();
  doc.fontSize(9).fillColor("#000");

  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, startY + 8, {
      width: colWidths[index] - 4,
      align: "center",
    });
    currentX += colWidths[index];
  });

  currentX = startX;
  for (let i = 0; i < colWidths.length - 1; i++) {
    currentX += colWidths[i];
    doc.moveTo(currentX, startY).lineTo(currentX, startY + 25).stroke();
  }

  let rowY = startY + 25;
  devis.items.forEach((item) => {
    const rowHeight = 25;
    doc.rect(startX, rowY, tableWidth, rowHeight).stroke();
    currentX = startX;

    doc.fontSize(9).fillColor("#000");
    doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
      width: colWidths[0] - 4,
      align: "center",
    });
    currentX += colWidths[0];

    doc.text(item.description, currentX + 2, rowY + 4, {
      width: colWidths[1] - 4,
      align: "center",
    });
    currentX += colWidths[1];

    // Ref Color (colonne unique)
    doc.text(item.refColor || "", currentX + 2, rowY + 8, {
      width: colWidths[2] - 4,
      align: "center",
    });
    currentX += colWidths[2];

    // Prix Unitaire avec devise DT
    doc.text(`${item.unitPrice.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[3] - 4,
      align: "center",
    });
    currentX += colWidths[3];

    // Remise (seulement si il y a des remises)
    if (hasDiscounts) {
      doc.text(`${item.discount}%`, currentX + 2, rowY + 8, {
        width: colWidths[4] - 4,
        align: "center",
      });
      currentX += colWidths[4];
    }

    // Total avec devise DT
    const totalIndex = hasDiscounts ? 5 : 4;
    doc.text(`${item.total.toFixed(0)} DT`, currentX + 2, rowY + 8, {
      width: colWidths[totalIndex] - 4,
      align: "center",
    });

    currentX = startX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      currentX += colWidths[i];
      doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
    }

    rowY += rowHeight;
  });

  // Ligne de total séparée et alignée à droite
  rowY += 20;
  const totalRowHeight = 25;
  const totalBoxWidth = 200;
  
  // Dessiner le cadre du total aligné à droite
  const totalBoxX = startX + tableWidth - totalBoxWidth;
  doc.rect(totalBoxX, rowY, totalBoxWidth, totalRowHeight).stroke();
  
  // Ligne verticale pour séparer "Total" du montant
  doc.moveTo(totalBoxX + totalBoxWidth - 80, rowY).lineTo(totalBoxX + totalBoxWidth - 80, rowY + totalRowHeight).stroke();
  
  // Texte "Total" à gauche
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000");
  doc.text("Total", totalBoxX + 2, rowY + 8, {
    width: totalBoxWidth - 82,
    align: "center",
  });
  
  // Montant total à droite
  doc.text(`${devis.totalAmount.toFixed(3)}`, totalBoxX + totalBoxWidth - 78, rowY + 8, {
    width: 76,
    align: "center",
  });
  
  rowY += totalRowHeight;

  // DÉLAIS DE LIVRAISON
  rowY += 40;
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