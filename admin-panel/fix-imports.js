const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all versioned imports
  content = content.replace(/@radix-ui\/([^@]+)@[\d.]+/g, '@radix-ui/$1');
  content = content.replace(/class-variance-authority@[\d.]+/g, 'class-variance-authority');
  content = content.replace(/react-hook-form@[\d.]+/g, 'react-hook-form');
  content = content.replace(/lucide-react@[\d.]+/g, 'lucide-react');
  content = content.replace(/next-themes@[\d.]+/g, 'next-themes');
  content = content.replace(/sonner@[\d.]+/g, 'sonner');
  content = content.replace(/react-resizable-panels@[\d.]+/g, 'react-resizable-panels');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Get all .tsx files in ui directory
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(uiDir, file);
  console.log(`Fixing ${file}...`);
  fixImports(filePath);
});

console.log('All imports fixed!');

