const { initModel: initBonLivraison } = require('../models/bonLivraisonModel');
const { initModel: initBonLivraisonCompteur } = require('../models/bonLivraisonCompteurModel');
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

// Fonction pour générer le numéro de bon de livraison
const generateBonLivraisonNumber = async () => {
  const BonLivraisonCompteur = initBonLivraisonCompteur();
  if (!BonLivraisonCompteur) {
    throw new Error('BonLivraisonCompteur model is not initialized');
  }

  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  try {
    // Get current counter
    let counter = await BonLivraisonCompteur.findOne();
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = await BonLivraisonCompteur.create({
        bonLivraisonComptValue: '1',
        datebonlivraisoncompt: new Date()
      });
    }

    // Use the current counter value as the next bon livraison number
    let nextNumber = parseInt(counter.bonLivraisonComptValue, 10);

    // Check if the generated number already exists (extra safety)
    const BonLivraison = initBonLivraison();
    let bonLivraisonNumber = `${nextNumber}/${currentYear}`;
    while (await BonLivraison.findOne({ bonLivraisonNumber })) {
      nextNumber++;
      bonLivraisonNumber = `${nextNumber}/${currentYear}`;
    }

    // Update counter to next number for the next bon livraison
    counter.bonLivraisonComptValue = (nextNumber + 1).toString();
    counter.datebonlivraisoncompt = new Date();
    await counter.save();

    console.log(`Generated bon livraison number: ${bonLivraisonNumber}`);
    return bonLivraisonNumber;
  } catch (error) {
    console.error('Error generating bon de livraison number:', error);
    throw error;
  }
};

// Créer un nouveau bon de livraison
const createBonLivraison = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraisonNumber = await generateBonLivraisonNumber();
    
    const bonLivraisonData = {
      ...req.body,
      bonLivraisonNumber
    };

    const bonLivraison = new BonLivraison(bonLivraisonData);
    await bonLivraison.save();
    
    res.status(201).json(bonLivraison);
  } catch (error) {
    console.error('Error creating bon de livraison:', error);
    res.status(500).json({ message: 'Erreur lors de la création du bon de livraison', error: error.message });
  }
};

// Obtenir tous les bons de livraison
const getAllBonLivraisons = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraisons = await BonLivraison.find().sort({ createdAt: -1 });
    res.json(bonLivraisons);
  } catch (error) {
    console.error('Error fetching bon de livraisons:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des bons de livraison', error: error.message });
  }
};

// Obtenir un bon de livraison par ID
const getBonLivraisonById = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraison = await BonLivraison.findById(req.params.id);
    if (!bonLivraison) {
      return res.status(404).json({ message: 'Bon de livraison non trouvé' });
    }
    res.json(bonLivraison);
  } catch (error) {
    console.error('Error fetching bon de livraison:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du bon de livraison', error: error.message });
  }
};

// Mettre à jour un bon de livraison
const updateBonLivraison = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraison = await BonLivraison.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!bonLivraison) {
      return res.status(404).json({ message: 'Bon de livraison non trouvé' });
    }
    
    res.json(bonLivraison);
  } catch (error) {
    console.error('Error updating bon de livraison:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du bon de livraison', error: error.message });
  }
};

// Supprimer un bon de livraison
const deleteBonLivraison = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraison = await BonLivraison.findByIdAndDelete(req.params.id);
    if (!bonLivraison) {
      return res.status(404).json({ message: 'Bon de livraison non trouvé' });
    }
    res.json({ message: 'Bon de livraison supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting bon de livraison:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du bon de livraison', error: error.message });
  }
};

