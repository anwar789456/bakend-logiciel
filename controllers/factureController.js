const factureModel = require("../models/factureModel");
const factureCompteurModel = require("../models/factureCompteurModel");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

    let nextNumber = parseInt(counter.factureComptValue, 10);

    if (existingFactures.length > 0) {
      const lastFactureNumber = existingFactures[0].factureNumber;
      const lastNumber = parseInt(lastFactureNumber.split('/')[0], 10);

      // If existing facture number is higher than counter, sync counter
      if (lastNumber >= nextNumber) {
        nextNumber = lastNumber + 1;
      }
    }

    // Check if the generated number already exists (extra safety)
    let factureNumber = `${nextNumber}/${yearSuffix}`;
    while (await Facture.findOne({ factureNumber })) {
      nextNumber++;
      factureNumber = `${nextNumber}/${yearSuffix}`;
    }

    // Update counter to next number
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

    // Calculate TVA for enterprises
    const clientType = req.body.clientType || 'particulier';
    const tvaRate = clientType === 'entreprise' ? (req.body.tvaRate || 19) : 0;
    const tvaAmount = clientType === 'entreprise' ? (totalHT * tvaRate / 100) : 0;
    const totalTTC = totalHT + tvaAmount;

    // For particulier: totalAmount = totalHT, for entreprise: totalAmount = totalTTC
    const totalAmount = clientType === 'entreprise' ? totalTTC : totalHT;

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

    // Logo SAMET HOME
    const imagePath = path.join(__dirname, '..', 'images', 'image.png');
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
    const colWidths = [60, 200, 90, 80, 80]; // Quantité, Description, Ref Color, P. unitaire HT, Total HT
    const headers = ["Quantité", "Description", "Ref Color", "P. unitaire HT", "Total HT"];

    let currentX = startX;

    // Table header
    doc.rect(startX, startY, tableWidth, 25).stroke();
    doc.fontSize(9).fillColor("#000");

    headers.forEach((header, index) => {
      doc.text(header, currentX + 2, startY + 8, {
        width: colWidths[index] - 4,
        align: "center",
      });
      currentX += colWidths[index];
    });

    // Vertical lines for header
    currentX = startX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      currentX += colWidths[i];
      doc.moveTo(currentX, startY).lineTo(currentX, startY + 25).stroke();
    }

    // Table rows
    let rowY = startY + 25;
    facture.items.forEach((item) => {
      const rowHeight = 25;
      doc.rect(startX, rowY, tableWidth, rowHeight).stroke();
      currentX = startX;

      doc.fontSize(9).fillColor("#000");

      // Quantité
      doc.text(item.quantity.toString(), currentX + 2, rowY + 8, {
        width: colWidths[0] - 4,
        align: "center",
      });
      currentX += colWidths[0];

      // Description
      doc.text(item.description, currentX + 2, rowY + 4, {
        width: colWidths[1] - 4,
      });
      currentX += colWidths[1];

      // Ref Color
      doc.text(item.refColor || '', currentX + 2, rowY + 8, {
        width: colWidths[2] - 4,
        align: "center",
      });
      currentX += colWidths[2];

      // P. unitaire HT
      doc.text(`${item.unitPrice.toFixed(3)}`, currentX + 2, rowY + 8, {
        width: colWidths[3] - 4,
        align: "center",
      });
      currentX += colWidths[3];

      // Total HT
      doc.text(`${item.total.toFixed(3)}`, currentX + 2, rowY + 8, {
        width: colWidths[4] - 4,
        align: "center",
      });

      // Vertical lines
      currentX = startX;
      for (let i = 0; i < colWidths.length - 1; i++) {
        currentX += colWidths[i];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
      }

      rowY += rowHeight;
    });

    // Summary table on the right
    rowY += 20;
    const summaryWidth = 150;
    const summaryX = startX + tableWidth - summaryWidth;

    // TOTAL HT
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("TOTAL HT", summaryX + 5, rowY + 6);
    doc.text(`${facture.totalHT.toFixed(3)}`, summaryX + 80, rowY + 6);

    rowY += 20;

    // TVA
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("TVA", summaryX + 5, rowY + 6);
    doc.text(`${facture.tvaAmount.toFixed(3)}`, summaryX + 80, rowY + 6);

    rowY += 20;

    // Timbre Fiscal
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("Timbre Fiscal", summaryX + 5, rowY + 6);
    doc.text("1.000", summaryX + 80, rowY + 6);

    rowY += 20;

    // TOTAL TTC
    doc.rect(summaryX, rowY, summaryWidth, 20).stroke();
    doc.text("TOTAL TTC", summaryX + 5, rowY + 6);
    doc.text(`${(facture.totalTTC + 1).toFixed(3)}`, summaryX + 80, rowY + 6); // +1 for timbre fiscal

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

module.exports = { 
  getAllFactureItems, 
  getFactureById,
  createFacture,
  updateFactureById, 
  deleteFactureById,
  generateFacturePDF
};
