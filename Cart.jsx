import { useState } from 'react'
import { Icon, ProductImage, money } from './lib.jsx'

export default function Cart({ open, onClose, cart, products, add, config }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: products.find((x) => x.id === id), qty })).filter((l) => l.p)
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0)
  const saved = lines.reduce((s, l) => s + Math.max(0, l.p.amazonPrice - l.p.price) * l.qty, 0)
  const free = subtotal >= config.freeShippingFrom
  const shipping = lines.length && !free ? config.shipping : 0

  const checkout = async () => {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map((l) => ({ id: l.p.id, qty: l.qty })) }),
      })
      const data = await r.json()
      if (data.url) location.href = data.url
      else setErr(data.error || 'Erreur de paiement')
    } catch {
      setErr('Impossible de joindre le serveur.')
    }
    setBusy(false)
  }

  return (
    <>
      <div className={'scrim cartscrim' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="dhead">
          <h2>Mon panier</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Fermer"><Icon n="close" /></button>
        </div>

        {lines.length === 0 ? (
          <div className="dempty">
            <span>🛒</span>
            <p>Ton panier est vide.</p>
            <button className="btn primary" onClick={onClose}>Magasiner</button>
          </div>
        ) : (
          <>
            <div className="ship">
              {free ? <p>🎉 Tu as droit à la <b>livraison gratuite</b> !</p>
                : <p>Plus que <b>{money(config.freeShippingFrom - subtotal)}</b> pour la livraison gratuite</p>}
              <div className="bar"><i style={{ width: Math.min(100, (subtotal / config.freeShippingFrom) * 100) + '%' }} /></div>
            </div>
            <ul className="lines">
              {lines.map(({ p, qty }) => (
                <li key={p.id}>
                  <ProductImage p={p} />
                  <div className="linfo">
                    <strong>{p.name}</strong>
                    <small>{p.condition}</small>
                    <div className="qty">
                      <button onClick={() => add(p.id, -1)} aria-label="Moins"><Icon n={qty === 1 ? 'trash' : 'minus'} s={14} /></button>
                      <span>{qty}</span>
                      <button onClick={() => add(p.id, 1)} disabled={qty >= p.stock} aria-label="Plus"><Icon n="plus" s={14} /></button>
                    </div>
                  </div>
                  <b>{money(p.price * qty)}</b>
                </li>
              ))}
            </ul>
            <div className="dfoot">
              <div className="row"><span>Sous-total</span><span>{money(subtotal)}</span></div>
              <div className="row"><span>Livraison</span><span>{shipping ? money(shipping) : 'Gratuite'}</span></div>
              {saved > 0 && <div className="row save"><span>Économie vs Amazon</span><span>-{money(saved)}</span></div>}
              <div className="row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
              <small className="taxnote">Taxes calculées à l'étape suivante, si applicables.</small>
              {err && <p className="err">{err}</p>}
              <button className="btn primary block lg" onClick={checkout} disabled={busy}>
                <Icon n="lock" /> {busy ? 'Redirection…' : 'Payer maintenant'}
              </button>
              <div className="secure"><Icon n="shield" s={14} /> Paiement sécurisé par Stripe · Visa, Mastercard, Apple Pay, Google Pay</div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
