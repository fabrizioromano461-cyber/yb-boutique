import { useMemo, useState } from 'react'
import { CONDITIONS, Icon, ProductImage, discount, money } from './lib.jsx'

const RANGES = [
  { id: 'r1', label: 'Moins de 25 $', min: 0, max: 25 },
  { id: 'r2', label: '25 $ – 50 $', min: 25, max: 50 },
  { id: 'r3', label: '50 $ – 100 $', min: 50, max: 100 },
  { id: 'r4', label: '100 $ et plus', min: 100, max: Infinity },
]
const SORTS = {
  pertinence: { label: 'Pertinence', fn: () => 0 },
  rabais: { label: 'Plus gros rabais', fn: (a, b) => discount(b) - discount(a) },
  prixAsc: { label: 'Prix croissant', fn: (a, b) => a.price - b.price },
  prixDesc: { label: 'Prix décroissant', fn: (a, b) => b.price - a.price },
  nom: { label: 'Nom A–Z', fn: (a, b) => a.name.localeCompare(b.name, 'fr') },
}

export default function Shop({ products, favsOnly, favs, toggleFav, add, cart, initialCat, initialQ }) {
  const [q, setQ] = useState(initialQ || '')
  const [cats, setCats] = useState(initialCat ? [initialCat] : [])
  const [conds, setConds] = useState([])
  const [ranges, setRanges] = useState([])
  const [maxPrice, setMaxPrice] = useState(null)
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('pertinence')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [added, setAdded] = useState(null)

  const top = useMemo(() => Math.ceil(Math.max(50, ...products.map((p) => p.price)) / 10) * 10, [products])
  const limit = maxPrice ?? top
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'fr')), [products])
  const toggle = (set) => (v) => set((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]))

  const base = favsOnly ? products.filter((p) => favs.includes(p.id)) : products
  const list = base
    .filter((p) => !q || (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q.toLowerCase()))
    .filter((p) => !cats.length || cats.includes(p.category))
    .filter((p) => !conds.length || conds.includes(p.condition))
    .filter((p) => !ranges.length || RANGES.filter((r) => ranges.includes(r.id)).some((r) => p.price >= r.min && p.price < r.max))
    .filter((p) => p.price <= limit)
    .filter((p) => !inStock || p.stock > 0)
    .sort((a, b) => (b.stock > 0) - (a.stock > 0) || SORTS[sort].fn(a, b))

  const activeCount = cats.length + conds.length + ranges.length + (maxPrice != null) + inStock
  const reset = () => { setCats([]); setConds([]); setRanges([]); setMaxPrice(null); setInStock(false) }
  const onAdd = (p) => { add(p.id); setAdded(p.id); setTimeout(() => setAdded(null), 1200) }

  return (
    <>
      <div className="phead">
        <h1 className="ttl"><b>{favsOnly ? 'MES' : 'TOUS LES'}</b> {favsOnly ? 'FAVORIS' : 'ARRIVAGES'}</h1>
        <p>Surplus et retours Amazon inspectés, jusqu'à 70 % sous le prix Amazon.</p>
        <label className="search">
          <Icon n="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article…" autoFocus={!!initialQ} />
        </label>
      </div>

      <div className="layout">
        <aside className={'card filters' + (filtersOpen ? ' open' : '')}>
          <div className="fhead">
            <strong>Filtres</strong>
            {activeCount > 0 && <button className="link" onClick={reset}>Tout effacer</button>}
            <button className="iconbtn only-m" onClick={() => setFiltersOpen(false)} aria-label="Fermer"><Icon n="close" /></button>
          </div>

          <Group title="Catégories">
            {categories.map((c) => (
              <Check key={c} on={cats.includes(c)} onChange={() => toggle(setCats)(c)} label={c} n={base.filter((p) => p.category === c).length} />
            ))}
          </Group>

          <Group title="Prix">
            {RANGES.map((r) => (
              <Check key={r.id} on={ranges.includes(r.id)} onChange={() => toggle(setRanges)(r.id)} label={r.label} n={base.filter((p) => p.price >= r.min && p.price < r.max).length} />
            ))}
            <div className="range">
              <div className="rangehead"><span>Prix maximum</span><b>{money(limit)}</b></div>
              <input type="range" min="10" max={top} step="5" value={limit} onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ '--pct': ((limit - 10) / (top - 10)) * 100 + '%' }} />
            </div>
          </Group>

          <Group title="État">
            {CONDITIONS.map((c) => (
              <Check key={c} on={conds.includes(c)} onChange={() => toggle(setConds)(c)} label={c} n={base.filter((p) => p.condition === c).length} />
            ))}
          </Group>

          <Group title="Disponibilité">
            <Check on={inStock} onChange={() => setInStock(!inStock)} label="En stock seulement" />
          </Group>

          <button className="btn primary block only-m" onClick={() => setFiltersOpen(false)}>Voir {list.length} articles</button>
        </aside>
        {filtersOpen && <div className="scrim" onClick={() => setFiltersOpen(false)} />}

        <section className="results">
          <div className="card toolbar">
            <div>
              <div className="crumbs">Catégories <Icon n="chev" s={12} /> <b>{cats.length === 1 ? cats[0] : cats.length ? `${cats.length} catégories` : 'Toutes'}</b></div>
              <small>Affichage de <b>{list.length}</b> article{list.length > 1 ? 's' : ''}</small>
            </div>
            <div className="tools">
              <button className="btn ghost only-m" onClick={() => setFiltersOpen(true)}>
                <Icon n="filter" /> Filtres {activeCount > 0 && <b className="dot">{activeCount}</b>}
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="card empty">
              <span>{favsOnly ? '💛' : '🔍'}</span>
              <p>{favsOnly ? 'Aucun favori pour le moment. Touche le cœur sur un article pour le garder ici.' : 'Aucun article ne correspond à tes filtres.'}</p>
              {!favsOnly && activeCount > 0 && <button className="btn primary" onClick={reset}>Effacer les filtres</button>}
            </div>
          ) : (
            <div className="grid">
              {list.map((p) => {
                const d = discount(p)
                const out = p.stock <= 0
                const inCart = cart[p.id] || 0
                return (
                  <article key={p.id} className={'product' + (out ? ' out' : '')}>
                    <div className="imgwrap">
                      <ProductImage p={p} />
                      {d > 0 && <span className="badge">-{d} %</span>}
                      <button className={'fav' + (favs.includes(p.id) ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-label="Favori">
                        <Icon n="heart" s={16} fill={favs.includes(p.id) ? 'currentColor' : 'none'} />
                      </button>
                      <span className="cond">{p.condition}</span>
                    </div>
                    <h3>{p.name}</h3>
                    <p className="desc">{p.description}</p>
                    <div className="stock">
                      {out ? <span className="low">Épuisé</span> : p.stock <= 3 ? <span className="low">Plus que {p.stock} !</span> : <span>{p.stock} en stock</span>}
                    </div>
                    <div className="pfoot">
                      <div className="prices">
                        <strong>{money(p.price)}</strong>
                        {p.amazonPrice > p.price && <s>Amazon {money(p.amazonPrice)}</s>}
                      </div>
                      <button className={'addbtn' + (added === p.id ? ' done' : '')} disabled={out || inCart >= p.stock} onClick={() => onAdd(p)} aria-label="Ajouter au panier">
                        <Icon n={added === p.id ? 'check' : 'bag'} s={17} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Group({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="group">
      <button className="ghead" onClick={() => setOpen(!open)}>{title}<span className={open ? 'up' : ''}><Icon n="chev" s={14} /></span></button>
      {open && <div className="gbody">{children}</div>}
    </div>
  )
}
function Check({ on, onChange, label, n }) {
  return (
    <label className="check">
      <input type="checkbox" checked={on} onChange={onChange} />
      <span className="box"><Icon n="check" s={12} /></span>
      <span className="lbl">{label}</span>
      {n != null && <span className="n">({n})</span>}
    </label>
  )
}
