/**
 * Word Filter System for Chat Messages
 * Blocks messages containing dog sale/trade/exchange related words
 * Supports English, Croatian, German, and Hungarian
 */

const wordLists = {
  // English banned words - Comprehensive sale/trade/exchange phrases
  en: [
    'sale', 'sell', 'selling', 'sold', 'seller',
    'buy', 'buying', 'bought', 'buyer',
    'purchase', 'purchasing', 'purchased',
    'trade', 'trading', 'trader',
    'exchange', 'exchanging',
    'swap', 'swapping',
    'money', 'cash', 'currency',
    'price', 'pricing', 'priced', 'prices',
    'cost', 'costs', 'costing',
    'payment', 'pay', 'paying', 'paid',
    'paypal', 'venmo', 'bank transfer',
    'offer', 'offers', 'offering',
    'deal', 'deals', 'dealing',
    'transaction', 'transactions',
    'commerce', 'commercial',
    'market', 'marketing',
    'auction', 'auctioning',
    'rent', 'renting', 'rental',
    'for sale', 'for sale!',
    'selling dog', 'selling dogs', 'sell my dog', 'sell my dogs',
    'how much', 'how much?', 'how much is', 'how much are',
    'buy dog', 'buy dogs', 'buy a dog', 'buy the dog',
    'purchase dog', 'purchase dogs', 'buying dog', 'buying dogs',
    'trade dog', 'trade dogs', 'trade a dog', 'trade the dog',
    'swap dog', 'swap dogs', 'swap a dog', 'swap the dog',
    'exchange dog', 'exchange dogs', 'exchange a dog', 'exchange the dog',
    'price of dog', 'price of dogs', 'price for dog', 'price for dogs',
    'cost of dog', 'cost of dogs', 'cost for dog', 'cost for dogs',
    'dog for sale', 'dogs for sale', 'dog on sale', 'dogs on sale',
    'puppy for sale', 'puppies for sale', 'pup for sale', 'pups for sale',
    'sell for', 'sold for', 'buy for', 'bought for',
    'looking to buy', 'looking to sell', 'looking to trade',
    'want to buy', 'want to sell', 'want to trade',
    'interested in buying', 'interested in selling', 'interested in trading',
    'pay for dog', 'pay for dogs', 'payment for dog',
    'dog price', 'dog prices', 'dog cost', 'dog costs',
    'how many', 'how many?', 'how much money',
    'selling this dog', 'selling these dogs',
    'buy this dog', 'buy these dogs',
    'trade this dog', 'trade these dogs',
    'exchange this dog', 'exchange these dogs',
    'selling my dog', 'selling my dogs', 'sell my dog', 'sell my dogs',
    'buy my dog', 'buy my dogs',
    'trade my dog', 'trade my dogs',
    'exchange my dog', 'exchange my dogs',
    'dog business', 'dog commerce',
    'make an offer', 'make offer', 'send offer',
    'accept offer', 'accepting offers',
    'negotiate', 'negotiating',
    'bargain', 'bargaining',
    'discount', 'discounts',
    'free to good home', 'free dog', 'free dogs',
    'rehoming fee', 'rehome fee', 'rehome for',
    'adoption fee', 'adoption fees'
  ],
  
  // Croatian banned words - Comprehensive sale/trade/exchange phrases
  hr: [
    'prodaja', 'prodajem', 'prodajna', 'prodavati', 'prodano',
    'kupim', 'kupiti', 'kupnja', 'kupovati', 'kupljen',
    'trgovina', 'trgovim', 'trgovati', 'trgovac',
    'razmjena', 'razmijeniti', 'razmjena',
    'zamjena', 'zamjeniti', 'zamjena',
    'novac', 'novca', 'novce', 'valuta',
    'cijena', 'cijenu', 'cijene', 'cijenom',
    'plaćanje', 'platiti', 'plaćam', 'plaćeno',
    'gotovina', 'gotovinski',
    'ponuda', 'ponudu', 'ponude', 'ponuđen',
    'tražim', 'tražiti',
    'posao', 'poslovi', 'poslovanje',
    'transakcija', 'transakcije',
    'tržište', 'tržišna',
    'aukcija', 'aukcijska',
    'najam', 'najmiti', 'najmovati',
    'na prodaju', 'na prodaju!', 'u prodaji',
    'prodajem psa', 'prodajem pse', 'prodajem svog psa',
    'prodaja psa', 'prodaja pasa', 'prodaja mojih pasa',
    'koliko', 'koliko?', 'koliko košta', 'koliko koštaju',
    'kupiti psa', 'kupim psa', 'kupiti psa',
    'trgovina psa', 'razmjena psa', 'zamjena psa',
    'cijena psa', 'cijena pasa', 'cijena za psa',
    'pas na prodaju', 'psi na prodaju', 'pas u prodaji',
    'štene na prodaju', 'štenad na prodaju', 'štene u prodaji',
    'prodajem za', 'prodato za', 'prodao za',
    'želim kupiti', 'želim prodati', 'želim razmijeniti',
    'hoću kupiti', 'hoću prodati', 'hoću razmijeniti',
    'interesiran za kupnju', 'interesiran za prodaju',
    'platiti za psa', 'platio za psa', 'plaćanje za psa',
    'cijena psa', 'cijena pasa', 'psa cijena',
    'košta psa', 'košta pas', 'koliko novca',
    'prodavam ovog psa', 'prodavam ove pse',
    'kupiti ovog psa', 'kupiti ove pse',
    'razmijeniti ovog psa', 'razmijeniti ove pse',
    'prodavam svog psa', 'prodavam moje pse',
    'kupiti svog psa', 'kupiti moje pse',
    'razmijeniti svog psa', 'razmijeniti moje pse',
    'psa poslovanje', 'pas trgovina',
    'napraviti ponudu', 'napraviti ponudu',
    'prihvaćam ponudu', 'prihvaćam ponude',
    'pregovarati', 'pregovaranje',
    'sniziti cijenu', 'popust',
    'besplatno', 'besplatan pas',
    'naknada za udomljavanje', 'naknada za preuzimanje',
    'naknada za usvajanje', 'naknada usvajanja',
    'paypal'
  ],
  
  // German banned words - Comprehensive sale/trade/exchange phrases
  de: [
    'verkauf', 'verkaufe', 'verkaufen', 'verkauf', 'verkäufer', 'tausche', 'tauschpartner',
    'kaufen', 'kauf', 'kaufe', 'gekauft', 'käufer',
    'einkaufen', 'einkauf',
    'handel', 'handeln', 'händler', 'handeln',
    'tausch', 'tauschen',
    'wechsel', 'wechseln', 'austauschen',
    'geld', 'geldes', 'gelder', 'währung',
    'preis', 'preise', 'preisen',
    'kosten', 'kostet', 'kosten',
    'bezahlung', 'bezahlen', 'bezahle', 'bezahlt', 'zahlung',
    'bargeld', 'barzahlung',
    'angebot', 'angebote', 'anbieten', 'angeboten',
    'geschäft', 'geschäfte', 'geschäftlich',
    'transaktion', 'transaktionen',
    'markt', 'marktplatz', 'marktführer',
    'auktion', 'auktions', 'auktionieren',
    'miete', 'mieten', 'vermieten', 'mietvertrag',
    'kostenlos', 'kostenloser', 'umsonst', 'gratis hund',
    'zu verkaufen', 'zu verkaufen!', 'zum verkauf',
    'hund verkaufen', 'hunde verkaufen', 'hunde verkaufen',
    'wie viel', 'wie viel?', 'wie viel kostet', 'wie viel kosten',
    'hund kaufen', 'hunde kaufen', 'einen hund kaufen', 'hunde kaufen',
    'hund einkaufen', 'hunde einkaufen',
    'hund tauschen', 'hunde tauschen', 'hund tauschen',
    'hund austauschen', 'hunde austauschen',
    'preis für hund', 'preis für hunde', 'hund preis', 'hunde preise',
    'kosten für hund', 'kosten für hunde',
    'hund zu verkaufen', 'hunde zu verkaufen', 'zum verkauf stehende hunde',
    'welpe zu verkaufen', 'welpen zu verkaufen', 'welpe kaufen', 'welpen kaufen',
    'verkaufe für', 'verkauft für', 'kaufe für', 'gekauft für',
    'möchte kaufen', 'möchte verkaufen', 'möchte tauschen',
    'will kaufen', 'will verkaufen', 'will tauschen',
    'interesse an kauf', 'interesse an verkauf', 'interesse an tausch',
    'bezahle für hund', 'bezahlt für hund', 'zahlung für hund',
    'hund preis', 'hund preise', 'hund kosten', 'hund kostet',
    'wie viele', 'wie viele?', 'wie viel geld',
    'diesen hund verkaufen', 'diese hunde verkaufen',
    'diesen hund kaufen', 'diese hunde kaufen',
    'diesen hund tauschen', 'diese hunde tauschen',
    'diesen hund austauschen', 'diese hunde austauschen',
    'meinen hund verkaufen', 'meine hunde verkaufen',
    'meinen hund kaufen', 'meine hunde kaufen',
    'meinen hund tauschen', 'meine hunde tauschen',
    'hund geschäft', 'hunde handel',
    'angebot machen', 'angebot machen',
    'angebot annehmen', 'angebote annehmen',
    'verhandeln', 'verhandlung',
    'feilschen', 'feilschen',
    'rabatt', 'rabatte', 'nachlass',
    'umgangsgebühr', 'abgabepreis', 'abgabepreise',
    'vermittlungsgebühr', 'vermittlungsgebühren',
    'paypal'
  ],
  
  // Hungarian banned words - Comprehensive sale/trade/exchange phrases
  hu: [
    'eladás', 'eladom', 'eladása', 'eladni', 'eladtam', 'eladó',
    'veszek', 'venni', 'vétel', 'vásárol', 'vásárolni', 'megvettem', 'vásárló',
    'kereskedelem', 'kereskedem', 'kereskedni', 'kereskedő', 'keresek',
    'csere', 'cserélni', 'cserélem', 'csere', 'cserél',
    'pénz', 'pénze', 'pénzek', 'valuta',
    'ár', 'ára', 'árai', 'árban', 'mi az ára', 'cserét',
    'fizetés', 'fizetni', 'fizetek', 'fizettem', 'kifizetés',
    'készpénz', 'készpénzes',
    'ajánlat', 'ajánlatot', 'ajánlatok', 'ajánl',
    'üzlet', 'üzletek', 'üzleti',
    'tranzakció', 'tranzakciók',
    'piac', 'piaci', 'piacter',
    'aukció', 'aukciós', 'aukción',
    'bérlet', 'bérelni', 'bérlés',
    'eladásra', 'eladásra!', 'eladóban',
    'eladom a kutyát', 'eladom a kutyákat', 'eladom a kutyámat',
    'kutyák eladása', 'kutya eladása', 'kutyámat eladom',
    'mennyit', 'mennyit?', 'mennyibe kerül', 'mennyibe kerülnek',
    'kutyát venni', 'kutyát veszek', 'kutyát vásárolni',
    'kutyát cserélni', 'kutyákat cserélni', 'kutyát cserél',
    'kutya ára', 'kutyák ára', 'kutya árak', 'kutyák árai',
    'kutya költsége', 'kutyák költsége',
    'eladásra kutya', 'eladásra kutyák', 'eladásban lévő kutya',
    'kölyök eladásra', 'kölykök eladásra', 'kölyök eladása',
    'eladom forintért', 'eladtam forintért', 'eladóért forint',
    'szeretnék venni', 'szeretnék eladni', 'szeretnék cserélni',
    'akarok venni', 'akarok eladni', 'akarok cserélni',
    'érdekel a vásárlás', 'érdekel az eladás', 'érdekel a csere',
    'fizetek a kutyáért', 'fizettem a kutyáért', 'fizetés a kutyáért',
    'kutya ára', 'kutyák ára', 'kutyáért fizet',
    'kutya mennyi', 'kutyák mennyi', 'mennyi pénz',
    ' ezt a kutyát eladom', 'ezeket a kutyákat eladom',
    ' ezt a kutyát veszem', 'ezeket a kutyákat veszem',
    ' ezt a kutyát cserélem', 'ezeket a kutyákat cserélem',
    'a kutyámat eladom', 'a kutyáimat eladom',
    'a kutyámat veszem', 'a kutyáimat veszem',
    'a kutyámat cserélem', 'a kutyáimat cserélem',
    'kutya üzlet', 'kutya kereskedelem',
    'ajánlatot teszek', 'ajánlatot tenni',
    'ajánlatot fogadok', 'ajánlatot fogadni',
    'alkudni', 'alkudás',
    'kedvezmény', 'kedvezmények', 'árengedmény',
    'ingyen', 'ingyenes kutya', ' ingyen elvihető',
    'átvételi díj', 'hozájárulási díj',
    'adoptálási díj', 'adoptálási díjak',
    'paypal'
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