// Générer le PDF du bon de livraison
const generateBonLivraisonPDF = async (req, res) => {
  const BonLivraison = initBonLivraison();
  if (!BonLivraison) {
    return res.status(500).json({ message: 'BonLivraison model is not initialized' });
  }

  try {
    const bonLivraison = await BonLivraison.findById(req.params.id);
    if (!bonLivraison) {
      return res.status(404).json({ message: 'Bon de livraison non trouvé' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-livraison-${bonLivraison.bonLivraisonNumber.replace('/', '-')}.pdf"`);
    
    doc.pipe(res);

    // Génération QR code principal
    const qrData = `BON DE LIVRAISON ${bonLivraison.bonLivraisonNumber} - ${bonLivraison.clientName} - ${new Date(bonLivraison.date).toLocaleDateString('fr-FR')}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 80,
      margin: 1,
    });

    // Logo - utiliser le logo personnalisé ou le logo par défaut
    let imagePath;
    console.log('BonLivraison customLogo:', bonLivraison.customLogo);
    if (bonLivraison.customLogo && fs.existsSync(path.join(__dirname, '..', 'uploads', 'logos', bonLivraison.customLogo))) {
      imagePath = path.join(__dirname, '..', 'uploads', 'logos', bonLivraison.customLogo);
      console.log('Using custom logo:', imagePath);
    } else {
      imagePath = path.join(__dirname, '..', 'images', 'image.png');
      console.log('Using default logo:', imagePath);
    }
    
    // Logo SAMET HOME
    doc.image(imagePath, 20, 40, { width: 180 });

    // Informations client à droite (style unifié)
    let clientStartY = 50;
    doc.font('Helvetica-Bold').fontSize(9);
    
    doc.text('CLIENT : ', 400, clientStartY);
    doc.font('Helvetica').text(bonLivraison.clientName, 460, clientStartY);
    
    doc.font('Helvetica-Bold').text('ADRESSE : ', 400, clientStartY + 18);
    doc.font('Helvetica').text(bonLivraison.clientAddress, 460, clientStartY + 18);
    
    doc.font('Helvetica-Bold').text('Téléphone : ', 400, clientStartY + 36);
    doc.font('Helvetica').text(bonLivraison.clientPhone, 460, clientStartY + 36);

    // Titre du document centré
    doc.fontSize(16).fillColor("#000");
    doc.font('Helvetica-Bold').text(`BON DE LIVRAISON N° ${bonLivraison.bonLivraisonNumber}`, 0, 150, {
      align: 'center',
      width: doc.page.width
    });

    // Date centrée
    const formattedDate = new Date(bonLivraison.date).toLocaleDateString('fr-FR');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Ariana le: ${formattedDate}`, 0, 175, {
      align: 'center',
      width: doc.page.width
    });

    // Tableau des articles
    const startY = 220;
    const startX = 20;
    const tableWidth = 555;
    const colWidths = [80, 355, 120]; // Quantité, Description, Ref Couleur
    const headers = ["Quantité", "Description", "Ref Couleur"];
    
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
    
    bonLivraison.items.forEach((item) => {
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
        
        rowY += 25;
      }  
      doc.fillColor("#000"); // Remettre la couleur par défaut
    });

    // Section "Reste à payer" - largeur complète comme le tableau
    rowY += 20;
    
    doc.rect(startX, rowY, tableWidth, 20).stroke();
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text("Reste à payer", startX + 5, rowY + 6);
    doc.text("0 DT", startX + tableWidth - 50, rowY + 6);

    // QR Codes pour avis Google et Facebook (espacement réduit)
    const qrY = rowY + 40;
    
    // Générer QR codes pour Google et Facebook
    const googleQRData = "https://g.page/r/samethome/review";
    const facebookQRData = "https://www.facebook.com/samethome/reviews";
    
    const googleQRBuffer = await QRCode.toBuffer(googleQRData, {
      width: 60,
      margin: 1,
    });
    
    const facebookQRBuffer = await QRCode.toBuffer(facebookQRData, {
      width: 60,
      margin: 1,
    });
    
    // QR Google
    doc.image(googleQRBuffer, 150, qrY, { width: 60, height: 60 });
    doc.font('Helvetica').fontSize(8);
    doc.text('Avis Google', 150, qrY + 65, { width: 60, align: 'center' });
    
    // QR Facebook
    doc.image(facebookQRBuffer, 400, qrY, { width: 60, height: 60 });
    doc.text('Avis Facebook', 400, qrY + 65, { width: 60, align: 'center' });

    // Footer en pied de page après les QR codes
    doc.fontSize(8);
    doc.text('Avenue Abou Kacem Chebbi / Tél: 56 834 015 / 56 834 016', 0, qrY + 400, {
      align: 'center',
      width: doc.page.width
    });

    doc.end();
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
  }
};

// Upload logo for bon de livraison
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const logoPath = req.file.filename;
    console.log('Logo uploaded for bon de livraison:', logoPath);
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
  createBonLivraison,
  getAllBonLivraisons,
  getBonLivraisonById,
  updateBonLivraison,
  deleteBonLivraison,
  generateBonLivraisonPDF,
  uploadLogo,
  getLogo,
  upload
};
