import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Category name is required' });

  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.name, p.name
  `).all();
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { category_id, name, price, quantity, unit } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (price == null || price < 0) return res.status(400).json({ error: 'Valid price is required' });
  if (quantity == null || quantity < 0) return res.status(400).json({ error: 'Valid quantity is required' });

  try {
    const result = db.prepare(
      'INSERT INTO products (category_id, name, price, quantity, unit) VALUES (?, ?, ?, ?, ?)'
    ).run(category_id || null, name.trim(), price, quantity, unit || 'piece');

    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { category_id, name, price, quantity, unit } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (price == null || price < 0) return res.status(400).json({ error: 'Valid price is required' });
  if (quantity == null || quantity < 0) return res.status(400).json({ error: 'Valid quantity is required' });

  db.prepare(`
    UPDATE products
    SET category_id = ?, name = ?, price = ?, quantity = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(category_id || null, name.trim(), price, quantity, unit || 'piece', id);

  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  // Prevent deletion if product appears in any sale — preserves historical data integrity
  const { count } = db.prepare('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?').get(id);
  if (count > 0) {
    return res.status(409).json({
      error: 'Cannot delete product with existing sales records. Set quantity to 0 instead.',
    });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ message: 'Product deleted successfully' });
});

// ─── SALES ────────────────────────────────────────────────────────────────────

app.get('/api/sales', (req, res) => {
  const sales = db.prepare(`
    SELECT s.*, COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 200
  `).all();
  res.json(sales);
});

app.get('/api/sales/:id', (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });

  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id);
  res.json({ ...sale, items });
});

app.post('/api/sales', (req, res) => {
  const { items, note } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  try {
    const sale = db.transaction(() => {
      let total = 0;
      const processed = [];

      // Validate all items before committing any inventory changes
      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (!product) throw new Error(`Product #${item.product_id} not found`);
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.quantity}`);
        }
        const subtotal = product.price * item.quantity;
        total += subtotal;
        processed.push({ product, quantity: item.quantity, subtotal });
      }

      const { lastInsertRowid: saleId } = db.prepare(
        'INSERT INTO sales (total, note) VALUES (?, ?)'
      ).run(total, note || null);

      for (const { product, quantity, subtotal } of processed) {
        db.prepare(
          'INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(saleId, product.id, product.name, product.price, quantity, subtotal);

        db.prepare(
          'UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(quantity, product.id);
      }

      const result = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
      result.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
      return result;
    })();

    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

app.get('/api/dashboard', (req, res) => {
  const todayStats = db.prepare(`
    SELECT
      COUNT(*) as sales_count,
      COALESCE(SUM(total), 0) as revenue
    FROM sales
    WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')
  `).get();

  const { count: total_products } = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const { count: low_stock_count } = db.prepare(
    'SELECT COUNT(*) as count FROM products WHERE quantity <= 10'
  ).get();

  const recent_sales = db.prepare(`
    SELECT s.id, s.total, s.created_at, COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 5
  `).all();

  const low_stock_products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.quantity <= 10
    ORDER BY p.quantity ASC
    LIMIT 10
  `).all();

  res.json({
    today_sales: todayStats.sales_count,
    today_revenue: todayStats.revenue,
    total_products,
    low_stock_count,
    recent_sales,
    low_stock_products,
  });
});

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

app.get('/api/analytics', (req, res) => {
  // Fill all 7 days even if there are no sales on some days
  const daily_revenue = db.prepare(`
    WITH RECURSIVE dates(date) AS (
      SELECT DATE('now', 'localtime', '-6 days')
      UNION ALL
      SELECT DATE(date, '+1 day') FROM dates WHERE date < DATE('now', 'localtime')
    )
    SELECT d.date,
           COUNT(s.id) as sales_count,
           COALESCE(SUM(s.total), 0) as revenue
    FROM dates d
    LEFT JOIN sales s ON DATE(s.created_at, 'localtime') = d.date
    GROUP BY d.date
    ORDER BY d.date ASC
  `).all();

  const top_products = db.prepare(`
    SELECT si.product_name,
           SUM(si.quantity) as total_qty,
           SUM(si.subtotal) as total_revenue
    FROM sale_items si
    GROUP BY si.product_name
    ORDER BY total_qty DESC
    LIMIT 8
  `).all();

  const category_revenue = db.prepare(`
    SELECT COALESCE(c.name, 'Uncategorized') as category_name,
           SUM(si.subtotal) as revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY revenue DESC
  `).all();

  const peak_hours = db.prepare(`
    SELECT CAST(strftime('%H', created_at, 'localtime') AS INTEGER) as hour,
           COUNT(*) as sales_count
    FROM sales
    GROUP BY hour
    ORDER BY hour ASC
  `).all();

  const totals = db.prepare(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_revenue
    FROM sales
  `).get();

  res.json({ daily_revenue, top_products, category_revenue, peak_hours, totals });
});

app.listen(PORT, () => {
  console.log(`✓ Tindahan ni Aling Nena backend running on http://localhost:${PORT}`);
});
