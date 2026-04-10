// Test script for word filter
// Usage: node scripts/test-word-filter.js

const { checkMessage, getWordList, getSupportedLanguages } = require('../utils/wordFilter');

console.log('=== WORD FILTER TEST ===\n');

const languages = getSupportedLanguages();
console.log('Supported languages:', languages.join(', '), '\n');

// Test messages that should be blocked
const testMessages = {
  en: [
    'How much for dog?',
    'Selling my dog for $500',
    'I want to buy a puppy',
    'Trade my dog for yours',
    'Looking to exchange dogs',
    'What is price?',
    'Make me an offer',
    'Free dog to good home',
    'Rehoming fee required',
    'PayPal accepted'
  ],
  hr: [
    'Koliko košta pas?',
    'Prodajem psa za 500 eura',
    'Želim kupiti štene',
    'Razmijeniti svog psa',
    'Tražim zamjenu pasa',
    'Kolika je cijena?',
    'Napravite ponudu',
    'Besplatan pas',
    'Naknada za udomljavanje',
    'PayPal prihvaćam'
  ],
  de: [
    'Wie viel für den Hund?',
    'Verkaufe meinen Hund für 500 Euro',
    'Ich möchte einen Hund kaufen',
    'Tausche meinen Hund',
    'Suche Tauschpartner',
    'Was ist der Preis?',
    'Machen Sie ein Angebot',
    'Kostenloser Hund',
    'Umgangsgebühr erforderlich',
    'PayPal akzeptiert'
  ],
  hu: [
    'Mennyibe kerül a kutya?',
    'Eladom a kutyámat 500 forintért',
    'Szeretnék venni egy kutyát',
    'Cserélem a kutyámat',
    'Keresek cserét',
    'Mi az ára?',
    'Tegyen ajánlatot',
    'Ingyenes kutya',
    'Átvételi díj szükséges',
    'PayPal elfogadott'
  ]
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('=== TESTING BLOCKED MESSAGES ===\n');

for (const lang of languages) {
  const messages = testMessages[lang] || [];
  console.log(`\n--- ${lang.toUpperCase()} (${messages.length} messages) ---`);
  
  for (const message of messages) {
    totalTests++;
    const result = checkMessage(message, lang);
    
    if (result.isProhibited) {
      passedTests++;
      console.log(`✅ PASS: "${message}" blocked (matched: "${result.matchedWord}")`);
    } else {
      failedTests++;
      console.log(`❌ FAIL: "${message}" NOT blocked (should be blocked)`);
    }
  }
}

// Test messages that should be allowed
const allowedMessages = [
  'Hello, how are you?',
  'I love my dog',
  'The dog is very cute',
  'Can we meet to see the dog?',
  'What breed is the dog?',
  'How old is the dog?',
  'Is the dog vaccinated?',
  'Where is the dog located?',
  'The dog likes playing',
  'Cute puppy!'
];

console.log('\n\n=== TESTING ALLOWED MESSAGES ===\n');

for (const message of allowedMessages) {
  totalTests++;
  const result = checkMessage(message, 'en');
  
  if (!result.isProhibited) {
    passedTests++;
    console.log(`✅ PASS: "${message}" allowed`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: "${message}" blocked (matched: "${result.matchedWord}") - SHOULD BE ALLOWED`);
  }
}

// Summary
console.log('\n\n=== TEST SUMMARY ===');
console.log('Total tests:', totalTests);
console.log('Passed:', passedTests);
console.log('Failed:', failedTests);
console.log('Success rate:', ((passedTests / totalTests) * 100).toFixed(2) + '%');

// Show word list stats
console.log('\n\n=== WORD LIST STATISTICS ===');
for (const lang of languages) {
  const words = getWordList(lang);
  console.log(`${lang.toUpperCase()}: ${words.length} phrases`);
}

const totalPhrases = languages.reduce((sum, lang) => sum + getWordList(lang).length, 0);
console.log(`\nTotal phrases: ${totalPhrases}`);

if (failedTests === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed`);
  process.exit(1);
}