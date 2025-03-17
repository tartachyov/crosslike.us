// A simple script to package the extension for distribution
// Save this as package.js and run it with Node.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// You'll need to install archiver: npm install archiver
// This creates a ZIP file of your extension ready for distribution

// Configuration
const sourceDir = '.'; // Current directory
const outputFile = 'linkedin-automation-plugin.zip';
const ignoredPaths = [
  '.git',
  'node_modules',
  outputFile,
  'package.js',
  'package-lock.json',
  'package.json',
  '.gitignore'
];

// Create output stream
const output = fs.createWriteStream(path.join(__dirname, outputFile));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for errors
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to output file
archive.pipe(output);

// Walk through the directory and add files
function addDirectoryToArchive(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const relativePath = path.relative(sourceDir, filePath);
    
    // Skip ignored paths
    if (ignoredPaths.some(ignoredPath => relativePath.startsWith(ignoredPath))) {
      continue;
    }
    
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Recursively add directories
      addDirectoryToArchive(filePath);
    } else {
      // Add file to archive
      archive.file(filePath, { name: relativePath });
      console.log(`Added: ${relativePath}`);
    }
  }
}

// Start packaging
console.log('Creating extension package...');
addDirectoryToArchive(sourceDir);

// Finalize the archive
archive.finalize();

console.log(`Extension packaged successfully: ${outputFile}`);