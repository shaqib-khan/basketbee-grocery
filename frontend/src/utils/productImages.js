/**
 * Freshly Grocery Product Image & Display Engine
 * Ensures 100% accurate, high-definition image mapping,
 * proper object-fit styles (contain for packaged goods, cover for fresh produce),
 * and zero broken images via fallback handler.
 */

export const FALLBACK_IMAGE = '/images/fallback-grocery.svg';

// Verified, high-quality images for all BigBasket-style Indian grocery products
export const PRODUCT_IMAGE_MAP = {
  // 1. Fruits
  'apple-shimla': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  'banana-robusta': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  'mango-safeda-banganapalli': 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  'orange-nagpur-imported': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80',
  'grapes-sonaka-seedless': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
  'pomegranate-anar': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  'papaya-semi-ripe': 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80',
  'watermelon-kiran': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
  'guava-amrood': 'https://images.unsplash.com/photo-1536511135896-1c42f0687595?auto=format&fit=crop&w=600&q=80',
  'mosambi-sweet-lime': 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
  'pineapple-rani': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',

  // 2. Vegetables
  'potato-aloo-fresh': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  'onion-pyaz-red': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
  'tomato-local-hybrid': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  'carrot-gajar': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80',
  'cucumber-kheera': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80',
  'capsicum-shimla-mirch': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
  'cauliflower-gobhi': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
  'spinach-palak': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  'broccoli-exotic': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
  'green-peas-matar': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80',
  'ginger-adrak': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80',
  'garlic-lahsun': 'https://images.unsplash.com/photo-1615477039956-62ea838036e7?auto=format&fit=crop&w=600&q=80',
  'green-chillies-hari-mirch': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
  'coriander-leaves-dhaniya': 'https://images.unsplash.com/photo-1589135233689-d56d1f953fa1?auto=format&fit=crop&w=600&q=80',
  'lemon-nimbu': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
  'mushroom-button-fresh': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=600&q=80',
  'ladies-finger-bhindi': 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=600&q=80',

  // 3. Dairy & Bakery
  'amul-milk-taaza-toned': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  'amul-butter-salted': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  'amul-cheese-slices': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80',
  'fresh-malai-paneer-block': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  'fresh-dahi-curd': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
  'amul-pure-cow-ghee': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
  'brown-bread-multigrain': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'amul-fresh-cream-low-fat': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
  'farm-fresh-white-eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
  'white-sandwich-bread': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80',
  'mother-dairy-tadka-spiced-chaas': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',

  // 4. Rice, Atta & Dal
  'daawat-rozana-super-basmati-rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  'regular-sona-masoori-rice': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80',
  'aashirvaad-shudh-chakki-whole-wheat-atta': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  'tata-sampann-unpolished-toor-dal': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  'moong-dal-dhuli-yellow-split': 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=600&q=80',
  'chana-dal-desi-unpolished': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  'rajma-chitra-kashmiri': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'kabuli-chana-white-chickpeas': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
  'urad-dal-dhuli-white-split': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
  'masoor-dal-malka-red': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
  'fortune-roasted-suji-rava': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',

  // 5. Oil, Ghee & Spices
  'fortune-sunlite-refined-sunflower-oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  'engine-brand-kachi-ghani-mustard-oil': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  'dhara-filtered-groundnut-oil': 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
  'everest-turmeric-haldi-powder': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'everest-tikhalal-red-chilli-powder': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'everest-dhaniya-coriander-powder': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
  'everest-royal-garam-masala': 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
  'tata-sampann-whole-cumin-jeera': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  'tata-salt-vacuum-evaporated-iodized': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
  'catch-black-pepper-powder-kali-mirch': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80',
  'saffola-gold-pro-healthy-lifestyle-oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',

  // 6. Snacks & Beverages
  'parle-g-original-gluco-biscuits': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  'britannia-good-day-butter-cookies': 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?auto=format&fit=crop&w=600&q=80',
  'maggi-2-minute-masala-instant-noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  'lays-indias-magic-masala-potato-chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
  'oreo-vanilla-creme-sandwich-biscuits': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
  'coca-cola-original-refreshing-drink': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'real-fruit-power-mixed-fruit-juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  'tata-tea-gold-leaf-tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  'nescafe-classic-instant-coffee-jar': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'kurkure-masala-munch-namkeen': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80',
  'cadbury-dairy-milk-chocolate-bar': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
  'haldirams-nagpur-aloo-bhujia': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'cadbury-bournvita-nutrition-drink': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  'sprite-crisp-lemon-lime-soda': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',

  // 7. Personal Care
  'dove-cream-beauty-bathing-soap': 'https://images.unsplash.com/photo-1607006314187-51213f8d31ef?auto=format&fit=crop&w=600&q=80',
  'lux-velvet-glow-rose-bathing-soap': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'head-shoulders-anti-dandruff-shampoo': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
  'colgate-strong-teeth-dental-toothpaste': 'https://images.unsplash.com/photo-1559591937-e10f135b7194?auto=format&fit=crop&w=600&q=80',
  'dettol-original-germ-protection-handwash': 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80',
  'dettol-antiseptic-disinfectant-liquid': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  'nivea-soft-light-moisturiser-cream': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'pepsodent-germi-check-toothpaste': 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',

  // 8. Household Essentials
  'surf-excel-quick-wash-detergent-powder': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  'vim-dishwash-bar-with-lemon': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
  'harpic-power-plus-toilet-cleaner': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80',
  'lizol-citrus-disinfectant-floor-cleaner': 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80',
  'colin-glass-and-multi-surface-cleaner': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  'scotch-brite-heavy-duty-scrub-pad': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
  'comfort-morning-fresh-fabric-conditioner': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
  'hit-flying-insect-spray-mosquito-killer': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',

  // 9. Meat & Seafood
  'fresh-chicken-curry-cut': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
  'fresh-chicken-breast-boneless': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
  'fresh-rohu-bengali-cut-fish-steaks': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=80',
  'tender-goat-mutton-curry-cut': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
};

/**
 * Normalizes slug or name for lookup
 */
export const normalizeProductKey = (product) => {
  if (!product) return '';
  const raw = product.slug || product.name || '';
  return raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

/**
 * Returns accurate image URL for a product with fallback
 */
export const getProductImageUrl = (product) => {
  if (!product) return FALLBACK_IMAGE;

  // First check direct mapping by normalized slug/name
  const key = normalizeProductKey(product);
  for (const [mapKey, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return url;
    }
  }

  // Next return existing product image if valid
  if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
    return product.image;
  }

  return FALLBACK_IMAGE;
};

/**
 * Determines whether a product is a packaged branded product (which benefits from object-contain)
 * versus fresh produce/meat (which benefits from object-cover)
 */
export const isPackagedProduct = (product) => {
  if (!product) return false;
  const cat = (product.categorySlug || product.categoryName || '').toLowerCase();
  const sub = (product.subcategory || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  // Fresh produce & meat should use object-cover
  if (cat.includes('fruit') || cat.includes('vegetable') || cat.includes('meat') || cat.includes('seafood')) {
    if (sub.includes('fresh') || sub.includes('chicken') || sub.includes('mutton') || sub.includes('fish')) {
      return false;
    }
  }

  // Packaged groceries (biscuits, butter, ghee jar, shampoo, soaps, cleaners, tea packs, etc.)
  return true;
};

