const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const archiver = require('archiver');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// -------------------- Setup --------------------
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// ============================================================
// 1. GENERAL ROUTES
// ============================================================

// GET ALL DOCUMENTS (Admin/Staff)
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
  try {
    const query = `
      SELECT d.id, d.case_id, d.file_name, d.file_type, d.uploaded_at,
             c.title AS case_title, u.name AS uploaded_by_name
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC`;
    const [results] = await db.query(query);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// UPLOAD DOCUMENTS
router.post('/', verifyToken, allowRoles('admin', 'staff', 'lawyer'), upload.array('documents', 10), async (req, res) => {
  const { case_id } = req.body;
  const uploaded_by = req.user.id;

  if (!case_id || !req.files) return res.status(400).json({ success: false, message: 'Missing data' });

  try {
    const insertedIds = [];
    for (const file of req.files) {
      const query = `INSERT INTO documents (case_id, uploaded_by, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?)`;
      const [results] = await db.query(query, [case_id, uploaded_by, file.originalname, file.path, file.mimetype]);
      insertedIds.push(results.insertId);
    }
    res.json({ success: true, message: 'Uploaded successfully', documentIds: insertedIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Upload error' });
  }
});

// ============================================================
// 2. SPECIFIC SUB-PATH ROUTES
// ============================================================

// GET DOCUMENTS BY LAWYER ID
router.get('/lawyer/:userId', verifyToken, allowRoles('admin', 'lawyer'), async (req, res) => {
  const { userId } = req.params;
  try {
    const [lawyerRow] = await db.query(`SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)`, [userId]);
    if (!lawyerRow.length) return res.json({ success: true, data: [] });

    const query = `
      SELECT d.id, d.case_id, d.file_name, d.file_type, d.uploaded_at, c.title AS case_title, u.name AS uploaded_by_name
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      JOIN users u ON d.uploaded_by = u.id
      WHERE c.assigned_lawyer_id = ?`;
    const [results] = await db.query(query, [lawyerRow[0].id]);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DOWNLOAD ALL DOCUMENTS FOR A CASE (Combined ZIP)
router.get('/download/case/:case_id', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
  const { case_id } = req.params;
  try {
    const [docs] = await db.query('SELECT file_path, file_name FROM documents WHERE case_id = ?', [case_id]);
    if (!docs.length) return res.status(404).json({ success: false, message: 'No files found for this case' });

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`case_${case_id}_documents.zip`);
    archive.pipe(res);

    for (const doc of docs) {
      if (fs.existsSync(doc.file_path)) {
        archive.file(doc.file_path, { name: doc.file_name });
      }
    }
    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating zip' });
  }
});

// ============================================================
// 3. INDIVIDUAL PARAMETER ROUTES
// ============================================================

// DOWNLOAD SINGLE FILE
router.get('/download/:id', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT file_path, file_name FROM documents WHERE id = ?', [id]);
    if (!results.length) return res.status(404).json({ success: false, message: 'File not found' });

    const { file_path, file_name } = results[0];
    if (!fs.existsSync(file_path)) return res.status(404).json({ success: false, message: 'File missing' });

    res.download(file_path, file_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Download error' });
  }
});

// PREVIEW SINGLE FILE - FIXED WITH SEND_FILE
router.get('/preview/:id', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT file_path, file_type FROM documents WHERE id = ?', [id]);
    if (!results.length) return res.status(404).json({ success: false, message: 'File not found' });

    const { file_path, file_type } = results[0];
    
    if (!fs.existsSync(file_path)) return res.status(404).json({ success: false, message: 'File missing' });

    // Explicitly set headers for browser viewing
    res.setHeader('Content-Type', file_type);
    res.setHeader('Content-Disposition', 'inline');

    // sendFile is more stable than createReadStream for browser PDF readers
    res.sendFile(file_path);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Preview error' });
  }
});

// DELETE DOCUMENT
router.delete('/:id', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT file_path FROM documents WHERE id = ?', [id]);
    if (results.length > 0 && fs.existsSync(results[0].file_path)) fs.unlinkSync(results[0].file_path);
    await db.query('DELETE FROM documents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Delete error' });
  }
});

module.exports = router;