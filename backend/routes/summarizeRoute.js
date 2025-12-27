const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
// Using pdf-parse-new for better compatibility with modern Node environments
const pdf = require('pdf-parse-new'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ---------------------------------------------------------
// POST: /api/summarize/:documentId
// ---------------------------------------------------------
router.post('/:documentId', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
    const { documentId } = req.params;

    try {
        // 1. Fetch document details from DB
        const [docs] = await db.query(
            'SELECT file_path, case_id, file_type FROM documents WHERE id = ?', 
            [documentId]
        );
        
        if (docs.length === 0) {
            return res.status(404).json({ success: false, message: "Document not found in database." });
        }

        const { file_path, case_id, file_type } = docs[0];

        // 2. Format validation
        if (file_type !== 'application/pdf') {
            return res.status(400).json({ success: false, message: "AI summarization currently only supports PDF files." });
        }

        // 3. Check if file exists on disk
        if (!fs.existsSync(file_path)) {
            return res.status(404).json({ success: false, message: "Physical file not found on server." });
        }

        // 4. Extract text from the PDF directly (No Unzipping)
        // Read the file into a buffer
        const contentBuffer = fs.readFileSync(file_path);
        
        // Extract text using pdf-parse-new
        const pdfData = await pdf(contentBuffer);
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length < 20) {
            return res.status(400).json({ 
                success: false, 
                message: "Could not extract readable text. The PDF might be a scanned image or protected." 
            });
        }

        // 5. Send to Gemini for the Nepali Gist
        // We limit text to 15,000 characters to stay within token limits while capturing most content
        const prompt = `
            तपाईं एक नेपाली कानूनी विशेषज्ञ हुनुहुन्छ। 
            तल दिइएको कानूनी कागजातको मुख्य कुराहरू (Gist) ३-४ बुँदामा स्पष्टसँग नेपालीमा लेख्नुहोस्।
            कागजातको विषय, मुख्य पक्षहरू र निष्कर्षमा केन्द्रित हुनुहोस्।
            
            कागजातको पाठ (Document Text): 
            ${extractedText.substring(0, 15000)}
        `;

        const result = await model.generateContent(prompt);
        const summaryText = result.response.text();

        // 6. Save to the 'summaries' table
        // Ensure you have this table in your database with these columns
        await db.query(
            'INSERT INTO summaries (case_id, document_id, summary_text) VALUES (?, ?, ?)',
            [case_id, documentId, summaryText]
        );

        // 7. Return the result
        res.json({
            success: true,
            message: "Summary generated successfully.",
            data: summaryText
        });

    } catch (error) {
        console.error("Summarization Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "An error occurred during AI processing.",
            error: error.message 
        });
    }
});

module.exports = router;