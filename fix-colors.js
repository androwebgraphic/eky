const fs = require('fs');

console.log('Updating colors...');

// Fix 1: index.css
const indexFile = 'client/src/css/index.css';
if (fs.existsSync(indexFile)) {
  let content = fs.readFileSync(indexFile, 'utf8');
  // Replace #43a047 (Green) with #ef9f27 (Yellow)
  content = content.split('#43a047').join('#ef9f27');
  fs.writeFileSync(indexFile, content, 'utf8');
  console.log(`[OK] Updated ${indexFile}`);
} else {
  console.log(`[ERROR] ${indexFile} not found`);
}

// Fix 2: _card-styles.scss
const scssFile = 'client/src/sass/partials/_card-styles.scss';
if (fs.existsSync(scssFile)) {
  let content = fs.readFileSync(scssFile, 'utf8');
  // Replace #43a047 (Green) with #ef9f27 (Yellow)
  content = content.replace(/#43a047/g, '#ef9f27');
  // Replace #d7c96c (Edit) with #ef9f27 (Yellow)
  content = content.replace(/#d7c96c/g, '#ef9f27');
  fs.writeFileSync(scssFile, content, 'utf8');
  console.log(`[OK] Updated ${scssFile}`);
} else {
  console.log(`[ERROR] ${scssFile} not found`);
}

console.log('Done.');

// Step 2: Add Mobile Header & Modal CSS Save this as add-mobile-css.js in your project root.

const targetFile = 'client/src/css/mobile-fixes.css';
const cssToAppend = `/* Mobile Header Fix */
@media (max-width: 768px) {
  .mobile-nav-simple, .mobile-nav-only {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100vw !important;
    height: 60px !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  .mobile-nav-simple .sharedog-icon, .mobile-nav-simple svg {
    display: flex !important;
    align-items: center !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 1 !important;
  }
  .header-mobile-right {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    height: 60px !important;
    gap: 12px !important;
  }
}

/* Mobile Modal Fix */
@media (max-width: 767px) {
  .card-actions.dog-details-mobile-actions {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
    width: 100% !important;
  }
  .card-actions.dog-details-mobile-actions button {
    width: 100% !important;
    min-height: 50px !important;
  }
  .card-actions.dog-details-mobile-actions button#adopt {
    grid-column: 1 / -1 !important;
    background-color: #ef9f27 !important;
    color: #ffffff !important;
  }
}`;

if (fs.existsSync(targetFile)) {
  fs.appendFileSync(targetFile, cssToAppend, 'utf8');
  console.log(`[OK] Appended fixes to ${targetFile}`);
} else {
  fs.writeFileSync(targetFile, cssToAppend, 'utf8');
  console.log(`[OK] Created ${targetFile} with fixes`);
}