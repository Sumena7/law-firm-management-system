const compressFile = require('../utils/compressFile');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// -------------------- Ensure uploads folder exists -------------------- //
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -------------------- Multer setup -------------------- //
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPEG, PNG, DOC, DOCX files are allowed'));
        }
    }
});

// -------------------- Upload a document -------------------- //
router.post(
    '/',
    verifyToken,
    allowRoles('admin', 'staff', 'lawyer'),
    (req, res, next) => {
        upload.single('document')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: err.message });
            } else if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            next();
        });
    },
    async (req, res) => {
        const { case_id } = req.body;
        const uploaded_by = req.user.id;

        if (!case_id) return res.status(400).json({ success: false, message: 'case_id is required' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const file_name = req.file.originalname;
        const file_path = req.file.path;
        const file_type = req.file.mimetype;

        try {
            // -------------------- Compress the uploaded file -------------------- //
            const compressedPath = await compressFile(file_path);

            // Optional: delete original uncompressed file
            fs.unlinkSync(file_path);

            // -------------------- Save compressed file info to DB -------------------- //
            const query = `
                INSERT INTO documents (case_id, uploaded_by, file_name, file_path, file_type)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(query, [case_id, uploaded_by, file_name, compressedPath, file_type], (err, results) => {
                if (err) {
                    console.error('Error saving document:', err);
                    return res.status(500).json({ success: false, message: 'Error saving document' });
                }
                res.json({ success: true, message: 'Document uploaded and compressed successfully', documentId: results.insertId });
            });

        } catch (error) {
            console.error('Compression error:', error);
            return res.status(500).json({ success: false, message: 'Error compressing document' });
        }
    }
);


// -------------------- Get documents by case -------------------- //
router.get(
    '/case/:case_id',
    verifyToken,
    allowRoles('admin', 'staff', 'lawyer'),
    (req, res) => {
        const { case_id } = req.params;

        const sql = `
            SELECT 
                documents.*,
                users.id AS uploaded_by_id,
                users.name AS uploaded_by_name,
                users.email AS uploaded_by_email
            FROM documents
            JOIN users ON documents.uploaded_by = users.id
            WHERE documents.case_id = ?
        `;

        db.query(sql, [case_id], (err, results) => {
            if (err) {
                console.error('Error fetching documents:', err);
                return res.status(500).json({ success: false, message: 'Error fetching documents' });
            }
            res.json({ success: true, data: results });
        });
    }
);


// -------------------- Delete a document -------------------- //
router.delete(
    '/:id',
    verifyToken,
    allowRoles('admin', 'staff'),
    (req, res) => {
        const { id } = req.params;

        db.query('SELECT file_path FROM documents WHERE id = ?', [id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }

            const filePath = results[0].file_path;

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file from server:', err);
                    return res.status(500).json({ success: false, message: 'Failed to delete file from server' });
                }

                db.query('DELETE FROM documents WHERE id = ?', [id], (err, results) => {
                    if (err) {
                        console.error('Error deleting document from DB:', err);
                        return res.status(500).json({ success: false, message: 'Error deleting document' });
                    }
                    res.json({ success: true, message: 'Document deleted successfully' });
                });
            });
        });
    }
);

/// -------------------- Download a document securely -------------------- //
// Roles: admin, staff, lawyer
const unzipper = require('unzipper');
const os = require('os');

router.get(
    '/download/:id',
    verifyToken,
    allowRoles('admin', 'staff', 'lawyer'),
    async (req, res) => {
        const { id } = req.params;

        try {
            // 1️⃣ Get document info from DB
            const [results] = await db.query('SELECT file_path, file_name FROM documents WHERE id = ?', [id]);
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'File not found' });
            }

            const { file_path, file_name } = results[0];

            // 2️⃣ Create a temporary folder for extraction
            const tempDir = path.join(os.tmpdir(), `doc_${id}`);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // 3️⃣ Extract the file from zip
            await fs.createReadStream(file_path)
                .pipe(unzipper.Extract({ path: tempDir }))
                .promise();

            const extractedFilePath = path.join(tempDir, file_name);

            // 4️⃣ Send the extracted file
            res.download(extractedFilePath, file_name, (err) => {
                // Clean up temporary folder after sending
                fs.rmSync(tempDir, { recursive: true, force: true });
                if (err) console.error('Error downloading file:', err);
            });

        } catch (error) {
            console.error('Download error:', error);
            return res.status(500).json({ success: false, message: 'Error downloading file' });
        }
    }
);

// -------------------- Preview a document securely -------------------- //
// Roles: admin, staff, lawyer

router.get(
    '/preview/:id',
    verifyToken,
    allowRoles('admin', 'staff', 'lawyer'),
    async (req, res) => {
        const { id } = req.params;

        try {
            // 1️⃣ Get document info from DB
            const [results] = await db.query('SELECT file_path, file_name, file_type FROM documents WHERE id = ?', [id]);
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'File not found' });
            }

            const { file_path, file_name, file_type } = results[0];

            // 2️⃣ Only allow preview for PDFs and images
            if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file_type)) {
                return res.status(400).json({ success: false, message: 'Preview not supported for this file type' });
            }

            // 3️⃣ Create temporary folder for extraction
            const tempDir = path.join(os.tmpdir(), `preview_${id}`);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // 4️⃣ Extract the file from zip
            await fs.createReadStream(file_path)
                .pipe(unzipper.Extract({ path: tempDir }))
                .promise();

            const extractedFilePath = path.join(tempDir, file_name);

            // 5️⃣ Set headers and stream the file
            res.setHeader('Content-Type', file_type);
            res.setHeader('Content-Disposition', 'inline');

            const fileStream = fs.createReadStream(extractedFilePath);
            fileStream.pipe(res);

            // 6️⃣ Clean up temporary folder after streaming
            fileStream.on('close', () => {
                fs.rmSync(tempDir, { recursive: true, force: true });
            });

        } catch (error) {
            console.error('Preview error:', error);
            res.status(500).json({ success: false, message: 'Error previewing file' });
        }
    }
);



module.exports = router;
