/**
 * Word Filter System for Chat Messages
 * Blocks messages containing dog sale/trade/exchange related words
 * Supports English, Croatian, German, and Hungarian
 */

const wordLists = {
  // English banned words
  en: [
    'sale', 'sell', 'selling', 'sold',
    'buy', 'buying', 'bought',
    'purchase', 'purchasing',
    'trade', 'trading',
    'exchange', 'exchanging',
    'swap', 'swapping',
    'money', 'cash',
    'price', 'pricing', 'priced',
    'cost', 'costs',
    'payment', 'pay',
    'paypal', 'venmo',
    'offer', 'offers',
    'for sale', 'for sale!',
    'selling dog', 'selling dogs',
    'how much', 'how much?',
    'buy dog', 'buy dogs',
    'purchase dog', 'purchase dogs',
    'trade dog', 'trade dogs',
    'swap dog', 'swap dogs',
    'exchange dog', 'exchange dogs',
    'price of dog', 'price of dogs',
    'cost of dog', 'cost of dogs',
    'dog for sale', 'dogs for sale',
    'puppy for sale', 'puppies for sale',
    'sell for', 'sold for'
  ],
  
  // Croatian banned words
  hr: [
    'prodaja', 'prodajem', 'prodajna',
    'kupim', 'kupiti', 'kupnja',
    'trgovina', 'trgovim',
    'razmjena', 'razmijeniti',
    'novac', 'novca',
    'cijena', 'cijenu',
    'plaćanje', 'platiti', 'plaćam',
    'gotovina',
    'ponuda', 'ponudu',
    'na prodaju', 'na prodaju!',
    'prodajem psa', 'prodajem pse',
    'prodaja psa', 'prodaja pasa',
    'koliko', 'koliko?',
    'kupiti psa', 'kupim psa',
    'trgovina psa', 'razmjena psa',
    'cijena psa', 'cijena pasa',
    'pas na prodaju', 'psi na prodaju',
    'štene na prodaju', 'štenad na prodaju',
    'prodajem za', 'prodato za'
  ],
  
  // German banned words
  de: [
    'verkauf', 'verkaufe', 'verkauf',
    'kaufen', 'kauf', 'kaufe',
    'kaufe', 'gekauft',
    'handel', 'handeln',
    'tausch', 'tauschen',
    'geld', 'geldes',
    'preis', 'preise',
    'bezahlung', 'bezahlen', 'bezahle',
    'bargeld',
    'angebot', 'angebote',
    'zu verkaufen', 'zu verkaufen!',
    'hund verkaufen', 'hunde verkaufen',
    'wie viel', 'wie viel?',
    'hund kaufen', 'hunde kaufen',
    'hund tauschen', 'hunde tauschen',
    'preis für hund', 'preis für hunde',
    'hund zu verkaufen', 'hunde zu verkaufen',
    'welpe zu verkaufen', 'welpen zu verkaufen',
    'verkaufe für', 'verkauft für'
  ],
  
  // Hungarian banned words
  hu: [
    'eladás', 'eladom', 'eladása',
    'veszek', 'venni', 'vétel',
    'kereskedelem', 'kereskedem',
    'csere', 'cserélni', 'cserélem',
    'pénz', 'pénze',
    'ár', 'ára',
    'fizetés', 'fizetni', 'fizetek',
    'készpénz',
    'ajánlat', 'ajánlatot',
    'eladásra', 'eladásra!',
    'eladom a kutyát', 'eladom a kutyákat',
    'kutyák eladása', 'kutya eladása',
    'mennyit', 'mennyit?',
    'kutyát venni', 'kutyát veszek',
    'kutyát cserélni', 'kutyákat cserélni',
    'kutya ára', 'kutyák ára',
    'eladásra kutya', 'eladásra kutyák',
    'kölyök eladásra', 'kölykök eladásra',
    'eladom forintért', 'eladtam forintért'
  ]
};

/**
 * Check if a message contains any prohibited words
 * @param {string} message - The message to check
 * @param {string} language - Language code (en, hr, de, hu)
 * @returns {object} - {isProhibited: boolean, matchedWord: string|null}
 */
function checkMessage(message, language = 'en') {
  if (!message || typeof message !== 'string') {
    return { isProhibited: false, matchedWord: null };
  }
  
  const lowerMessage = message.toLowerCase();
  const words = wordLists[language] || wordLists.en;
  
  // Check each banned word/phrase
  for (const bannedWord of words) {
    const lowerBannedWord = bannedWord.toLowerCase();
    
    // Check for exact match (case-insensitive)
    if (lowerMessage.includes(lowerBannedWord)) {
      // Additional check for word boundaries to avoid false positives
      // For single words, check word boundaries
      if (!lowerBannedWord.includes(' ')) {
        const regex = new RegExp(`\\b${escapeRegex(lowerBannedWord)}\\b`, 'i');
        if (regex.test(lowerMessage)) {
          return { isProhibited: true, matchedWord: bannedWord };
        }
      } else {
        // For phrases, just check inclusion
        return { isProhibited: true, matchedWord: bannedWord };
      }
    }
  }
  
  return { isProhibited: false, matchedWord: null };
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all languages supported
 * @returns {array} - Array of language codes
 */
function getSupportedLanguages() {
  return Object.keys(wordLists);
}

/**
 * Get word list for a specific language
 * @param {string} language - Language code
 * @returns {array} - Array of banned words
 */
function getWordList(language) {
  return wordLists[language] || wordLists.en;
}

module.exports = {
  checkMessage,
  getSupportedLanguages,
  getWordList
};