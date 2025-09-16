const { initModel: initRecuPaiement } = require('../models/recuPaiementModel');
const { initModel: initRecuPaiementCompteur } = require('../models/recuPaiementCompteurModel');
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
    cb(null, 'recupaiement-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Fonction pour générer le numéro de reçu de paiement
const generateRecuPaiementNumber = async () => {
  const RecuPaiementCompteur = initRecuPaiementCompteur();
  if (!RecuPaiementCompteur) {
    throw new Error('RecuPaiementCompteur model is not initialized');
  }

  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  try {
    // Get current counter
    let counter = await RecuPaiementCompteur.findOne();
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = await RecuPaiementCompteur.create({
        recupaiementcompt: 1,
        daterecupaiementcompt: new Date()
      });
    }

    // Use the current counter value as the next recu paiement number
    let nextNumber = counter.recupaiementcompt;

    // Check if the generated number already exists (extra safety)
    const RecuPaiement = initRecuPaiement();
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    let recuPaiementNumber = `${formattedNumber}/${currentYear}`;
    
    while (await RecuPaiement.findOne({ recuPaiementNumber })) {
      nextNumber++;
      const newFormattedNumber = nextNumber.toString().padStart(3, '0');
      recuPaiementNumber = `${newFormattedNumber}/${currentYear}`;
    }

    // Update counter to next number for the next recu paiement
    counter.recupaiementcompt = nextNumber + 1;
    counter.daterecupaiementcompt = new Date();
    await counter.save();

    console.log(`Generated recu paiement number: ${recuPaiementNumber}`);
    return recuPaiementNumber;
  } catch (error) {
    console.error('Error generating recu paiement number:', error);
    throw error;
  }
};

// Create a new recu paiement
const createRecuPaiement = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const recuPaiementNumber = await generateRecuPaiementNumber();
    
    const recuPaiementData = {
      ...req.body,
      recuPaiementNumber
    };

    const newRecuPaiement = new RecuPaiement(recuPaiementData);
    const savedRecuPaiement = await newRecuPaiement.save();
    
    res.status(201).json(savedRecuPaiement);
  } catch (error) {
    console.error('Error creating recu paiement:', error);
    res.status(500).json({ message: 'Error creating recu paiement', error: error.message });
  }
};

// Get all recu paiements
const getAllRecuPaiements = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const recuPaiements = await RecuPaiement.find().sort({ createdAt: -1 });
    res.json(recuPaiements);
  } catch (error) {
    console.error('Error fetching recu paiements:', error);
    res.status(500).json({ message: 'Error fetching recu paiements', error: error.message });
  }
};

// Get recu paiement by ID
const getRecuPaiementById = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const recuPaiement = await RecuPaiement.findById(req.params.id);
    if (!recuPaiement) {
      return res.status(404).json({ message: 'Recu paiement not found' });
    }
    
    res.json(recuPaiement);
  } catch (error) {
    console.error('Error fetching recu paiement:', error);
    res.status(500).json({ message: 'Error fetching recu paiement', error: error.message });
  }
};

// Update recu paiement by ID
const updateRecuPaiement = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const updatedRecuPaiement = await RecuPaiement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRecuPaiement) {
      return res.status(404).json({ message: 'Recu paiement not found' });
    }

    res.json(updatedRecuPaiement);
  } catch (error) {
    console.error('Error updating recu paiement:', error);
    res.status(500).json({ message: 'Error updating recu paiement', error: error.message });
  }
};

// Delete recu paiement by ID
const deleteRecuPaiement = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const deletedRecuPaiement = await RecuPaiement.findByIdAndDelete(req.params.id);
    if (!deletedRecuPaiement) {
      return res.status(404).json({ message: 'Recu paiement not found' });
    }

    res.json({ message: 'Recu paiement deleted successfully' });
  } catch (error) {
    console.error('Error deleting recu paiement:', error);
    res.status(500).json({ message: 'Error deleting recu paiement', error: error.message });
  }
};

