// utils/caseSearch.js
const db = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini once
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function findSimilarCases(caseId, title, description, limit = 5) {
  try {
    // 1️⃣ Fetch all other cases from DB
    const [allCases] = await db.query('SELECT * FROM cases WHERE id != ?', [caseId]);
    if (allCases.length === 0) return [];

    // 2️⃣ Prepare AI prompt
    const prompt = `
      You are a legal expert. Compare the following case with other cases for similarity.
      
      Current Case:
      Title: ${title}
      Description: ${description}

      Other Cases:
      ${JSON.stringify(allCases.map(c => ({ id: c.id, title: c.title, description: c.description })))}

      Return the top ${limit} most similar cases as a JSON array in this format:
      [
        { "id": case_id, "similarity": similarity_score },
        ...
      ]
      Only JSON, no extra text.
    `;

    // 3️⃣ Ask Gemini
    const aiResponse = await model.generateContent(prompt);
    const rawText = aiResponse.response.text();

    // 4️⃣ Robust JSON extraction using regex
    let similarCasesAI = [];
    try {
      // Match the first JSON array in the text
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        similarCasesAI = JSON.parse(jsonMatch[0]);
      } else {
        console.error("AI did not return a JSON array:", rawText);
        return [];
      }
    } catch (err) {
      console.error("AI JSON parsing failed:", rawText, err);
      return [];
    }

    if (!Array.isArray(similarCasesAI) || similarCasesAI.length === 0) return [];

    // 5️⃣ Fetch full details of top similar cases from DB
    const ids = similarCasesAI.map(c => c.id);
    const [similarCases] = await db.query(
      `SELECT * FROM cases WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    // 6️⃣ Merge similarity score
    const merged = similarCases.map(c => {
      const match = similarCasesAI.find(a => a.id == c.id);
      return { ...c, similarity: match?.similarity || 0 };
    });

    // 7️⃣ Sort by similarity descending
merged.sort((a, b) => b.similarity - a.similarity);

// 8️⃣ Filter by minimum similarity (e.g., 0.5)
const MIN_SIMILARITY = 0.5;
const filtered = merged.filter(c => c.similarity >= MIN_SIMILARITY);

return filtered.slice(0, limit);


  } catch (err) {
    console.error("Error in findSimilarCases:", err);
    return [];
  }
}

module.exports = { findSimilarCases };
