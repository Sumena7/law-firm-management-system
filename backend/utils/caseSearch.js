const db = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const model = genAI.getGenerativeModel({ 
model: "gemini-2.5-flash-lite",
  generationConfig: { 
    responseMimeType: "application/json" 
  } 
});

async function findSimilarCases(caseId, title, description, limit = 5) {
  try {
    const [allCases] = await db.query(
      'SELECT id, title, description FROM cases WHERE id != ?',
      [caseId]
    );

    if (!allCases.length) return [];

    const prompt = `
      You are a strict legal research expert. Analyze the similarity between the "Target Case" and the "Candidate List".
      
      SCORING RULES:
      - 0.9 - 1.0: Extremely similar facts and legal issues.
      - 0.7 - 0.8: Similar legal category with comparable facts.
      - 0.4 - 0.6: Same legal category but DIFFERENT facts (Treat these as low relevance).
      - Below 0.4: Unrelated.

      Target Case:
      Title: ${title}
      Facts: ${description}

      Candidate List:
      ${JSON.stringify(allCases)}

      Return ONLY a JSON array of objects: [{"id": number, "similarity": number}]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    
    let aiResults = JSON.parse(response.text());

    if (!Array.isArray(aiResults)) return [];

    const aiMatches = aiResults.map(r => ({
      id: Number(r.id),
      similarity: Number(r.similarity) || 0
    }));

    const ids = aiMatches.map(r => r.id);
    if (!ids.length) return [];


    const [cases] = await db.query(
      `SELECT * FROM cases WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

   
    const MIN_SIMILARITY = 0.7;

    const merged = cases.map(c => {
      const match = aiMatches.find(r => r.id === c.id);
      return { ...c, similarity: match ? match.similarity : 0 };
    });

    return merged
      .filter(c => c.similarity >= MIN_SIMILARITY)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (err) {
    console.error("AI Similarity Error:", err.message);
    return [];
  }
}

module.exports = { findSimilarCases };