// Generate PDF for recu paiement
const generateRecuPaiementPDF = async (req, res) => {
  try {
    const RecuPaiement = initRecuPaiement();
    if (!RecuPaiement) {
      return res.status(500).json({ message: 'RecuPaiement model not initialized' });
    }

    const recuPaiement = await RecuPaiement.findById(req.params.id);
    if (!recuPaiement) {
      return res.status(404).json({ message: 'Recu paiement non trouvé' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-paiement-${recuPaiement.recuPaiementNumber.replace('/', '-')}.pdf"`);
    
    doc.pipe(res);

    // Logo - utiliser le logo personnalisé ou le logo par défaut
    let imagePath;
    if (recuPaiement.customLogo && fs.existsSync(path.join(__dirname, '..', 'uploads', 'logos', recuPaiement.customLogo))) {
      imagePath = path.join(__dirname, '..', 'uploads', 'logos', recuPaiement.customLogo);
    } else {
      imagePath = path.join(__dirname, '..', 'images', 'image.png');
    }
    
    // En-tête société
    doc.fontSize(8).fillColor("#000").text("SATRACO s.a.r.l - IU:1280963K", 20, 20);
    
    // Logo SAMET HOME
    doc.image(imagePath, 20, 40, { width: 180 });

    // Informations client à droite
    let clientStartY = 50;
    doc.font('Helvetica-Bold').fontSize(9);
    
    doc.text('Client(e) : ', 400, clientStartY);
    doc.font('Helvetica').text(recuPaiement.clientName, 460, clientStartY);
    
    doc.font('Helvetica-Bold').text('Adresse : ', 400, clientStartY + 18);
    doc.font('Helvetica').text(recuPaiement.clientAddress, 460, clientStartY + 18);
    
    doc.font('Helvetica-Bold').text('Téléphone : ', 400, clientStartY + 36);
    doc.font('Helvetica').text(recuPaiement.clientPhone, 460, clientStartY + 36);
    
    if (recuPaiement.clientEmail) {
      doc.font('Helvetica-Bold').text('E-mail : ', 400, clientStartY + 54);
      doc.font('Helvetica').text(recuPaiement.clientEmail, 460, clientStartY + 54);
    }

    // Titre du document centré
    doc.fontSize(16).fillColor("#000");
    doc.font('Helvetica-Bold').text(`Reçu de paiement sur commande N°${recuPaiement.commandeNumber}`, 0, 150, {
      align: 'center',
      width: doc.page.width
    });

    // Date centrée
    const formattedDate = new Date(recuPaiement.date).toLocaleDateString('fr-FR');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Ariana le: ${formattedDate}`, 0, 175, {
      align: 'center',
      width: doc.page.width
    });

    // Tableau des articles
    const startY = 220;
    const startX = 20;
    const tableWidth = 555;
    
    // Vérifier s'il y a des remises
    const hasDiscounts = recuPaiement.items.some(item => item.discount > 0);
    
    let colWidths, headers;
    if (hasDiscounts) {
      colWidths = [45, 200, 80, 80, 50, 50, 50]; // Avec remise
      headers = ["Quantité", "Description", "Ref Couleur", "Prix Unitaire", "Remise", "Total"];
    } else {
      colWidths = [45, 240, 80, 80, 50, 60]; // Sans remise
      headers = ["Quantité", "Description", "Ref Couleur", "Prix Unitaire", "Total"];
    }
    
    // Table header avec style gris
    let currentX = startX;
    doc.fontSize(10).fillColor("#666666");
    
    headers.forEach((header, index) => {
      doc.text(header, currentX + 2, startY + 8, {
        width: colWidths[index] - 4,
        align: index === 0 ? "left" : "center"
      });
      currentX += colWidths[index];
    });

    // Ligne de séparation sous l'en-tête
    doc.strokeColor("#000000").lineWidth(1);
    doc.moveTo(startX, startY + 25).lineTo(startX + tableWidth, startY + 25).stroke();

    // Lignes du tableau
    let rowY = startY + 25;
    doc.font('Helvetica').fontSize(9);
    
    recuPaiement.items.forEach((item) => {
      // Ligne principale de l'article - sans bordures
      currentX = startX;
      doc.fontSize(10).fillColor("#333333");
      
      // Quantité
      doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
        width: colWidths[0] - 4,
        align: "center"
      });
      currentX += colWidths[0];
      
      // Description (sans option)
      doc.text(item.description, currentX + 2, rowY + 8, {
        width: colWidths[1] - 4,
        align: "left"
      });
      currentX += colWidths[1];
      
      // Ref Couleur
      doc.text(item.refColor || '', currentX + 2, rowY + 8, {
        width: colWidths[2] - 4,
        align: "center"
      });
      currentX += colWidths[2];
      
      // Prix Unitaire
      doc.text(item.unitPrice.toString(), currentX + 2, rowY + 8, {
        width: colWidths[3] - 4,
        align: "center"
      });
      currentX += colWidths[3];
      
      if (hasDiscounts) {
        // Remise
        doc.text(`${item.discount}%`, currentX + 2, rowY + 8, {
          width: colWidths[4] - 4,
          align: "center"
        });
        currentX += colWidths[4];
      }
      
      // Total
      doc.text(item.total.toString(), currentX + 2, rowY + 8, {
        width: colWidths[hasDiscounts ? 5 : 4] - 4,
        align: "center"
      });
      
      rowY += 25;

      // Ligne séparée pour l'option si disponible - sans bordures
      if (item.selectedOption && item.selectedOption.option_name) {
        doc.fontSize(9).fillColor("#666666");
        
        // Colonne vide pour quantité
        currentX = startX + colWidths[0];
        
        // Option dans la colonne description
        doc.text(`Option: ${item.selectedOption.option_name}`, currentX + 2, rowY + 8, {
          width: colWidths[1] - 4,
          align: "left"
        });
        currentX += colWidths[1];
        
        // Colonne vide pour ref color
        currentX += colWidths[2];
        
        // Prix de l'option
        const optionPrice = parseFloat(item.selectedOption.prix_option) || 0;
        doc.text(`+${optionPrice.toFixed(3)}`, currentX + 2, rowY + 8, {
          width: colWidths[3] - 4,
          align: "center"
        });
        
        rowY += 25;
      }
      doc.fillColor("#000"); // Remettre la couleur par défaut
    });

    // Section totaux
    rowY += 20;
    const summaryWidth = 150;
    const summaryX = startX + tableWidth - summaryWidth;
    
    // Total
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text("Total", summaryX + 5, rowY + 6);
    doc.text(recuPaiement.totalAmount.toString(), summaryX + 100, rowY + 6);
    rowY += 20;
    
    // Avance
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("Avance", summaryX + 5, rowY + 6);
    doc.text(recuPaiement.avance.toString(), summaryX + 100, rowY + 6);
    rowY += 20;
    
    // Règlement
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("Règlement", summaryX + 5, rowY + 6);
    doc.text(recuPaiement.reglement.toString(), summaryX + 100, rowY + 6);
    rowY += 20;
    
    // Reste à payer
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("Reste à payer", summaryX + 5, rowY + 6);
    doc.text(recuPaiement.resteAPayer.toString(), summaryX + 100, rowY + 6);

    // Délais de livraison
    rowY += 40;
    const deliveryDate = new Date(recuPaiement.deliveryDate).toLocaleDateString('fr-FR');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Délais de livraison: ${deliveryDate}`, 0, rowY, {
      align: 'center',
      width: doc.page.width
    });

    // Informations légales
    rowY += 40;
    doc.fontSize(8);
    doc.text('Rib Ste SATRACO: 20003032210028360584 Banque: BTK Agence: Ariana', 0, rowY, {
      align: 'center',
      width: doc.page.width
    });
    
    doc.text('Tous les paiements sont effectués avant la livraison au showroom.', 0, rowY + 15, {
      align: 'center',
      width: doc.page.width
    });
    
    doc.text('LA LIVRAISON EST GRATUITE UNIQUEMENT SUR LE GRAND TUNIS (TUNIS, ARIANA, MANOUBA, BEN AROUS)', 0, rowY + 30, {
      align: 'center',
      width: doc.page.width
    });

    // Footer
    doc.text('Avenue Abou Kacem Chebbi / Tél: 56 834 015 / 56 834 016', 0, doc.page.height - 20, {
      align: 'center',
      width: doc.page.width
    });

    doc.end();
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
  }
};

// Upload logo for recu paiement
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
  createRecuPaiement,
  getAllRecuPaiements,
  getRecuPaiementById,
  updateRecuPaiement,
  deleteRecuPaiement,
  generateRecuPaiementPDF,
  uploadLogo,
  getLogo,
  upload
};
