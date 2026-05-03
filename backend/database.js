import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'sari-sari.db'));

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'piece',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL
  );
`);

// ─── Seed categories + products (first run only) ──────────────────────────────
const { count } = db.prepare('SELECT COUNT(*) as count FROM categories').get();

if (count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const insertProduct = db.prepare(
    'INSERT INTO products (category_id, name, price, quantity, unit) VALUES (?, ?, ?, ?, ?)'
  );

  const seedData = {
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

  const seedAll = db.transaction(() => {
    for (const [categoryName, products] of Object.entries(seedData)) {
      const { lastInsertRowid: categoryId } = insertCategory.run(categoryName);
      for (const [name, price, quantity, unit] of products) {
        insertProduct.run(categoryId, name, price, quantity, unit);
      }
    }
  });

  seedAll();
  console.log('✓ Database seeded with Filipino sari-sari store products');
}

// ─── Seed demo sales (runs whenever sales table is empty) ─────────────────────
{
  const { count: salesCount } = db.prepare('SELECT COUNT(*) as count FROM sales').get();
  if (salesCount === 0) {
    const insertSale = db.prepare('INSERT INTO sales (total, created_at) VALUES (?, ?)');
    const insertItem = db.prepare(
      'INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const deductQty = db.prepare(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?'
    );
    const getProduct = db.prepare('SELECT * FROM products WHERE name = ?');

    // [day_offset, hour, [[productName, qty], ...]]
    const salesPlan = [
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

    const seedSales = db.transaction(() => {
      for (const [dayOffset, hour, items] of salesPlan) {
        const dateStr = new Date(
          Date.now() + dayOffset * 86400000 + (hour - new Date().getHours()) * 3600000
        ).toISOString().replace('T', ' ').slice(0, 19);

        let total = 0;
        const resolved = [];
        for (const [name, qty] of items) {
          const p = getProduct.get(name);
          if (!p || p.quantity < qty) continue;
          const subtotal = p.price * qty;
          total += subtotal;
          resolved.push({ p, qty, subtotal });
        }
        if (resolved.length === 0) continue;

        const { lastInsertRowid: saleId } = insertSale.run(total, dateStr);
        for (const { p, qty, subtotal } of resolved) {
          insertItem.run(saleId, p.id, p.name, p.price, qty, subtotal);
          deductQty.run(qty, p.id);
        }
      }
    });

    seedSales();
    console.log('✓ Demo sales data seeded for analytics charts');
  }
}

export default db;
