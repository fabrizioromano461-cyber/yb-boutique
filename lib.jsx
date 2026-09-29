import { useEffect, useState } from 'react'

export const money = (n) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
export const discount = (p) => (p.amazonPrice > p.price ? Math.round((1 - p.price / p.amazonPrice) * 100) : 0)
export const CONDITIONS = ['Neuf scellé', 'Neuf boîte ouverte', 'Retour testé']

export function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, setV]
}

export function useHashRoute() {
  const get = () => {
    const [path, q = ''] = (location.hash.slice(1) || '/').split('?')
    return { path, params: new URLSearchParams(q) }
  }
  const [r, setR] = useState(get)
  useEffect(() => {
    const on = () => { setR(get()); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return r
}

const P = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bag: 'M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14m0 3h.01',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  close: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  filter: 'M4 6h16M7 12h10M10 18h4',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z',
  box: 'M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Zm-8 4.5 8 4.5 8-4.5M12 12v9',
  check: 'M5 12.5 10 17l9-10',
  chev: 'M9 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  left: 'M15 5 8 12l7 7',
  right: 'M9 5l7 7-7 7',
  play: 'M8 5v14l11-7Z',
  shield: 'M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z',
}
export const Icon = ({ n, s = 18, fill }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n]} />
  </svg>
)

export function ProductImage({ p, big }) {
  return (
    <div className={'pimg' + (big ? ' big' : '')} style={{ background: p.color || '#F2F2F2' }}>
      {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span className="emoji">{p.emoji || '📦'}</span>}
    </div>
  )
}
