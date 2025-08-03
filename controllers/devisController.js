const devisModel = require("../models/devisModel");
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');

// Helper function to get initialized Devis model
const getDevisModel = () => {
  if (!devisModel.Devis) {
    devisModel.initModel();
  }
  return devisModel.Devis;
};

// Helper function to generate devis number
const generateDevisNumber = async () => {
  const Devis = getDevisModel();
  if (!Devis) {
    throw new Error('Devis model not initialized');
  }
  
  const currentYear = new Date().getFullYear();
  
  // Trouver le dernier numéro de devis pour cette année
  const lastDevis = await Devis.findOne({
    createdAt: {
      $gte: new Date(currentYear, 0, 1),
      $lt: new Date(currentYear + 1, 0, 1)
    }
  }).sort({ createdAt: -1 });
  
  let nextNumber = 1;
  if (lastDevis && lastDevis.devisNumber) {
    const parts = lastDevis.devisNumber.split('/');
    if (parts.length === 2) {
      nextNumber = parseInt(parts[0]) + 1;
    }
  }
  
  return `${nextNumber}/${currentYear.toString().slice(-2)}`;
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
    const Devis = getDevisModel();
    if (!Devis) {
      return res.status(500).json({ message: "Devis model not initialized" });
    }
    
    const devisNumber = await generateDevisNumber();
    
    // Calculate totals
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
    
    const totalAmount = subtotal - totalDiscount;
    
    const devisData = {
      ...req.body,
      devisNumber,
      items,
      subtotal,
      totalDiscount,
      totalAmount,
      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
    };
    
    const newDevis = new Devis(devisData);
    const savedDevis = await newDevis.save();
    
    res.status(201).json(savedDevis);
  } catch (err) {
    console.error('Error creating devis:', err);
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

// Génération PDF ENTREPRISE (modèle strict)
async function generateDevisPDFEntreprise(devis, res) {
    const doc = new PDFDocument({ margin: 20, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=devis-${devis.devisNumber}.pdf`);
    doc.pipe(res);

  // Logo et QR code
    const qrData = `DEVIS ${devis.devisNumber} - ${devis.clientName} - ${devis.totalAmount} DT`;
    const qrCodeBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 1 });
    const imagePath = path.join(__dirname, '..', 'images', 'image.png');
  doc.fontSize(8).fillColor("#000").text("SATRACO s.a.r.l - IU:1280963K", 20, 20, { characterSpacing:1 });
    doc.image(imagePath, 20, 40, { width: 180 });
    doc.image(qrCodeBuffer, 20, 90, { width: 80, height: 80 });

  // Bloc à droite avec TOUS les labels (jamais de condition)
  const rightX = 420;
  const labelWidth = 90;
  const valueX = rightX + labelWidth;
  const lineHeight = 13;
  let y = 50;
  const labels = [
    ['CLIENT', devis.clientName || ''],
    ['ADRESSE', devis.clientAddress || ''],
    ['Code TVA', devis.tva || ''],
    ['R.C', devis.rc || ''],
    ['Tel', devis.clientPhone || ''],
    ['Fax', devis.fax || ''],
    ['Contact', devis.contact || ''],
    ['GSM', devis.gsm || ''],
    ['Adresse Mail', devis.email || ''],
  ];
  labels.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000');
    doc.text(label + ' :', rightX, y, { width: labelWidth, align: 'left' });
    doc.font('Helvetica').fontSize(9).fillColor('#000');
    doc.text(value, valueX, y, { width: 120, align: 'left' });
    y += lineHeight;
  });

    // Titre centré
    doc.fontSize(16).fillColor("#000");
  doc.font("Helvetica-Bold").text(`DEVIS N° ${devis.devisNumber}`, 0, 200, { align: "center", width: doc.page.width });
    doc.fontSize(10).font("Helvetica");
  doc.text(`Ariana le: ${new Date(devis.date).toLocaleDateString("fr-FR")}`, 0, 225, { align: "center", width: doc.page.width });

  // Tableau
    const startY = 280;
    const startX = 20;
    const tableWidth = 555;
  const colWidths = [210, 110, 70, 70, 95];
  const headers = ['Description', 'Ref Couleur', "Nombre d'unité", 'Prix', 'Total'];
    let currentX = startX;
    doc.rect(startX, startY, tableWidth, 25).stroke();
    headers.forEach((header, index) => {
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(header, currentX + 2, startY + 8, { width: colWidths[index] - 4, align: 'center' });
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
    doc.font('Helvetica').fontSize(9).fillColor('#000');
    // Description
    doc.text(item.description || '', currentX + 2, rowY + 4, { width: colWidths[0] - 4 });
    currentX += colWidths[0];
    // Ref Couleur
    doc.text(item.reference || '', currentX + 2, rowY + 4, { width: colWidths[1] - 4, align: 'center' });
    currentX += colWidths[1];
    // Nombre d’unité
    doc.text(item.quantity ? item.quantity.toString() : '', currentX + 2, rowY + 8, { width: colWidths[2] - 4, align: 'center' });
    currentX += colWidths[2];
    // Prix
    doc.text(item.unitPrice !== undefined ? `${item.unitPrice.toLocaleString()} DT` : '', currentX + 2, rowY + 8, { width: colWidths[3] - 4, align: 'center' });
    currentX += colWidths[3];
    // Total
    doc.font('Helvetica-Bold').text(item.total !== undefined ? `${item.total.toLocaleString()} DT` : '', currentX + 2, rowY + 8, { width: colWidths[4] - 4, align: 'center' });
    currentX += colWidths[4];
    currentX = startX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      currentX += colWidths[i];
      doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
    }
    rowY += rowHeight;
  });

  // Total en bas à droite
  rowY += 10;
  const totalBoxWidth = 200;
  const totalBoxHeight = 30;
  const totalBoxX = startX + tableWidth - totalBoxWidth;
  doc.rect(totalBoxX, rowY, totalBoxWidth, totalBoxHeight).stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
  doc.text('Total', totalBoxX + 10, rowY + 6, { width: 60, align: 'left' });
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000');
  doc.text(`${devis.totalAmount !== undefined ? devis.totalAmount.toLocaleString() : ''} DT`, totalBoxX + 70, rowY + 6, { width: 120, align: 'right' });
  rowY += totalBoxHeight;

  // Footer
  rowY += 30;
  doc.font('Helvetica').fontSize(8).fillColor('#000');
  doc.text('LA LIVRAISON EST GRATUITE UNIQUEMENT SUR LE GRAND TUNIS (TUNIS, ARIANA, MANOUBA, BEN AROUS)', 0, rowY, { width: doc.page.width, align: 'center' });
  rowY += 30;
  doc.text('SATRACO s.a.r.l au Capital de 10.000 DT Av Abou Kacem Chebbi - 2080 - Ariana RC. B038912013   MF. 1280963/K/A/M/000', 0, doc.page.height - 30, { width: doc.page.width, align: 'center' });
  doc.end();
}

// Génération PDF PARTICULIER (format classique)
async function generateDevisPDFClient(devis, res) {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=devis-${devis.devisNumber}.pdf`);
  doc.pipe(res);
  // Logo et QR code
  const qrData = `DEVIS ${devis.devisNumber} - ${devis.clientName} - ${devis.totalAmount} DT`;
  const qrCodeBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 1 });
  const imagePath = path.join(__dirname, '..', 'images', 'image.png');
  doc.fontSize(8).fillColor("#000").text("SATRACO s.a.r.l - IU:1280963K", 20, 20, { characterSpacing:1 });
  doc.image(imagePath, 20, 40, { width: 180 });
  doc.image(qrCodeBuffer, 20, 90, { width: 80, height: 80 });
  // Bloc à droite classique
  let clientStartY = 50;
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('CLIENT : ', 400, clientStartY);
  doc.font('Helvetica').text(devis.clientName, 460, clientStartY);
  doc.font('Helvetica-Bold').text('ADRESSE : ', 400, clientStartY + 15);
  doc.font('Helvetica').text(devis.clientAddress, 460, clientStartY + 15);
  doc.font('Helvetica-Bold').text('Téléphone : ', 400, clientStartY + 30);
  doc.font('Helvetica').text(devis.clientPhone, 460, clientStartY + 30);
  // Titre centré
  doc.fontSize(16).fillColor("#000");
  doc.font("Helvetica-Bold").text(`DEVIS N° ${devis.devisNumber}`, 0, 200, { align: "center", width: doc.page.width });
  doc.fontSize(10).font("Helvetica");
  doc.text(`Ariana le: ${new Date(devis.date).toLocaleDateString("fr-FR")}`, 0, 225, { align: "center", width: doc.page.width });
  // Tableau classique (quantité, remise, etc.)
  const hasDiscounts = devis.items.some(item => item.discount > 0);
  const startY = 280;
  const startX = 20;
  const tableWidth = 555;
  let colWidths, headers;
  if (hasDiscounts) {
    colWidths = [55, 245, 100, 70, 50, 35];
    headers = ['Quantité', 'Description', 'Ref Couleur', 'Prix Unitaire', 'Remise', 'Total'];
  } else {
    colWidths = [55, 285, 100, 70, 45];
    headers = ['Quantité', 'Description', 'Ref Couleur', 'Prix Unitaire', 'Total'];
  }
  let currentX = startX;
  doc.rect(startX, startY, tableWidth, 25).stroke();
  doc.fontSize(9).fillColor('#000');
  headers.forEach((header, index) => {
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(header, currentX + 2, startY + 8, { width: colWidths[index] - 4, align: 'center' });
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
    doc.font('Helvetica').fontSize(9).fillColor('#000');
    doc.text(item.quantity.toString(), currentX + 2, rowY + 8, { width: colWidths[0] - 4, align: 'center' });
      currentX += colWidths[0];
    doc.text(item.description, currentX + 2, rowY + 4, { width: colWidths[1] - 4 });
      currentX += colWidths[1];
    doc.text(item.reference || '', currentX + 2, rowY + 4, { width: colWidths[2] - 4, align: 'center' });
    doc.text(item.color || '', currentX + 2, rowY + 14, { width: colWidths[2] - 4, align: 'center' });
      currentX += colWidths[2];
    doc.text(`${item.unitPrice.toFixed(0)} DT`, currentX + 2, rowY + 8, { width: colWidths[3] - 4, align: 'center' });
      currentX += colWidths[3];
    if (colWidths.length > 5) {
      doc.text(`${item.discount}%`, currentX + 2, rowY + 8, { width: colWidths[4] - 4, align: 'center' });
        currentX += colWidths[4];
      }
    const totalIndex = colWidths.length > 5 ? 5 : 4;
    doc.font('Helvetica-Bold').text(`${item.total.toFixed(0)} DT`, currentX + 2, rowY + 8, { width: colWidths[totalIndex] - 4, align: 'center' });
      currentX = startX;
      for (let i = 0; i < colWidths.length - 1; i++) {
        currentX += colWidths[i];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
      }
      rowY += rowHeight;
    });
  // Total classique
    rowY += 20;
    const totalBoxHeight = 40;
    doc.rect(startX, rowY, tableWidth, totalBoxHeight).stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
  doc.text('Total au comptant', startX + 2, rowY + 8, { width: tableWidth - 4, align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000');
  doc.text(`${devis.totalAmount.toFixed(0)} DT`, startX + 2, rowY + 22, { width: tableWidth - 4, align: 'center' });
    rowY += totalBoxHeight;
  // Footer classique
    rowY += 80;
  doc.font('Helvetica').fontSize(8).fillColor('#000');
  doc.text('Rib Ste SATRACO: 20003032210028360584 Banque: BTK Agence: Ariana', 0, rowY, { width: doc.page.width, align: 'center' });
  doc.text(devis.paymentTerms, 0, rowY + 15, { width: doc.page.width, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text(devis.deliveryCondition, 0, rowY + 30, { width: doc.page.width, align: 'center' });
  doc.font('Helvetica').fontSize(8);
  doc.text('Avenue Abou Kacem Chebbi / Tél: 56 834 015 / 56 834 016', 0, doc.page.height - 30, { width: doc.page.width, align: 'center' });
  doc.end();
}

// Routeur PDF : choisit la bonne fonction
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
    if (devis.typeClient === 'entreprise') {
      await generateDevisPDFEntreprise(devis, res);
    } else {
      await generateDevisPDFClient(devis, res);
    }
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};


module.exports = { 
  getAllDevisItems, 
  getDevisById,
  createDevis,
  updateDevisById, 
  deleteDevisById,
  generateDevisPDF,
  generateDevisPDFClient,
  generateDevisPDFEntreprise
};