const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function removeCommentsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;
    
    content = content.replace(/\/\*\*[\s\S]*?\*\//gm, '');
    content = content.replace(/\/\*[\s\S]*?\*\//gm, '');
    content = content.replace(/^\s*\/\/.*$/gm, '');
    content = content.replace(/\s+\/\/.*$/gm, '');
    content = content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}\u{2049}\u{20E3}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}]/gu, '');
    content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');
    content = content.replace(/^\s*\n/gm, '\n');
    
    const newLength = content.length;
    const removed = originalLength - newLength;
    
    if (removed > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}: Removed ${removed} characters`);
      return removed;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let totalRemoved = 0;
  let filesProcessed = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        totalRemoved += processDirectory(fullPath);
      }
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
      const removed = removeCommentsFromFile(fullPath);
      if (removed > 0) {
        filesProcessed++;
        totalRemoved += removed;
      }
    }
  }
  
  return totalRemoved;
}

console.log('🚀 Starting comment removal process...\n');
const totalRemoved = processDirectory(srcDir);
console.log(`\n✨ Done! Removed ${totalRemoved} characters total from source files.`);
