const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse-new'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// 1. Correct Initialization for 2.5-flash-lite
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

router.post('/:documentId', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
    const { documentId } = req.params;

    try {
        const [docs] = await db.query(
            'SELECT file_path, case_id, file_type FROM documents WHERE id = ?', 
            [documentId]
        );
        
        if (docs.length === 0) return res.status(404).json({ success: false, message: "Document not found." });

        const { file_path, case_id, file_type } = docs[0];

        // 2. Normalize Windows Paths
        const normalizedPath = path.resolve(file_path);
        if (!fs.existsSync(normalizedPath)) {
            return res.status(404).json({ success: false, message: "File missing on disk." });
        }

        // 3. Extract Text
        const contentBuffer = fs.readFileSync(normalizedPath);
        const pdfData = await pdf(contentBuffer);
        
        // Clean white spaces and newlines
        let extractedText = pdfData.text.replace(/\s+/g, ' ').trim();

        // DEBUG: Check your terminal after clicking 'AI Gist'
        console.log("--- DEBUG: EXTRACTED TEXT START ---");
        console.log(extractedText || "NO TEXT FOUND");
        console.log("--- DEBUG: EXTRACTED TEXT END ---");

        if (!extractedText || extractedText.length < 20) {
            return res.status(400).json({ 
                success: false, 
                message: "Text extraction failed. This PDF might be an image scan." 
            });
        }

        // 4. Generate Content (Variable fixed to extractedText)
        const prompt = `
    तपाईं एक अनुभवी नेपाली कानूनी विशेषज्ञ हुनुहुन्छ। 
    तल दिइएको कानूनी कागजातको मुख्य कुराहरू (Gist) बुँदागत रूपमा (Bullet Points) नेपालीमा लेख्नुहोस्।

    नियमहरू (Strict Rules):
    १. प्रत्येक बुँदा (Point) अनिवार्य रूपमा नयाँ लाइनमा हुनुपर्छ।
    २. बुँदाहरू बीच एक खाली लाइन छोड्नुहोस्।
    ३. ३-५ वटा मुख्य बुँदाहरू मात्र लेख्नुहोस्।
    ४. सिधै बुँदाहरूबाट सुरु गर्नुहोस्, कुनै पनि भूमिका नलेख्नुहोस्।
    
    कागजातको पाठ: 
    ${extractedText.substring(0, 15000)}
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ]
        });
        
        const summaryText = result.response.text();

        // 5. Save to DB
        await db.query(
            'INSERT INTO summaries (case_id, document_id, summary_text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE summary_text = ?',
            [case_id, documentId, summaryText, summaryText]
        );

        res.json({ success: true, data: summaryText });

    } catch (error) {
        console.error("Summarization Error:", error);
        res.status(500).json({ success: false, message: "AI Error: " + error.message });
    }
});

module.exports = router;