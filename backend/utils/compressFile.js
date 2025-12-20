const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const compressFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const zipPath = filePath + '.zip';
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(zipPath));
    archive.on('error', err => reject(err));

    archive.pipe(output);
    archive.file(filePath, { name: path.basename(filePath) });
    archive.finalize();
  });
};

module.exports = compressFile;
