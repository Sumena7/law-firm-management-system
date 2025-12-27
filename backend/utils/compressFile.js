const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');

const compressFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  // ===============================
  // IMAGE COMPRESSION
  // ===============================
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const outputPath = filePath.replace(ext, `_compressed${ext}`);

    await sharp(filePath)
      .jpeg({ quality: 75 })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    return outputPath;
  }

  // ===============================
  // PDF COMPRESSION (Ghostscript)
  // ===============================
  if (ext === '.pdf') {
    const outputPath = filePath.replace('.pdf', '_compressed.pdf');

    await new Promise((resolve, reject) => {
      exec(
        `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sOutputFile="${outputPath}" "${filePath}"`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    return outputPath;
  }

  // ===============================
  // DOC / DOCX (no compression)
  // ===============================
  return filePath;
};

module.exports = compressFile;
