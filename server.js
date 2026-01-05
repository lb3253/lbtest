const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'serial-numbers-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed'));
        }
    }
});

// In-memory storage for serial numbers (could be replaced with a database)
let serialNumbers = [];
let lastUpdated = null;

// API Routes

// GET - Retrieve serial numbers
app.get('/api/serials', (req, res) => {
    res.json({
        success: true,
        count: serialNumbers.length,
        lastUpdated: lastUpdated,
        data: serialNumbers
    });
});

// POST - Upload Excel file with serial numbers
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Read the uploaded Excel file
        const workbook = XLSX.readFile(req.file.path);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract serial numbers from first column
        const extracted = [];
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row[0]) {
                const serial = String(row[0]).trim();
                if (serial) {
                    extracted.push(serial);
                }
            }
        }

        // Remove duplicates
        serialNumbers = [...new Set(extracted)];
        lastUpdated = new Date().toISOString();

        // Delete the uploaded file (data is now in memory)
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Successfully loaded ${serialNumbers.length} serial numbers`,
            count: serialNumbers.length,
            lastUpdated: lastUpdated
        });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE - Clear serial numbers
app.delete('/api/serials', (req, res) => {
    serialNumbers = [];
    lastUpdated = null;

    res.json({
        success: true,
        message: 'Serial numbers cleared'
    });
});

// GET - Check server status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        serialsLoaded: serialNumbers.length,
        lastUpdated: lastUpdated
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ PC Refresh Lookup Server running on http://localhost:${PORT}`);
    console.log(`✓ API endpoints:`);
    console.log(`  - GET  /api/serials  - Retrieve serial numbers`);
    console.log(`  - POST /api/upload   - Upload Excel file`);
    console.log(`  - DELETE /api/serials - Clear serial numbers`);
    console.log(`  - GET  /api/status   - Server status`);
});
