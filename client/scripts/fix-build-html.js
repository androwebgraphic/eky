#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildIndexPath = path.join(__dirname, '..', 'build', 'index.html');

// Read the build HTML file
let html = fs.readFileSync(buildIndexPath, 'utf8');

// Fix the JavaScript syntax by replacing comma-chained statements with semicolons
// Simple string replacement for the patterns we know exist
html = html.split('}),document').join('});document');
html = html.split('}),window').join('});window');

// Also fix the last statement in the script tag
html = html.split('})</script>').join('});</script>');

// Write the fixed HTML back to the file
fs.writeFileSync(buildIndexPath, html, 'utf8');

console.log('✓ Fixed build/index.html JavaScript syntax');