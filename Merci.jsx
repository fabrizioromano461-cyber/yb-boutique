import { useEffect, useState } from 'react'
import { Icon, money } from './lib.jsx'

export default function Merci({ sessionId, onPaid }) {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    if (!sessionId) return setState({ error: true })
    fetch('/api/order/' + encodeURIComponent(sessionId))
      .then((r) => r.json())
      .then((d) => { setState(d); if (d.paid) onPaid() })
      .catch(() => setState({ error: true }))
  }, [sessionId])

  return (
    <section className="center">
      {state.loading ? <p className="muted">Vérification du paiement…</p>
        : state.paid ? (
          <>
            <div className="okcircle"><Icon n="check" s={36} /></div>
            <h1 className="ttl big"><b>MERCI</b> POUR TA COMMANDE</h1>
            <p>Un reçu a été envoyé à <b>{state.order.email}</b>. On prépare ton colis.</p>
            <ul className="recap">
              {state.order.items.map((it) => <li key={it.id}><span>{it.qty} × {it.name}</span></li>)}
              <li className="tot"><span>Total payé</span><b>{money(state.order.total)}</b></li>
            </ul>
            <a className="btn primary" href="#/boutique">Continuer à magasiner</a>
          </>
        ) : (
          <>
            <h1 className="ttl big"><b>PAIEMENT</b> NON CONFIRMÉ</h1>
            <p>On n'a pas pu confirmer ce paiement. Ton panier est toujours là.</p>
            <a className="btn primary" href="#/boutique">Retour à la boutique</a>
          </>
        )}
    </section>
  )
}
