import 'dotenv/config'
import express from 'express'
import Stripe from 'stripe'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const PRODUCTS = path.join(dir, 'data/products.json')
const ORDERS = path.join(dir, 'data/orders.json')
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [])
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2))

const stripe = process.env.STRIPE_SECRET_KEY?.startsWith('sk_') && !process.env.STRIPE_SECRET_KEY.endsWith('...')
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null
const FREE_SHIPPING_FROM = 75 // $
const SHIPPING_FLAT = 12.99 // $
const cents = (n) => Math.round(n * 100)

const app = express()

// Enregistre une commande payée une seule fois et décrémente le stock.
function recordOrder(session) {
  const orders = readJson(ORDERS)
  if (orders.some((o) => o.id === session.id)) return orders.find((o) => o.id === session.id)
  const items = JSON.parse(session.metadata?.items || '[]')
  const products = readJson(PRODUCTS)
  for (const it of items) {
    const p = products.find((x) => x.id === it.id)
    if (p) p.stock = Math.max(0, p.stock - it.qty)
  }
  writeJson(PRODUCTS, products)
  const order = {
    id: session.id,
    date: new Date().toISOString(),
    email: session.customer_details?.email || '',
    name: session.customer_details?.name || '',
    address: session.collected_information?.shipping_details?.address || session.shipping_details?.address || null,
    total: (session.amount_total || 0) / 100,
    items: items.map((it) => ({ ...it, name: products.find((p) => p.id === it.id)?.name || it.id })),
    status: 'payée',
  }
  orders.unshift(order)
  writeJson(ORDERS, orders)
  return order
}

// Webhook Stripe (doit recevoir le corps brut, donc avant express.json)
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(400)
  try {
    const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
    if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') recordOrder(event.data.object)
    res.json({ received: true })
  } catch (e) {
    res.status(400).send(`Webhook: ${e.message}`)
  }
})

app.use(express.json())

app.get('/api/products', (_req, res) => res.json(readJson(PRODUCTS)))
app.get('/api/config', (_req, res) => res.json({ stripeReady: !!stripe, freeShippingFrom: FREE_SHIPPING_FROM, shipping: SHIPPING_FLAT }))

app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Paiement pas encore configuré : ajoute STRIPE_SECRET_KEY dans le fichier .env.' })
  const products = readJson(PRODUCTS)
  const items = []
  // Les prix viennent toujours du serveur, jamais du navigateur.
  for (const { id, qty } of req.body.items || []) {
    const p = products.find((x) => x.id === id)
    const q = Math.floor(Number(qty))
    if (!p || q < 1) continue
    if (q > p.stock) return res.status(409).json({ error: `Stock insuffisant pour « ${p.name} » (${p.stock} restant).` })
    items.push({ p, qty: q })
  }
  if (!items.length) return res.status(400).json({ error: 'Panier vide.' })

  const subtotal = items.reduce((s, { p, qty }) => s + p.price * qty, 0)
  const origin = req.headers.origin || process.env.PUBLIC_URL || 'http://localhost:5180'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr-CA',
      line_items: items.map(({ p, qty }) => ({
        quantity: qty,
        price_data: {
          currency: 'cad',
          unit_amount: cents(p.price),
          product_data: { name: p.name, description: `${p.condition} · ${p.description}`.slice(0, 250), ...(p.image?.startsWith('http') ? { images: [p.image] } : {}) },
        },
      })),
      shipping_address_collection: { allowed_countries: ['CA'] },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: subtotal >= FREE_SHIPPING_FROM ? 'Livraison gratuite' : 'Livraison standard',
          fixed_amount: { amount: subtotal >= FREE_SHIPPING_FROM ? 0 : cents(SHIPPING_FLAT), currency: 'cad' },
          delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } },
        },
      }],
      phone_number_collection: { enabled: true },
      metadata: { items: JSON.stringify(items.map(({ p, qty }) => ({ id: p.id, qty }))) },
      success_url: `${origin}/#/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/`,
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Page « merci » : confirme le paiement (filet de sécurité si le webhook n'est pas configuré)
app.get('/api/order/:sessionId', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
    if (session.payment_status !== 'paid') return res.json({ paid: false })
    const order = recordOrder(session)
    res.json({ paid: true, order: { total: order.total, email: order.email, items: order.items } })
  } catch (e) {
    res.status(404).json({ error: e.message })
  }
})

// --- Admin ---
const admin = (req, res, next) =>
  process.env.ADMIN_PASSWORD && req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD
    ? next()
    : res.status(401).json({ error: 'Mot de passe invalide' })

app.get('/api/admin/orders', admin, (_req, res) => res.json(readJson(ORDERS)))
app.post('/api/admin/products', admin, (req, res) => {
  const products = readJson(PRODUCTS)
  const p = { ...clean(req.body), id: 'p' + Date.now().toString(36) }
  products.unshift(p)
  writeJson(PRODUCTS, products)
  res.json(p)
})
app.put('/api/admin/products/:id', admin, (req, res) => {
  const products = readJson(PRODUCTS)
  const i = products.findIndex((p) => p.id === req.params.id)
  if (i < 0) return res.sendStatus(404)
  products[i] = { ...products[i], ...clean(req.body), id: req.params.id }
  writeJson(PRODUCTS, products)
  res.json(products[i])
})
app.delete('/api/admin/products/:id', admin, (req, res) => {
  writeJson(PRODUCTS, readJson(PRODUCTS).filter((p) => p.id !== req.params.id))
  res.json({ ok: true })
})
function clean(b) {
  return {
    name: String(b.name || '').slice(0, 120),
    description: String(b.description || '').slice(0, 400),
    category: String(b.category || 'Divers'),
    condition: String(b.condition || 'Neuf scellé'),
    price: Math.max(0.5, Number(b.price) || 0),
    amazonPrice: Math.max(0, Number(b.amazonPrice) || 0),
    stock: Math.max(0, Math.floor(Number(b.stock) || 0)),
    emoji: String(b.emoji || '📦').slice(0, 8),
    color: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#F2F2F2',
    image: String(b.image || ''),
  }
}

// Production : sert le site compilé
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(dir, 'dist')))
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dir, 'dist/index.html')))
}

const PORT = process.env.NODE_ENV === 'production' ? process.env.PORT || 4242 : 4242
app.listen(PORT, () => console.log(`API YB sur http://localhost:${PORT} — Stripe ${stripe ? 'OK' : 'NON configuré'}`))
