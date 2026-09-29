import { useEffect, useState } from 'react'
import { CONDITIONS, Icon, ProductImage, discount, money } from './lib.jsx'

const EMPTY = { name: '', description: '', category: 'Électronique', condition: 'Neuf scellé', price: '', amazonPrice: '', stock: 1, emoji: '📦', color: '#F2F2F2', image: '' }

export default function Admin({ products, reload }) {
  const [pw, setPw] = useState(() => { try { return sessionStorage.getItem('yb-admin') || '' } catch { return '' } })
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('produits')
  const [orders, setOrders] = useState([])
  const [edit, setEdit] = useState(null)

  const api = (url, opts = {}) => fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-password': pw, ...opts.headers } })

  const login = async (e) => {
    e?.preventDefault()
    const r = await api('/api/admin/orders')
    if (!r.ok) { setErr('Mot de passe invalide (voir ADMIN_PASSWORD dans .env).'); return }
    setOrders(await r.json()); setOk(true); setErr('')
    try { sessionStorage.setItem('yb-admin', pw) } catch {}
  }
  useEffect(() => { if (pw) login() }, [])

  if (!ok) {
    return (
      <section className="center">
        <form className="login" onSubmit={login}>
          <Icon n="lock" s={28} />
          <h1 className="ttl"><b>ESPACE</b> ADMIN</h1>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mot de passe" autoFocus />
          {err && <p className="err">{err}</p>}
          <button className="btn primary block">Entrer</button>
        </form>
      </section>
    )
  }

  const save = async (p) => {
    const r = await api(p.id ? '/api/admin/products/' + p.id : '/api/admin/products', { method: p.id ? 'PUT' : 'POST', body: JSON.stringify(p) })
    if (r.ok) { setEdit(null); reload() }
  }
  const del = async (p) => {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return
    await api('/api/admin/products/' + p.id, { method: 'DELETE' }); reload()
  }

  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const categories = [...new Set(products.map((p) => p.category))]

  return (
    <section className="admin">
      <div className="ahead">
        <h1 className="ttl"><b>TABLEAU</b> DE BORD</h1>
        <button className="btn primary" onClick={() => setEdit(EMPTY)}><Icon n="plus" /> Ajouter un article</button>
      </div>

      <div className="stats">
        <div><small>Articles</small><b>{products.length}</b></div>
        <div><small>Unités en stock</small><b>{products.reduce((s, p) => s + p.stock, 0)}</b></div>
        <div><small>Valeur du stock</small><b>{money(stockValue)}</b></div>
        <div><small>Ventes ({orders.length})</small><b>{money(revenue)}</b></div>
      </div>

      <div className="tabs">
        <button className={tab === 'produits' ? 'on' : ''} onClick={() => setTab('produits')}>Produits</button>
        <button className={tab === 'commandes' ? 'on' : ''} onClick={() => { setTab('commandes'); login() }}>Commandes</button>
      </div>

      {tab === 'produits' ? (
        <div className="table">
          {products.map((p) => (
            <div key={p.id} className="trow">
              <ProductImage p={p} />
              <div className="tname"><b>{p.name}</b><small>{p.category} · {p.condition}</small></div>
              <div className="tnum"><b>{money(p.price)}</b><small>-{discount(p)} %</small></div>
              <div className={'tnum' + (p.stock <= 3 ? ' low' : '')}><b>{p.stock}</b><small>en stock</small></div>
              <div className="tact">
                <button className="iconbtn" onClick={() => setEdit(p)} aria-label="Modifier"><Icon n="edit" /></button>
                <button className="iconbtn" onClick={() => del(p)} aria-label="Supprimer"><Icon n="trash" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="muted center">Aucune commande pour l'instant.</p>
      ) : (
        <div className="table">
          {orders.map((o) => (
            <div key={o.id} className="orow">
              <div><b>{o.name || o.email}</b><small>{new Date(o.date).toLocaleString('fr-CA')}</small></div>
              <div className="oitems">{o.items.map((it) => `${it.qty} × ${it.name}`).join(', ')}</div>
              <div className="oaddr">{o.address ? `${o.address.line1}, ${o.address.city} ${o.address.postal_code}` : '—'}</div>
              <b>{money(o.total)}</b>
            </div>
          ))}
        </div>
      )}

      {edit && <Editor p={edit} categories={categories} onSave={save} onClose={() => setEdit(null)} />}
    </section>
  )
}

function Editor({ p, categories, onSave, onClose }) {
  const [f, setF] = useState(p)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="modalwrap" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(f) }}>
        <div className="dhead"><h2>{p.id ? 'Modifier' : 'Nouvel'} article</h2><button type="button" className="iconbtn" onClick={onClose}><Icon n="close" /></button></div>
        <div className="mbody">
          <ProductImage p={f} />
          <label>Nom<input required value={f.name} onChange={set('name')} /></label>
          <label>Description<textarea rows="2" value={f.description} onChange={set('description')} /></label>
          <div className="two">
            <label>Catégorie<input list="cats" value={f.category} onChange={set('category')} /></label>
            <label>État<select value={f.condition} onChange={set('condition')}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <div className="three">
            <label>Ton prix $<input required type="number" step="0.01" min="0.5" value={f.price} onChange={set('price')} /></label>
            <label>Prix Amazon $<input type="number" step="0.01" min="0" value={f.amazonPrice} onChange={set('amazonPrice')} /></label>
            <label>Stock<input type="number" min="0" value={f.stock} onChange={set('stock')} /></label>
          </div>
          <label>Photo (lien URL, optionnel)<input value={f.image} onChange={set('image')} placeholder="https://…" /></label>
          <div className="two">
            <label>Emoji si pas de photo<input value={f.emoji} onChange={set('emoji')} /></label>
            <label>Couleur de fond<input type="color" value={f.color} onChange={set('color')} /></label>
          </div>
        </div>
        <button className="btn primary block lg">Enregistrer</button>
      </form>
    </div>
  )
}
