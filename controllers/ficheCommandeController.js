const ficheCommandeModel = require('../models/ficheCommandeModel');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

// Configuration multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Middleware d'upload
exports.uploadMiddleware = upload.single('excelFile');

// Import Excel avec traitement multi-feuilles
exports.importExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier Excel fourni' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const fileName = req.file.originalname;
        const importDate = new Date();
        let totalImported = 0;
        const importResults = [];

        // Traiter chaque feuille du fichier Excel
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length === 0) continue;

            // Première ligne = en-têtes
            const headers = jsonData[0];
            const rows = jsonData.slice(1);

            console.log(`Traitement de la feuille "${sheetName}" avec ${rows.length} lignes`);

            // Convertir chaque ligne en objet
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0) continue;

                const rowData = {};
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                        rowData[header] = row[index];
                    }
                });

                // Extraire les couleurs de cellules si disponibles
                const rowIndex = i + 1; // +1 car on a sauté les headers
                for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    const cell = worksheet[cellAddress];
                    
                    if (cell && cell.s && cell.s.fgColor) {
                        const colorKey = `_${headers[colIndex]}_color`;
                        const color = cell.s.fgColor.rgb;
                        if (color) {
                            rowData[colorKey] = `#${color}`;
                        }
                    }
                    
                    // Couleur de fond de cellule
                    if (cell && cell.s && cell.s.bgColor) {
                        const colorKey = `_${headers[colIndex]}_bgcolor`;
                        const bgColor = cell.s.bgColor.rgb;
                        if (bgColor) {
                            rowData[colorKey] = `#${bgColor}`;
                        }
                    }
                }

                // Couleur de ligne entière si applicable
                const firstCellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
                const firstCell = worksheet[firstCellAddress];
                if (firstCell && firstCell.s && firstCell.s.bgColor) {
                    const rowBgColor = firstCell.s.bgColor.rgb;
                    if (rowBgColor) {
                        rowData._rowColor = `#${rowBgColor}`;
                    }
                }

                // Ajouter les métadonnées
                rowData._file = fileName;
                rowData._sheet = sheetName;
                rowData._importDate = importDate;
                rowData._isManual = false;

                try {
                    const FicheCommande = ficheCommandeModel.initModel();
                    const ficheCommande = new FicheCommande(rowData);
                    await ficheCommande.save();
                    totalImported++;
                } catch (error) {
                    console.error(`Erreur lors de l'insertion d'une ligne:`, error);
                }
            }

            importResults.push({
                sheet: sheetName,
                rowsProcessed: rows.length,
                rowsImported: rows.length
            });
        }

        res.status(200).json({
            message: 'Import Excel réussi',
            fileName: fileName,
            totalImported: totalImported,
            sheets: importResults,
            importDate: importDate
        });

    } catch (error) {
        console.error('Erreur lors de l\'import Excel:', error);
        res.status(500).json({ 
            message: 'Erreur lors de l\'import Excel', 
            error: error.message 
        });
    }
};

// Get all fiche commandes avec filtres
exports.getAllFicheCommandes = async (req, res) => {
    try {
        const { file, sheet, startDate, endDate, page = 1, limit = 100 } = req.query;
        
        // Construire les filtres
        const filters = {};
        if (file) filters._file = file; // Correspondance exacte pour le fichier
        if (sheet) filters._sheet = sheet; // Correspondance exacte pour la feuille
        if (startDate || endDate) {
            filters._importDate = {};
            if (startDate) filters._importDate.$gte = new Date(startDate);
            if (endDate) filters._importDate.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (page - 1) * limit;
        
        const FicheCommande = ficheCommandeModel.initModel();
        const ficheCommandes = await FicheCommande.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await FicheCommande.countDocuments(filters);

        // Obtenir les colonnes dynamiques
        const sampleDoc = await FicheCommande.findOne(filters);
        const columns = sampleDoc ? Object.keys(sampleDoc.toObject()).filter(key => !key.startsWith('__')) : [];

        res.status(200).json({
            data: ficheCommandes,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: ficheCommandes.length,
                totalRecords: total
            },
            columns: columns
        });
    } catch (error) {
        console.error('Error fetching fiche commandes:', error);
        res.status(500).json({ message: 'Error fetching fiche commandes', error: error.message });
    }
};

