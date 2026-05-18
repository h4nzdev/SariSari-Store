// ─── localStorage keys ────────────────────────────────────────────────────────

const K = {
  settings: 'sari_settings',
  categories: 'sari_categories',
  products: 'sari_products',
  sales: 'sari_sales',
  saleItems: 'sari_sale_items',
  seq: 'sari_seq',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function nextId(table) {
  const seq = read(K.seq) || {};
  seq[table] = (seq[table] || 0) + 1;
  write(K.seq, seq);
  return seq[table];
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function toDate(datetimeStr) {
  return new Date(datetimeStr.includes('T') ? datetimeStr : datetimeStr.replace(' ', 'T'));
}

function localDateStr(datetimeStr) {
  return toDate(datetimeStr).toLocaleDateString('en-CA');
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}

// Throw in the shape pages expect from Axios: err.response?.data?.error
function apiError(msg) {
  return { response: { data: { error: msg } } };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PRODUCTS = {
  Beverages: [
    ['Coke Regular 237ml', 15, 50, 'bottle'],
    ['Sprite 237ml', 15, 50, 'bottle'],
    ['Royal Tru-Orange 237ml', 15, 40, 'bottle'],
    ['Nestea Lemon 500ml', 20, 30, 'bottle'],
    ['C2 Apple 230ml', 15, 40, 'bottle'],
    ['Gatorade Lemon Lime 500ml', 35, 24, 'bottle'],
    ['Milo Activ-Go Sachet', 8, 100, 'sachet'],
    ['Nescafe 3in1 Original Sachet', 7, 120, 'sachet'],
    ['Bear Brand Fortified Sachet', 9, 100, 'sachet'],
  ],
  'Instant Noodles': [
    ['Lucky Me Chicken Noodle Soup', 14, 60, 'pack'],
    ['Lucky Me Beef Noodle Soup', 14, 60, 'pack'],
    ['Lucky Me Pancit Canton Original', 14, 60, 'pack'],
    ['Nissin Cup Noodles Seafood', 22, 30, 'cup'],
    ['Payless Shrimp Noodles', 10, 48, 'pack'],
    ['Quickchow Chicken', 10, 48, 'pack'],
  ],
  Snacks: [
    ['Chippy BBQ 110g', 20, 30, 'pack'],
    ['Oishi Prawn Crackers 90g', 20, 30, 'pack'],
    ['Nova Country Cheddar 78g', 22, 24, 'pack'],
    ['Skyflakes Crackers', 10, 50, 'pack'],
    ['Rebisco Crackers', 10, 50, 'pack'],
    ['Fita Crackers', 10, 50, 'pack'],
    ['Kopiko Brown Coffee Candy', 3, 200, 'piece'],
    ['White Rabbit Candy', 2, 200, 'piece'],
    ['Ricoa Flat Tops Chocolate', 5, 100, 'piece'],
  ],
  'Personal Care': [
    ['Safeguard White Bar Soap 60g', 25, 40, 'bar'],
    ['Palmolive Shampoo Sachet', 7, 100, 'sachet'],
    ['Rejoice Shampoo Sachet', 7, 100, 'sachet'],
    ['Colgate Toothpaste 40g', 35, 30, 'tube'],
    ['Head & Shoulders Sachet', 9, 100, 'sachet'],
    ['Whisper Overnight Pad', 12, 50, 'piece'],
  ],
  Condiments: [
    ['Datu Puti Vinegar 350ml', 22, 24, 'bottle'],
    ['Silver Swan Soy Sauce 350ml', 22, 24, 'bottle'],
    ['UFC Banana Catsup Sachet', 5, 100, 'sachet'],
    ['Knorr Liquid Seasoning Sachet', 5, 100, 'sachet'],
    ['Maggi Magic Sarap 8g Sachet', 5, 150, 'sachet'],
  ],
  'Canned Goods': [
    ['Argentina Corned Beef 260g', 65, 24, 'can'],
    ['CDO Liver Spread 85g', 25, 36, 'can'],
    ['Ligo Sardines in Tomato Sauce 155g', 28, 36, 'can'],
    ['Century Tuna in Oil 180g', 35, 30, 'can'],
    ['Mega Sardines in Tomato Sauce 155g', 24, 36, 'can'],
  ],
  'Dairy & Eggs': [
    ['Eden Cheese 165g', 55, 20, 'pack'],
    ['Magnolia Quickmelt 165g', 55, 20, 'pack'],
    ['Egg', 8, 100, 'piece'],
    ['Anchor Full Cream Milk Sachet', 12, 60, 'sachet'],
  ],
  'Rice & Grains': [
    ['Rice', 52, 200, 'kilo'],
    ['Mongo Beans', 40, 50, 'pack'],
  ],
};

// [day_offset, hour, [[productName, qty], ...]]
const SALES_PLAN = [
  [-6, 7,  [['Nescafe 3in1 Original Sachet', 3], ['Bear Brand Fortified Sachet', 2], ['Egg', 6]]],
  [-6, 10, [['Lucky Me Chicken Noodle Soup', 4], ['Chippy BBQ 110g', 2]]],
  [-6, 17, [['Coke Regular 237ml', 5], ['Oishi Prawn Crackers 90g', 2], ['Kopiko Brown Coffee Candy', 5]]],
  [-5, 8,  [['Rice', 3], ['Egg', 12], ['Silver Swan Soy Sauce 350ml', 1]]],
  [-5, 11, [['Lucky Me Pancit Canton Original', 3], ['Nissin Cup Noodles Seafood', 2]]],
  [-5, 14, [['C2 Apple 230ml', 4], ['Skyflakes Crackers', 2], ['Rebisco Crackers', 2]]],
  [-5, 19, [['Safeguard White Bar Soap 60g', 2], ['Rejoice Shampoo Sachet', 3], ['Colgate Toothpaste 40g', 1]]],
  [-4, 7,  [['Milo Activ-Go Sachet', 5], ['Bear Brand Fortified Sachet', 3]]],
  [-4, 9,  [['Maggi Magic Sarap 8g Sachet', 4], ['UFC Banana Catsup Sachet', 3], ['Datu Puti Vinegar 350ml', 1]]],
  [-4, 12, [['Ligo Sardines in Tomato Sauce 155g', 3], ['Rice', 2]]],
  [-4, 18, [['Coke Regular 237ml', 6], ['Sprite 237ml', 4], ['Oishi Prawn Crackers 90g', 3]]],
  [-3, 8,  [['Nescafe 3in1 Original Sachet', 6], ['Egg', 10]]],
  [-3, 13, [['Argentina Corned Beef 260g', 2], ['Rice', 4]]],
  [-3, 15, [['Nova Country Cheddar 78g', 2], ['White Rabbit Candy', 10], ['Kopiko Brown Coffee Candy', 8]]],
  [-3, 20, [['Gatorade Lemon Lime 500ml', 3], ['Chippy BBQ 110g', 2]]],
  [-2, 7,  [['Bear Brand Fortified Sachet', 4], ['Milo Activ-Go Sachet', 3], ['Egg', 8]]],
  [-2, 10, [['Lucky Me Beef Noodle Soup', 3], ['Payless Shrimp Noodles', 4]]],
  [-2, 16, [['Palmolive Shampoo Sachet', 3], ['Head & Shoulders Sachet', 2]]],
  [-2, 19, [['Rice', 5], ['CDO Liver Spread 85g', 2], ['Datu Puti Vinegar 350ml', 1]]],
  [-1, 8,  [['Nescafe 3in1 Original Sachet', 8], ['Bear Brand Fortified Sachet', 5], ['Egg', 15]]],
  [-1, 11, [['Coke Regular 237ml', 4], ['C2 Apple 230ml', 3], ['Sprite 237ml', 2]]],
  [-1, 14, [['Argentina Corned Beef 260g', 3], ['Rice', 6]]],
  [-1, 18, [['Chippy BBQ 110g', 3], ['Nova Country Cheddar 78g', 2], ['Ricoa Flat Tops Chocolate', 5]]],
  [0,  7,  [['Nescafe 3in1 Original Sachet', 4], ['Egg', 6]]],
  [0,  9,  [['Lucky Me Chicken Noodle Soup', 5], ['Maggi Magic Sarap 8g Sachet', 3]]],
  [0,  12, [['Coke Regular 237ml', 8], ['Sprite 237ml', 3], ['Royal Tru-Orange 237ml', 2]]],
];

function seedDemoSales(products) {
  const sales = [];
  const saleItems = [];
  const productMap = Object.fromEntries(products.map((p) => [p.name, p]));

  for (const [dayOffset, hour, items] of SALES_PLAN) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    const dateStr = d.toISOString().replace('T', ' ').slice(0, 19);

    let total = 0;
    const processed = [];
    for (const [name, qty] of items) {
      const p = productMap[name];
      if (!p || p.quantity < qty) continue;
      const subtotal = p.price * qty;
      total += subtotal;
      processed.push({ p, qty, subtotal });
    }
    if (processed.length === 0) continue;

    const saleId = nextId('sales');
    sales.push({ id: saleId, total, note: null, created_at: dateStr });

    for (const { p, qty, subtotal } of processed) {
      saleItems.push({
        id: nextId('saleItems'),
        sale_id: saleId,
        product_id: p.id,
        product_name: p.name,
        price: p.price,
        quantity: qty,
        subtotal,
      });
      p.quantity -= qty;
    }
  }

  write(K.sales, sales);
  write(K.saleItems, saleItems);
}

// ─── Init (runs once on first ever load) ─────────────────────────────────────

export function initDB() {
  if (read(K.settings) !== null) return;

  write(K.settings, { store_name: 'Tindahan ni Aling Nena', owner_name: 'Aling Nena' });

  const categories = [];
  const products = [];
  const created = ts();

  for (const [categoryName, prods] of Object.entries(SEED_PRODUCTS)) {
    const catId = nextId('categories');
    categories.push({ id: catId, name: categoryName, created_at: created });
    for (const [name, price, quantity, unit] of prods) {
      products.push({
        id: nextId('products'),
        category_id: catId,
        name,
        price,
        quantity,
        unit,
        created_at: created,
        updated_at: created,
      });
    }
  }

  write(K.categories, categories);
  write(K.products, products);
  write(K.sales, []);
  write(K.saleItems, []);

  seedDemoSales(products);
  write(K.products, products); // persist quantity deductions from demo sales
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export function getSettings() {
  return Promise.resolve(read(K.settings));
}

export function updateSettings({ store_name, owner_name }) {
  if (!store_name?.trim()) return Promise.reject(apiError('Store name is required'));
  if (!owner_name?.trim()) return Promise.reject(apiError('Owner name is required'));
  const settings = { store_name: store_name.trim(), owner_name: owner_name.trim() };
  write(K.settings, settings);
  window.dispatchEvent(new CustomEvent('sari-settings-updated', { detail: settings }));
  return Promise.resolve(settings);
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export function getCategories() {
  const cats = read(K.categories) || [];
  return Promise.resolve([...cats].sort((a, b) => a.name.localeCompare(b.name)));
}

export function createCategory(name) {
  if (!name?.trim()) return Promise.reject(apiError('Category name is required'));
  const cats = read(K.categories) || [];
  if (cats.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return Promise.reject(apiError('Category already exists'));
  }
  const cat = { id: nextId('categories'), name: name.trim(), created_at: ts() };
  cats.push(cat);
  write(K.categories, cats);
  return Promise.resolve(cat);
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

function enrichProducts(products, categories) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return products.map((p) => ({ ...p, category_name: catMap[p.category_id] || null }));
}

export function getProducts() {
  const products = read(K.products) || [];
  const categories = read(K.categories) || [];
  const enriched = enrichProducts(products, categories);
  enriched.sort((a, b) => {
    const ca = a.category_name || '';
    const cb = b.category_name || '';
    return ca.localeCompare(cb) || a.name.localeCompare(b.name);
  });
  return Promise.resolve(enriched);
}

export function createProduct({ category_id, name, price, quantity, unit }) {
  if (!name?.trim()) return Promise.reject(apiError('Product name is required'));
  if (price == null || price < 0) return Promise.reject(apiError('Valid price is required'));
  if (quantity == null || quantity < 0) return Promise.reject(apiError('Valid quantity is required'));

  const products = read(K.products) || [];
  const categories = read(K.categories) || [];
  const product = {
    id: nextId('products'),
    category_id: category_id ? Number(category_id) : null,
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity),
    unit: unit || 'piece',
    created_at: ts(),
    updated_at: ts(),
  };
  products.push(product);
  write(K.products, products);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return Promise.resolve({ ...product, category_name: catMap[product.category_id] || null });
}

export function updateProduct(id, { category_id, name, price, quantity, unit }) {
  if (!name?.trim()) return Promise.reject(apiError('Product name is required'));
  if (price == null || price < 0) return Promise.reject(apiError('Valid price is required'));
  if (quantity == null || quantity < 0) return Promise.reject(apiError('Valid quantity is required'));

  const products = read(K.products) || [];
  const categories = read(K.categories) || [];
  const idx = products.findIndex((p) => p.id === Number(id));
  if (idx === -1) return Promise.reject(apiError('Product not found'));

  products[idx] = {
    ...products[idx],
    category_id: category_id ? Number(category_id) : null,
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity),
    unit: unit || 'piece',
    updated_at: ts(),
  };
  write(K.products, products);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return Promise.resolve({ ...products[idx], category_name: catMap[products[idx].category_id] || null });
}

export function deleteProduct(id) {
  const products = read(K.products) || [];
  const saleItems = read(K.saleItems) || [];
  const numId = Number(id);

  if (!products.find((p) => p.id === numId)) return Promise.reject(apiError('Product not found'));
  if (saleItems.some((si) => si.product_id === numId)) {
    return Promise.reject(apiError('Cannot delete product with existing sales records. Set quantity to 0 instead.'));
  }

  write(K.products, products.filter((p) => p.id !== numId));
  return Promise.resolve({ message: 'Product deleted successfully' });
}

// ─── SALES ────────────────────────────────────────────────────────────────────

export function getSales() {
  const sales = read(K.sales) || [];
  const saleItems = read(K.saleItems) || [];
  const countMap = {};
  for (const si of saleItems) countMap[si.sale_id] = (countMap[si.sale_id] || 0) + 1;
  return Promise.resolve(
    sales
      .map((s) => ({ ...s, item_count: countMap[s.id] || 0 }))
      .sort((a, b) => toDate(b.created_at) - toDate(a.created_at))
      .slice(0, 200)
  );
}

export function getSale(id) {
  const sales = read(K.sales) || [];
  const saleItems = read(K.saleItems) || [];
  const sale = sales.find((s) => s.id === Number(id));
  if (!sale) return Promise.reject(apiError('Sale not found'));
  return Promise.resolve({ ...sale, items: saleItems.filter((si) => si.sale_id === Number(id)) });
}

export function createSale({ items, note }) {
  if (!Array.isArray(items) || items.length === 0) {
    return Promise.reject(apiError('Sale must have at least one item'));
  }

  const products = read(K.products) || [];
  const sales = read(K.sales) || [];
  const saleItems = read(K.saleItems) || [];

  let total = 0;
  const processed = [];

  // Validate all items before committing any changes
  for (const item of items) {
    const product = products.find((p) => p.id === Number(item.product_id));
    if (!product) return Promise.reject(apiError(`Product #${item.product_id} not found`));
    if (product.quantity < item.quantity) {
      return Promise.reject(apiError(`Insufficient stock for "${product.name}". Available: ${product.quantity}`));
    }
    const subtotal = product.price * item.quantity;
    total += subtotal;
    processed.push({ product, quantity: item.quantity, subtotal });
  }

  const saleId = nextId('sales');
  const dateStr = ts();
  sales.push({ id: saleId, total, note: note || null, created_at: dateStr });

  const newItems = [];
  for (const { product, quantity, subtotal } of processed) {
    const si = {
      id: nextId('saleItems'),
      sale_id: saleId,
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity,
      subtotal,
    };
    saleItems.push(si);
    newItems.push(si);

    const idx = products.findIndex((p) => p.id === product.id);
    products[idx].quantity -= quantity;
    products[idx].updated_at = dateStr;
  }

  write(K.products, products);
  write(K.sales, sales);
  write(K.saleItems, saleItems);

  return Promise.resolve({ id: saleId, total, note: note || null, created_at: dateStr, items: newItems });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export function getDashboard() {
  const sales = read(K.sales) || [];
  const saleItems = read(K.saleItems) || [];
  const products = read(K.products) || [];
  const categories = read(K.categories) || [];

  const today = todayStr();
  const yesterday = yesterdayStr();

  const todaySales = sales.filter((s) => localDateStr(s.created_at) === today);
  const yesterdaySales = sales.filter((s) => localDateStr(s.created_at) === yesterday);

  const countMap = {};
  for (const si of saleItems) countMap[si.sale_id] = (countMap[si.sale_id] || 0) + 1;

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const lowStockProducts = products
    .filter((p) => p.quantity <= 10)
    .map((p) => ({ ...p, category_name: catMap[p.category_id] || null }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  const todaySalesList = todaySales
    .map((s) => ({ ...s, item_count: countMap[s.id] || 0 }))
    .sort((a, b) => toDate(b.created_at) - toDate(a.created_at))
    .slice(0, 10);

  return Promise.resolve({
    today_sales: todaySales.length,
    today_revenue: todaySales.reduce((sum, s) => sum + s.total, 0),
    yesterday_sales: yesterdaySales.length,
    yesterday_revenue: yesterdaySales.reduce((sum, s) => sum + s.total, 0),
    total_products: products.length,
    low_stock_count: products.filter((p) => p.quantity <= 10).length,
    today_sales_list: todaySalesList,
    low_stock_products: lowStockProducts,
  });
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export function getAnalytics() {
  const sales = read(K.sales) || [];
  const saleItems = read(K.saleItems) || [];
  const products = read(K.products) || [];
  const categories = read(K.categories) || [];

  // 7-day revenue trend (fills every day even if no sales)
  const daily_revenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    const daySales = sales.filter((s) => localDateStr(s.created_at) === dateStr);
    daily_revenue.push({
      date: dateStr,
      sales_count: daySales.length,
      revenue: daySales.reduce((sum, s) => sum + s.total, 0),
    });
  }

  // Top 8 products by quantity sold
  const prodStats = {};
  for (const si of saleItems) {
    if (!prodStats[si.product_name]) {
      prodStats[si.product_name] = { product_name: si.product_name, total_qty: 0, total_revenue: 0 };
    }
    prodStats[si.product_name].total_qty += si.quantity;
    prodStats[si.product_name].total_revenue += si.subtotal;
  }
  const top_products = Object.values(prodStats)
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 8);

  // Revenue by category
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const prodCatMap = Object.fromEntries(products.map((p) => [p.id, catMap[p.category_id] || 'Uncategorized']));
  const catRevMap = {};
  for (const si of saleItems) {
    const catName = prodCatMap[si.product_id] || 'Uncategorized';
    catRevMap[catName] = (catRevMap[catName] || 0) + si.subtotal;
  }
  const category_revenue = Object.entries(catRevMap)
    .map(([category_name, revenue]) => ({ category_name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Peak hours
  const hourMap = {};
  for (const s of sales) {
    const hour = toDate(s.created_at).getHours();
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  }
  const peak_hours = Object.entries(hourMap)
    .map(([hour, sales_count]) => ({ hour: Number(hour), sales_count }))
    .sort((a, b) => a.hour - b.hour);

  // All-time totals
  const totals = {
    total_sales: sales.length,
    total_revenue: sales.reduce((sum, s) => sum + s.total, 0),
  };

  // Week-over-week comparison
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysFromMon);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);

  const thisWeekSales = sales.filter((s) => {
    const d = toDate(s.created_at);
    return d >= thisMonday && d <= now;
  });
  const lastWeekSales = sales.filter((s) => {
    const d = toDate(s.created_at);
    return d >= lastMonday && d <= lastSunday;
  });

  return Promise.resolve({
    daily_revenue,
    top_products,
    category_revenue,
    peak_hours,
    totals,
    this_week: {
      sales_count: thisWeekSales.length,
      revenue: thisWeekSales.reduce((sum, s) => sum + s.total, 0),
    },
    last_week: {
      sales_count: lastWeekSales.length,
      revenue: lastWeekSales.reduce((sum, s) => sum + s.total, 0),
    },
  });
}
