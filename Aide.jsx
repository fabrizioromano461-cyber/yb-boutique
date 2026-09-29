import { Icon } from './lib.jsx'

export default function Aide({ config }) {
  const faq = [
    ['truck', 'LIVRAISON', `Partout au Canada en 3 à 7 jours ouvrables. ${config.shipping.toFixed(2).replace('.', ',')} $ par commande, gratuite dès ${config.freeShippingFrom} $.`],
    ['box', "D'OÙ VIENNENT", "Nos articles sont des surplus, des fins de série et des retours Amazon achetés en lots. On les inspecte un par un avant de les mettre en vente."],
    ['check', 'LES ÉTATS', "Neuf scellé : jamais ouvert. Neuf boîte ouverte : emballage ouvert, article jamais utilisé. Retour testé : retourné par un client, testé et fonctionnel."],
    ['left', 'RETOURS', "Tu as 14 jours après la réception pour nous retourner un article non conforme à sa description. Écris-nous avec ton numéro de commande."],
    ['lock', 'PAIEMENT', 'Le paiement est traité par Stripe. On ne voit ni ne conserve jamais ton numéro de carte. Visa, Mastercard, Amex, Apple Pay et Google Pay acceptés.'],
    ['help', 'CONTACT', 'bonjour@yb.ca — réponse en moins de 24 h, du lundi au samedi.'],
  ]
  return (
    <section className="aide">
      <h1 className="ttl big"><b>LIVRAISON</b> & RETOURS</h1>
      <div className="faq">
        {faq.map(([ic, t, d]) => (
          <div key={t} className="fitem">
            <Icon n={ic} s={24} />
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