// Get summary statistics
exports.getSummary = async (req, res) => {
    try {
        const FicheCommande = ficheCommandeModel.initModel();
        const totalRecords = await FicheCommande.countDocuments();
        
        // Grouper par fichier
        const fileStats = await FicheCommande.aggregate([
            {
                $group: {
                    _id: '$_file',
                    count: { $sum: 1 },
                    sheets: { $addToSet: '$_sheet' },
                    lastImport: { $max: '$_importDate' }
                }
            },
            { $sort: { lastImport: -1 } }
        ]);

        // Grouper par feuille
        const sheetStats = await FicheCommande.aggregate([
            {
                $group: {
                    _id: { file: '$_file', sheet: '$_sheet' },
                    count: { $sum: 1 },
                    importDate: { $max: '$_importDate' }
                }
            },
            { $sort: { importDate: -1 } }
        ]);

        res.status(200).json({
            totalRecords,
            totalFiles: fileStats.length,
            files: fileStats,
            sheets: sheetStats
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
};

// Get a single fiche commande by ID
exports.getFicheCommandeById = async (req, res) => {
    try {
        const FicheCommande = ficheCommandeModel.initModel();
        const ficheCommande = await FicheCommande.findById(req.params.id);
        if (!ficheCommande) {
            return res.status(404).json({ message: 'Fiche commande not found' });
        }
        res.status(200).json(ficheCommande);
    } catch (error) {
        console.error('Error fetching fiche commande:', error);
        res.status(500).json({ message: 'Error fetching fiche commande', error: error.message });
    }
};

// Create a new fiche commande (ajout manuel)
exports.createFicheCommande = async (req, res) => {
    try {
        const ficheCommandeData = {
            ...req.body,
            _file: req.body._file || 'Manuel',
            _sheet: req.body._sheet || 'Manuel',
            _importDate: new Date(),
            _isManual: true
        };

        const FicheCommande = ficheCommandeModel.initModel();
        const newFicheCommande = new FicheCommande(ficheCommandeData);
        const savedFicheCommande = await newFicheCommande.save();
        res.status(201).json(savedFicheCommande);
    } catch (error) {
        console.error('Error creating fiche commande:', error);
        res.status(500).json({ message: 'Error creating fiche commande', error: error.message });
    }
};

// Update a fiche commande
exports.updateFicheCommande = async (req, res) => {
    try {
        const FicheCommande = ficheCommandeModel.initModel();
        const updatedFicheCommande = await FicheCommande.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedFicheCommande) {
            return res.status(404).json({ message: 'Fiche commande not found' });
        }
        
        res.status(200).json(updatedFicheCommande);
    } catch (error) {
        console.error('Error updating fiche commande:', error);
        res.status(500).json({ message: 'Error updating fiche commande', error: error.message });
    }
};

// Supprimer une fiche de commande par ID
exports.deleteFicheCommande = async (req, res) => {
    try {
        const { id } = req.params;
        const FicheCommande = ficheCommandeModel.initModel();
        
        const deletedFiche = await FicheCommande.findByIdAndDelete(id);
        
        if (!deletedFiche) {
            return res.status(404).json({ message: 'Fiche de commande non trouvée' });
        }
        
        res.json({ 
            message: 'Fiche de commande supprimée avec succès',
            deletedFiche 
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la fiche de commande:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de la fiche de commande',
            error: error.message 
        });
    }
};

// Supprimer toutes les fiches d'un fichier spécifique
exports.deleteByFile = async (req, res) => {
    try {
        const { fileName } = req.params;
        const decodedFileName = decodeURIComponent(fileName);
        const FicheCommande = ficheCommandeModel.initModel();
        
        const result = await FicheCommande.deleteMany({ _file: decodedFileName });
        
        res.json({ 
            message: `${result.deletedCount} fiches supprimées du fichier "${decodedFileName}"`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression du fichier',
            error: error.message 
        });
    }
};

// Obtenir les options de filtrage (fichiers et feuilles)
exports.getFilterOptions = async (req, res) => {
    try {
        const { file } = req.query;
        const FicheCommande = ficheCommandeModel.initModel();
        
        // Toujours retourner tous les fichiers
        const files = await FicheCommande.distinct('_file');
        
        // Si un fichier est spécifié, retourner seulement ses feuilles
        let sheets;
        if (file) {
            sheets = await FicheCommande.distinct('_sheet', { _file: file });
        } else {
            sheets = await FicheCommande.distinct('_sheet');
        }
        
        res.status(200).json({
            files: files.filter(f => f).sort(),
            sheets: sheets.filter(s => s).sort()
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ message: 'Error fetching filter options', error: error.message });
    }
};