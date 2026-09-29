import { useEffect, useMemo, useState } from 'react'
import { Icon, ProductImage, discount, money } from './lib.jsx'

const CAT_META = {
  'Électronique': '🎧', 'Maison & cuisine': '🍳', 'Outils': '🧰',
  'Sport & plein air': '🏋️', 'Jouets': '🧱', 'Beauté & soins': '💨',
}
const shop = (cat) => '#/boutique' + (cat ? '?cat=' + encodeURIComponent(cat) : '')

// "TITRE léger" : premier mot en gras, reste en léger, comme la DA
const Split = ({ text }) => {
  const [a, ...b] = text.split(' ')
  return <><b>{a}</b> {b.join(' ')}</>
}

export default function Home({ products, add }) {
  const inStock = products.filter((p) => p.stock > 0)
  const hero = useMemo(() => [...inStock].sort((a, b) => b.amazonPrice - a.amazonPrice).slice(0, 4), [products])
  const picks = useMemo(() => [...inStock].sort((a, b) => discount(b) - discount(a)).slice(0, 6), [products])
  const cats = useMemo(() => [...new Set(products.map((p) => p.category))].slice(0, 6), [products])

  const [i, setI] = useState(0)
  useEffect(() => {
    if (!hero.length) return
    const t = setInterval(() => setI((x) => (x + 1) % hero.length), 6000)
    return () => clearInterval(t)
  }, [hero.length, i])

  const [k, setK] = useState(0)
  const trio = picks.length >= 3 ? [-1, 0, 1].map((o) => picks[(k + o + picks.length) % picks.length]) : picks

  const h = hero[i]
  return (
    <>
      <section className="hero">
        {h && (
          <>
            <button className="harrow l" onClick={() => setI((i - 1 + hero.length) % hero.length)} aria-label="Précédent"><Icon n="left" s={34} /></button>
            <div className="hstage" key={h.id}>
              <div className="htext">
                <span className="eyebrow">Arrivage de la semaine · {h.condition}</span>
                <h1><Split text={h.name} /></h1>
                <p className="hprice">{money(h.price)} <s>{money(h.amazonPrice)} sur Amazon</s></p>
                <div className="hlinks">
                  <button onClick={() => add(h.id)}><Icon n="play" s={10} fill="currentColor" /> Ajouter au panier</button>
                  <a href={shop()}><Icon n="play" s={10} fill="currentColor" /> Voir tous les arrivages</a>
                </div>
              </div>
              <div className="hvisual">
                <ProductImage p={h} big />
                <span className="hbadge">-{discount(h)} %</span>
              </div>
            </div>
            <button className="harrow r" onClick={() => setI((i + 1) % hero.length)} aria-label="Suivant"><Icon n="right" s={34} /></button>
            <div className="hthumbs">
              {hero.map((p, n) => (
                <button key={p.id} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={p.name}><ProductImage p={p} /></button>
              ))}
            </div>
            <div className="dots">{hero.map((p, n) => <button key={p.id} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={'Diapo ' + (n + 1)} />)}</div>
          </>
        )}
      </section>

      <section className="learn">
        <h2 className="ttl"><b>DÉCOUVRE</b> NOS CATÉGORIES</h2>
        <div className="tiles">
          {cats.map((c) => {
            const sample = products.find((p) => p.category === c)
            return (
              <a key={c} href={shop(c)} className="tile">
                <div className="tvis" style={{ background: sample?.color }}>
                  <span>{CAT_META[c] || sample?.emoji || '📦'}</span>
                </div>
                <div className="tlbl">
                  <span>{c}</span>
                  <small>{products.filter((p) => p.category === c).length} articles</small>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {trio.length === 3 && (
        <section className="trio">
          <h2 className="ttl big"><b>COUPS</b> DE CŒUR</h2>
          <div className="tstage">
            {trio.map((p, n) => (
              <div key={p.id + n} className={'tcol' + (n === 1 ? ' main' : '')}>
                <h3><Split text={p.name.toUpperCase()} /></h3>
                <div className="tprod">
                  <ProductImage p={p} big={n === 1} />
                  <div className="shadow" />
                </div>
                <div className="tmeta">
                  <span>{money(p.price)} <em>-{discount(p)} %</em></span>
                  <button onClick={() => add(p.id)}>AJOUTER</button>
                </div>
              </div>
            ))}
            <button className="tarrow l" onClick={() => setK((k - 1 + picks.length) % picks.length)} aria-label="Précédent"><Icon n="left" s={30} /></button>
            <button className="tarrow r" onClick={() => setK((k + 1) % picks.length)} aria-label="Suivant"><Icon n="right" s={30} /></button>
          </div>
          <p className="ttl sub"><b>TROUVE TON</b> AUBAINE PARMI NOS ARRIVAGES</p>
        </section>
      )}

      <section className="how">
        <div><Icon n="box" s={26} /><b>ACHETÉ EN LOTS</b><span>Surplus et retours Amazon achetés à la palette.</span></div>
        <div><Icon n="shield" s={26} /><b>INSPECTÉ</b><span>Chaque article est vérifié et testé avant la mise en ligne.</span></div>
        <div><Icon n="truck" s={26} /><b>LIVRÉ</b><span>Partout au Canada en 3 à 7 jours ouvrables.</span></div>
      </section>
    </>
  )
}
