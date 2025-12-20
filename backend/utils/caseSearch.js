const db = require('../db');

async function findSimilarCases(caseId, title, description, limit = 5) {
    // 1️⃣ Split title and description into keywords
    const keywords = title.split(' ').concat(description.split(' '));

    // 2️⃣ Build SQL LIKE patterns
    const keywordPattern = keywords.map(k => `%${k}%`);

    // 3️⃣ Build WHERE clause dynamically
    const placeholders = keywordPattern.map(() => `(title LIKE ? OR description LIKE ?)`).join(' OR ');

    // 4️⃣ Prepare values for query
    const values = [];
    keywordPattern.forEach(k => {
        values.push(k, k); // once for title, once for description
    });

    // 5️⃣ SQL query to find similar cases
    const query = `
        SELECT * FROM cases
        WHERE id != ? AND (${placeholders})
        LIMIT ?
    `;

    // Exclude current case ID and add limit
    values.unshift(caseId);
    values.push(limit);

    // Execute query
    const [results] = await db.query(query, values);
    return results;
}

module.exports = { findSimilarCases };
