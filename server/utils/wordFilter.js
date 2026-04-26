/**
 * Word Filter System for Chat Messages
 * Blocks messages containing dog sale/trade/exchange related phrases
 * Supports English, Croatian, German, and Hungarian
 * 
 * IMPORTANT: Only include specific multi-word phrases that clearly indicate
 * dog selling/trading. Single common words (offer, deal, cost, how many, etc.)
 * cause too many false positives in normal conversation.
 */

const wordLists = {
  // English banned phrases - ONLY specific sale/trade/exchange phrases
  en: [
    // Currency symbols and payment methods (clear commercial intent)
    'paypal', 'venmo', 'bank transfer',
    
    // Specific dog sale phrases
    'for sale', 'for sale!',
    'selling dog', 'selling dogs', 'sell my dog', 'sell my dogs',
    'buy dog', 'buy dogs', 'buy a dog',
    'purchase dog', 'purchase dogs', 'buying dog', 'buying dogs',
    'trade dog', 'trade dogs', 'trade a dog',
    'swap dog', 'swap dogs', 'swap a dog',
    'exchange dog', 'exchange dogs', 'exchange a dog',
    'price of dog', 'price of dogs', 'price for dog', 'price for dogs',
    'cost of dog', 'cost of dogs', 'cost for dog', 'cost for dogs',
    'dog for sale', 'dogs for sale', 'dog on sale', 'dogs on sale',
    'puppy for sale', 'puppies for sale', 'pup for sale', 'pups for sale',
    'sell for', 'sold for', 'buy for', 'bought for',
    'looking to buy dog', 'looking to sell dog', 'looking to trade dog',
    'want to buy dog', 'want to sell dog', 'want to trade dog',
    'interested in buying dog', 'interested in selling dog', 'interested in trading dog',
    'pay for dog', 'pay for dogs', 'payment for dog',
    'dog price', 'dog prices', 'dog cost', 'dog costs',
    'how much money',
    'selling this dog', 'selling these dogs',
    'buy this dog', 'buy these dogs',
    'trade this dog', 'trade these dogs',
    'exchange this dog', 'exchange these dogs',
    'selling my dog', 'selling my dogs',
    'buy my dog', 'buy my dogs',
    'trade my dog', 'trade my dogs',
    'exchange my dog', 'exchange my dogs',
    'dog business', 'dog commerce',
    'make an offer for dog', 'make offer for dog', 'send offer for dog',
    'accept offer for dog', 'accepting offers for dog',
    'free to good home', 'free dog', 'free dogs',
    'rehoming fee', 'rehome fee', 'rehome for',
    'adoption fee', 'adoption fees',
    'dog for trade', 'dogs for trade',
    'dog for exchange', 'dogs for exchange',
    'sell puppy', 'sell puppies', 'selling puppy', 'selling puppies',
    'buy puppy', 'buy puppies', 'buying puppy', 'buying puppies',
    'price for puppy', 'price for puppies',
    'puppy price', 'puppy prices', 'puppy cost',
    'how much for dog', 'how much for the dog', 'how much for this dog',
    'how much for puppy', 'how much for the puppy',
    'willing to sell', 'willing to buy', 'willing to trade',
    'let me buy', 'let me sell', 'let me trade',
    'i want to sell', 'i want to buy', 'i want to trade',
    'i am selling', 'i am buying', 'i am trading',
    'sell it for', 'sell him for', 'sell her for',
    'buy it for', 'buy him for', 'buy her for',
    'how much are you selling', 'how much are you asking',
    'what is your price', 'what is the price',
    ' negotiable price', 'price is negotiable',
    'cash for dog', 'cash for dogs', 'cash for puppy',
    'pay cash for', 'pay with cash',
    'dog for cash', 'dogs for cash', 'puppy for cash',
  ],
  
  // Croatian banned phrases - ONLY specific sale/trade/exchange phrases
  hr: [
    // Currency and payment methods
    'paypal',
    
    // Specific dog sale phrases
    'na prodaju', 'na prodaju!', 'u prodaji',
    'prodajem psa', 'prodajem pse', 'prodajem svog psa',
    'prodaja psa', 'prodaja pasa', 'prodaja mojih pasa',
    'koliko košta pas', 'koliko koštaju psi', 'koliko košta pas?',
    'koliko koštaju psi?',
    'kupiti psa', 'kupim psa', 'kupujem psa', 'kupujem pse',
    'trgovina psa', 'razmjena psa', 'zamjena psa', 'mijenjam psa', 'mijenjam pse',
    'cijena psa', 'cijena pasa', 'cijena za psa',
    'pas na prodaju', 'psi na prodaju', 'pas u prodaji',
    'štene na prodaju', 'štenad na prodaju', 'štene u prodaji',
    'prodajem za', 'prodato za', 'prodao za',
    'želim kupiti psa', 'želim prodati psa', 'želim razmijeniti psa',
    'hoću kupiti psa', 'hoću prodati psa',
    'interesiran za kupnju psa', 'interesiran za prodaju psa',
    'platiti za psa', 'platio za psa', 'plaćanje za psa',
    'košta psa', 'košta pas',
    'prodavam ovog psa', 'prodavam ove pse',
    'kupiti ovog psa', 'kupiti ove pse',
    'razmijeniti ovog psa', 'razmijeniti ove pse',
    'prodavam svog psa', 'prodavam moje pse',
    'kupiti svog psa', 'kupiti moje pse',
    'razmijeniti svog psa', 'razmijeniti moje pse',
    'psa poslovanje', 'pas trgovina',
    'napraviti ponudu za psa', 'prihvaćam ponude za psa',
    'sniziti cijenu za psa',
    'besplatan pas', 'besplatno psa',
    'naknada za udomljavanje', 'naknada za preuzimanje',
    'naknada za usvajanje', 'naknada usvajanja',
    'pas za prodaju', 'psi za prodaju',
    'pas za zamjenu', 'psi za zamjenu',
    'štene za prodaju', 'štenad za prodaju',
    'koliko novaca za psa', 'koliko novaca za štene',
    'prodajem štene', 'prodajem štenad',
    'kupujem štene', 'kupujem štenad',
    'cijena šteneta', 'cijena štenadi',
    'koliko košta štene', 'koliko koštaju štenad',
    'prodajem ti psa', 'prodajem vam psa',
    'kupujem od tebe psa', 'kupujem od vas psa',
    'meni novac za psa', 'meni novac za štene',
    'novac za psa', 'novac za štene',
    'gotovina za psa', 'gotovina za štene',
  ],
  
  // German banned phrases - ONLY specific sale/trade/exchange phrases
  de: [
    // Payment methods
    'paypal',
    
    // Specific dog sale phrases
    'zu verkaufen', 'zu verkaufen!', 'zum verkauf',
    'hund verkaufen', 'hunde verkaufen',
    'wie viel kostet der hund', 'wie viel kosten hunde',
    'wie viel kostet ein hund',
    'hund kaufen', 'hunde kaufen', 'einen hund kaufen',
    'hund einkaufen', 'hunde einkaufen',
    'hund tauschen', 'hunde tauschen',
    'hund austauschen', 'hunde austauschen',
    'preis für hund', 'preis für hunde', 'hund preis', 'hunde preise',
    'kosten für hund', 'kosten für hunde',
    'hund zu verkaufen', 'hunde zu verkaufen', 'zum verkauf stehende hunde',
    'welpe zu verkaufen', 'welpen zu verkaufen', 'welpe kaufen', 'welpen kaufen',
    'verkaufe für', 'verkauft für', 'kaufe für', 'gekauft für',
    'möchte hund kaufen', 'möchte hund verkaufen', 'möchte hund tauschen',
    'möchte hunde kaufen', 'möchte hunde verkaufen',
    'will hund kaufen', 'will hund verkaufen', 'will hund tauschen',
    'interesse an hund kauf', 'interesse an hund verkauf', 'interesse an hund tausch',
    'bezahle für hund', 'bezahlt für hund', 'zahlung für hund',
    'hund preis', 'hund preise', 'hund kosten', 'hund kostet',
    'wie viel geld für hund',
    'diesen hund verkaufen', 'diese hunde verkaufen',
    'diesen hund kaufen', 'diese hunde kaufen',
    'diesen hund tauschen', 'diese hunde tauschen',
    'diesen hund austauschen', 'diese hunde austauschen',
    'meinen hund verkaufen', 'meine hunde verkaufen',
    'meinen hund kaufen', 'meine hunde kaufen',
    'meinen hund tauschen', 'meine hunde tauschen',
    'hund geschäft', 'hunde handel',
    'angebot für hund', 'angebote für hunde',
    'rabatt für hund',
    'kostenloser hund', 'kostenlose hund', 'umsonst hund', 'gratis hund',
    'umgangsgebühr für hund', 'abgabepreis für hund', 'abgabepreise für hunde',
    'vermittlungsgebühr für hund',
    'hund für bargeld', 'hunde für bargeld',
    'welpe preis', 'welpen preise', 'welpe kosten',
    'wie viel kostet ein welpe', 'wie viel kosten welpen',
    'ich verkaufe hund', 'ich verkaufe hunde',
    'ich kaufe hund', 'ich kaufe hunde',
    'barzahlung für hund',
  ],
  
  // Hungarian banned phrases - ONLY specific sale/trade/exchange phrases
  hu: [
    // Payment methods
    'paypal',
    
    // Specific dog sale phrases
    'eladásra', 'eladásra!', 'eladóban',
    'eladom a kutyát', 'eladom a kutyákat', 'eladom a kutyámat',
    'kutyák eladása', 'kutya eladása', 'kutyámat eladom',
    'mennyibe kerül a kutya', 'mennyibe kerülnek a kutyák',
    'kutyát venni', 'kutyát veszek', 'kutyát vásárolni',
    'kutyát cserélni', 'kutyákat cserélni', 'kutyát cserél',
    'kutya ára', 'kutyák ára', 'kutya árak', 'kutyák árai',
    'kutya költsége', 'kutyák költsége',
    'eladásra kutya', 'eladásra kutyák', 'eladásban lévő kutya',
    'kölyök eladásra', 'kölykök eladásra', 'kölyök eladása',
    'eladom forintért', 'eladtam forintért',
    'szeretnék venni kutyát', 'szeretnék eladni kutyát', 'szeretnék cserélni kutyát',
    'akarok venni kutyát', 'akarok eladni kutyát', 'akarok cserélni kutyát',
    'érdekel a kutya vásárlás', 'érdekel a kutya eladás', 'érdekel a kutya csere',
    'fizetek a kutyáért', 'fizettem a kutyáért', 'fizetés a kutyáért',
    'kutyáért fizet',
    'mennyi pénz a kutyáért',
    'ezt a kutyát eladom', 'ezeket a kutyákat eladom',
    'ezt a kutyát veszem', 'ezeket a kutyákat veszem',
    'ezt a kutyát cserélem', 'ezeket a kutyákat cserélem',
    'a kutyámat eladom', 'a kutyáimat eladom',
    'a kutyámat veszem', 'a kutyáimat veszem',
    'a kutyámat cserélem', 'a kutyáimat cserélem',
    'kutya üzlet', 'kutya kereskedelem',
    'ajánlatot teszek a kutyáért', 'ajánlatot a kutyáért',
    'ajánlatot fogadok a kutyáért',
    'ingyenes kutya', 'ingyen elvihető kutya', 'ingyen kutya',
    'átvételi díj kutyáért', 'hozájárulási díj kutyáért',
    'adoptálási díj kutyáért', 'adoptálási díjak kutyáért',
    'kutya eladó', 'kutyák eladók',
    'kutyát cserélnék', 'kutyát eladnák', 'kutyát vennék',
    'kölyök eladó', 'kölyök ár', 'kölyök eladása',
    'mennyibe kerül a kölyök',
    'készpénz a kutyáért', 'készpénz a kutyáért',
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
  
  // Check all language lists for comprehensive filtering
  // This prevents users from bypassing by using a different language
  const allWords = [];
  for (const lang of Object.keys(wordLists)) {
    allWords.push(...wordLists[lang]);
  }
  
  // Also add the specific language list first for priority matching
  const primaryWords = wordLists[language] || wordLists.en;
  const wordsToCheck = [...new Set([...primaryWords, ...allWords])];
  
  // Check each banned phrase
  for (const bannedPhrase of wordsToCheck) {
    const lowerBannedPhrase = bannedPhrase.toLowerCase();
    
    // All entries are now phrases - check for inclusion
    if (lowerMessage.includes(lowerBannedPhrase)) {
      return { isProhibited: true, matchedWord: bannedPhrase };
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