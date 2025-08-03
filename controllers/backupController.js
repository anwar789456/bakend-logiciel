const mongoose = require('mongoose');
const archiver = require('archiver');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const path = require('path');

// Import all models
const ProductModel = require('../models/productModel');
const CommandeModel = require('../models/Commande');
const DevisModel = require('../models/devisModel');
const DevisCompteurModel = require('../models/devisCompteurModel');
const MessagerieModel = require('../models/messagerieModel');

// Helper function to get the actual model from the module
function getModel(modelModule) {
  if (modelModule && typeof modelModule.initModel === 'function') {
    return modelModule.initModel();
  }
  if (modelModule && modelModule.Product) return modelModule.Product;
  if (modelModule && modelModule.Commande) return modelModule.Commande;
  if (modelModule && modelModule.Devis) return modelModule.Devis;
  if (modelModule && modelModule.DevisCompteur) return modelModule.DevisCompteur;
  if (modelModule && modelModule.Messagerie) return modelModule.Messagerie;
  return modelModule;
}

// Define available collections
const AVAILABLE_COLLECTIONS = [
  { name: 'products', modelModule: ProductModel, displayName: 'Produits' },
  { name: 'commandes', modelModule: CommandeModel, displayName: 'Commandes' },
  { name: 'devis', modelModule: DevisModel, displayName: 'Devis' },
  { name: 'devis-compteur', modelModule: DevisCompteurModel, displayName: 'Compteur Devis' },
  { name: 'messagerie', modelModule: MessagerieModel, displayName: 'Messages' }
];

// ✅ Controller for /info
exports.getBackupInfo = async (req, res) => {
  try {
    const info = [];

    for (const collection of AVAILABLE_COLLECTIONS) {
      try {
        const model = getModel(collection.modelModule);
        const count = await model.countDocuments();
        info.push({
          name: collection.name,
          displayName: collection.displayName,
          count: count,
          status: 'available'
        });
      } catch (error) {
        info.push({
          name: collection.name,
          displayName: collection.displayName,
          count: 0,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      databaseName: mongoose.connection.name,
      collections: info,
      totalCollections: AVAILABLE_COLLECTIONS.length,
      availableFormats: ['json', 'excel', 'pdf']
    });

  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      error: 'Failed to get backup info',
      message: error.message
    });
  }
};

// ✅ Controller for /export
exports.exportCollections = async (req, res) => {
  try {
    const { collections, format = 'json' } = req.body;

    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({ error: 'Veuillez sélectionner au moins une collection' });
    }

    console.log(`Starting backup for collections: ${collections.join(', ')} in format: ${format}`);

    const validCollections = AVAILABLE_COLLECTIONS.filter(col => collections.includes(col.name));
    if (validCollections.length === 0) {
      return res.status(400).json({ error: 'Aucune collection valide sélectionnée' });
    }

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'json':
        await exportAsJSON(res, validCollections, timestamp);
        break;
      case 'excel':
        await exportAsExcel(res, validCollections, timestamp);
        break;
      case 'pdf':
        await exportAsPDF(res, validCollections, timestamp);
        break;
      default:
        return res.status(400).json({ error: 'Format non supporté' });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'export',
      message: error.message
    });
  }
};

// ✅ JSON Export
async function exportAsJSON(res, collections, timestamp) {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.zip`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).send('Erreur lors de la création de l\'archive');
  });

  archive.pipe(res);

  for (const collection of collections) {
    try {
      console.log(`Exporting ${collection.name}...`);
      const model = getModel(collection.modelModule);
      const data = await model.find({}).lean();
      const jsonData = JSON.stringify(data, null, 2);
      archive.append(jsonData, { name: `${collection.name}.json` });
      console.log(`${collection.name}: ${data.length} documents exported`);
    } catch (error) {
      console.error(`Error exporting ${collection.name}:`, error);
      archive.append(
        JSON.stringify({ error: `Failed to export ${collection.name}: ${error.message}` }, null, 2),
        { name: `${collection.name}-error.json` }
      );
    }
  }

  // Metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    format: 'json',
    collections: collections.map(c => ({ name: c.name, displayName: c.displayName })),
    totalCollections: collections.length
  };

  archive.append(JSON.stringify(metadata, null, 2), { name: 'export-metadata.json' });
  await archive.finalize();
}

// ✅ Excel Export
async function exportAsExcel(res, collections, timestamp) {
  const workbook = XLSX.utils.book_new();

  for (const collection of collections) {
    try {
      console.log(`Exporting ${collection.name} to Excel...`);
      const model = getModel(collection.modelModule);
      const data = await model.find({}).lean();

      if (data.length > 0) {
        const flatData = data.map(doc => flattenObject(doc));
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        XLSX.utils.book_append_sheet(workbook, worksheet, collection.displayName);
      } else {
        const worksheet = XLSX.utils.aoa_to_sheet([['Aucune donnée disponible']]);
        XLSX.utils.book_append_sheet(workbook, worksheet, collection.displayName);
      }
    } catch (error) {
      console.error(`Error exporting ${collection.name} to Excel:`, error);
      const errorSheet = XLSX.utils.aoa_to_sheet([['Erreur', error.message]]);
      XLSX.utils.book_append_sheet(workbook, errorSheet, `${collection.displayName}-Erreur`);
    }
  }

  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.xlsx`);
  res.send(excelBuffer);
}

// ✅ PDF Export
async function exportAsPDF(res, collections, timestamp) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).text('Rapport de Sauvegarde de Base de Données', { align: 'center' });
  doc.fontSize(12).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown(2);

  for (const collection of collections) {
    try {
      console.log(`Exporting ${collection.name} to PDF...`);
      const model = getModel(collection.modelModule);
      const data = await model.find({}).lean();

      doc.fontSize(16).text(`${collection.displayName}`, { underline: true });
      doc.moveDown();

      if (data.length > 0) {
        doc.fontSize(12).text(`Nombre d'enregistrements: ${data.length}`);
        doc.moveDown();

        const sampleSize = Math.min(3, data.length);
        for (let i = 0; i < sampleSize; i++) {
          const flatRecord = flattenObject(data[i]);
          doc.fontSize(10).text(`Enregistrement ${i + 1}:`, { underline: true });

          Object.entries(flatRecord).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              doc.text(`  ${key}: ${String(value).substring(0, 100)}`);
            }
          });
          doc.moveDown();
        }

        if (data.length > sampleSize) {
          doc.text(`... et ${data.length - sampleSize} autres enregistrements`);
        }
      } else {
        doc.fontSize(12).text('Aucune donnée disponible');
      }

      doc.moveDown(2);
    } catch (error) {
      console.error(`Error exporting ${collection.name} to PDF:`, error);
      doc.fontSize(12).text(`Erreur lors de l'export de ${collection.displayName}: ${error.message}`);
      doc.moveDown(2);
    }
  }

  doc.end();
}

// ✅ Object flattening for Excel and PDF
function flattenObject(obj, prefix = '') {
  const flattened = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (obj[key] === null || obj[key] === undefined) {
        flattened[newKey] = '';
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else if (Array.isArray(obj[key])) {
        flattened[newKey] = JSON.stringify(obj[key]);
      } else if (obj[key] instanceof Date) {
        flattened[newKey] = obj[key].toISOString();
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }

  return flattened;
}
