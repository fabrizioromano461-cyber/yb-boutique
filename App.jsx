import { useEffect, useMemo, useState } from 'react'
import { Icon, useHashRoute, useStored } from './lib.jsx'
import Home from './Home.jsx'
import Shop from './Shop.jsx'
import Cart from './Cart.jsx'
import Admin from './Admin.jsx'
import Merci from './Merci.jsx'
import Aide from './Aide.jsx'

const NAV = [
  { to: '/', label: 'Accueil' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/boutique?cat=Électronique', label: 'Électronique' },
  { to: '/boutique?cat=Maison %26 cuisine', label: 'Maison' },
  { to: '/boutique?cat=Outils', label: 'Outils' },
  { to: '/boutique?cat=Sport %26 plein air', label: 'Sport' },
  { to: '/favoris', label: 'Favoris' },
  { to: '/aide', label: 'Aide' },
]

export default function App() {
  const { path, params } = useHashRoute()
  const [products, setProducts] = useState([])
  const [config, setConfig] = useState({ freeShippingFrom: 75, shipping: 12.99 })
  const [cart, setCart] = useStored('yb-cart', {})
  const [favs, setFavs] = useStored('yb-favs', [])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const load = () => fetch('/api/products').then((r) => r.json()).then(setProducts).catch(() => {})
  useEffect(() => {
    load()
    fetch('/api/config').then((r) => r.json()).then(setConfig).catch(() => {})
  }, [])
  useEffect(() => { setMenuOpen(false); setCartOpen(false) }, [path, params.toString()])

  const count = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart])
  const add = (id, n = 1) => {
    const p = products.find((x) => x.id === id)
    setCart((c) => {
      const q = Math.min((c[id] || 0) + n, p ? p.stock : 99)
      const next = { ...c, [id]: q }
      if (q <= 0) delete next[id]
      return next
    })
  }
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  const current = path + (params.get('cat') ? '?cat=' + encodeURIComponent(params.get('cat')).replace(/%20/g, ' ') : '')
  const isActive = (to) => decodeURIComponent(to) === decodeURIComponent(current)

  let page
  if (path === '/admin') page = <Admin products={products} reload={load} />
  else if (path === '/merci') page = <Merci sessionId={params.get('session_id')} onPaid={() => { setCart({}); load() }} />
  else if (path === '/aide') page = <Aide config={config} />
  else if (path === '/boutique' || path === '/favoris')
    page = <Shop key={path + params.get('cat') + params.get('q')} initialCat={params.get('cat')} initialQ={params.get('q')} products={products} favsOnly={path === '/favoris'} favs={favs} toggleFav={toggleFav} add={add} cart={cart} />
  else page = <Home products={products} add={add} config={config} />

  return (
    <div className="site">
      <header className="topnav">
        <div className="navin">
          <button className="iconbtn only-m" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><Icon n={menuOpen ? 'close' : 'menu'} /></button>
          <a href="#/" className="brand"><img src="/logo-mark.svg" alt="" /><span>YB<small><span>Lots de produits</span> <span>Amazon à prix fous</span></small></span></a>
          <nav className={menuOpen ? 'open' : ''}>
            {NAV.map((n) => (
              <a key={n.to} href={'#' + n.to} className={isActive(n.to) ? 'active' : ''}>{n.label}</a>
            ))}
          </nav>
          <div className="navtools">
            <a href="#/boutique" className="iconbtn" aria-label="Rechercher"><Icon n="search" /></a>
            <button className="iconbtn cartbtn" onClick={() => setCartOpen(true)} aria-label="Panier">
              <Icon n="bag" />{count > 0 && <b>{count}</b>}
            </button>
          </div>
        </div>
      </header>

      <main className={path === '/' ? 'home' : 'page'}>{page}</main>

      <footer>
        <div className="footinfo">
          <p>Magasine en ligne 24 h/24, livraison partout au Canada, ou écris-nous à <b>bonjour@yb.ca</b>.</p>
          <small>YB n'est pas affilié à Amazon. Les articles proviennent de surplus et de retours achetés en lots, inspectés avant la vente. Les prix Amazon indiqués sont ceux observés au moment de la mise en ligne et servent de comparaison.</small>
        </div>
        <div className="footbar">
          <span>© {new Date().getFullYear()} YB. Tous droits réservés.</span>
          <nav>
            <a href="#/boutique">Boutique</a><a href="#/aide">Livraison</a><a href="#/aide">Retours</a><a href="#/aide">Contact</a><a href="#/admin">Admin</a>
          </nav>
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </footer>

      <Cart open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} products={products} add={add} config={config} />
    </div>
  )
}
