# YB — document de passation

Boutique en ligne pour revendre au détail des articles Amazon achetés en lots (surplus, retours, fins de série).
Ce document explique où en est le projet pour que tu puisses continuer.

---

## 1. État actuel

| Élément | État |
|---|---|
| Accueil (style Apple 2014 : hero, catégories, coups de cœur) | ✅ fait |
| Boutique (grille + filtres catégorie / prix / état / stock, recherche, tri) | ✅ fait |
| Favoris (sauvegardés dans le navigateur) | ✅ fait |
| Panier (tiroir latéral, barre livraison gratuite, économie vs Amazon) | ✅ fait |
| Paiement Stripe Checkout | ✅ codé, **clé Stripe à ajouter** |
| Page merci + confirmation de paiement + baisse du stock | ✅ fait |
| Admin (ajout / modif / suppression d'articles, liste des commandes, stats) | ✅ fait |
| Page Livraison & retours | ✅ fait |
| Logo (SVG) | ✅ fait |
| Version cellulaire | ✅ testée (375 px) |
| Vraies photos de produits | ❌ à faire (emojis en attendant) |
| Mise en ligne + nom de domaine | ❌ à faire |
| Courriel / texto au propriétaire à chaque commande | ❌ à faire |

Les 16 produits dans `data/products.json` sont des **exemples** à remplacer.

---

## 2. Démarrer en local

Prérequis : Node 20+ (testé avec Node 24).

```bash
npm install
cp .env.example .env      # puis remplir les valeurs
npm run dev
```

- Site : http://localhost:5180
- API : http://localhost:4242 (Vite redirige `/api/*` vers l'API)

### Variables `.env`

| Variable | Rôle |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_test_...` pour tester, `sk_live_...` en prod). Vide = paiement désactivé, le panier affiche un message. |
| `STRIPE_WEBHOOK_SECRET` | Optionnel. Secret du webhook Stripe (`whsec_...`). |
| `ADMIN_PASSWORD` | Mot de passe de la page `#/admin`. **À choisir** (le `.env` n'est pas inclus dans l'envoi). |
| `PUBLIC_URL` | URL publique du site en production (sert pour les liens de retour Stripe). |

### Tester un paiement
1. Compte gratuit sur https://dashboard.stripe.com → mode Test → Développeurs → Clés API.
2. Mettre la clé `sk_test_...` dans `.env`, relancer `npm run dev`.
3. Ajouter un article au panier → « Payer maintenant ».
4. Carte `4242 4242 4242 4242`, date future, n'importe quel CVC / code postal.
5. Retour sur `#/merci` → la commande apparaît dans l'admin et le stock baisse.

---

## 3. Stack et architecture

- **Front** : Vite + React 19, sans routeur externe (routing par hash : `#/`, `#/boutique`, `#/favoris`, `#/aide`, `#/admin`, `#/merci`).
- **Back** : Express (`server.js`), un seul fichier.
- **Paiement** : Stripe Checkout (page de paiement hébergée par Stripe → pas de données de carte sur notre serveur).
- **Données** : fichiers JSON dans `data/` (pas de base de données pour l'instant).
- **Polices** : Jost (titres, style Futura) + Inter (texte), via Google Fonts.

```
arrivage/
├── server.js            API + Stripe + admin + sert dist/ en production
├── data/
│   ├── products.json    catalogue
│   └── orders.json      commandes payées
├── public/
│   ├── logo.svg         logo complet (icône + nom + slogan)
│   └── logo-mark.svg    icône seule (favicon)
├── src/
│   ├── main.jsx         point d'entrée
│   ├── App.jsx          nav du haut, routing, état du panier/favoris, pied de page
│   ├── Home.jsx         accueil : hero carrousel, tuiles catégories, trio coups de cœur
│   ├── Shop.jsx         boutique + favoris : filtres, tri, grille produits
│   ├── Cart.jsx         tiroir panier + appel /api/checkout
│   ├── Merci.jsx        confirmation après paiement
│   ├── Aide.jsx         livraison, retours, FAQ
│   ├── Admin.jsx        tableau de bord, CRUD produits, commandes
│   ├── lib.jsx          helpers : format $, % rabais, icônes SVG, image produit, hooks
│   └── styles.css       tout le CSS (variables en haut, mobile en bas)
├── index.html
├── vite.config.js
├── .env.example
└── README.md
```

### Format d'un produit (`data/products.json`)
```json
{
  "id": "p01",
  "name": "Écouteurs sans fil ANC",
  "description": "Réduction de bruit active, 30 h d'autonomie.",
  "category": "Électronique",
  "condition": "Neuf boîte ouverte",   // Neuf scellé | Neuf boîte ouverte | Retour testé
  "price": 39.99,                     // notre prix, CAD
  "amazonPrice": 89.99,               // prix Amazon pour la comparaison (-X %)
  "stock": 14,
  "emoji": "🎧",                      // affiché si pas de photo
  "color": "#E8EEF9",                 // fond de la vignette
  "image": ""                         // URL de photo (prioritaire sur l'emoji)
}
```

### Routes API
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/products` | liste des produits |
| GET | `/api/config` | `stripeReady`, seuil livraison gratuite, prix livraison |
| POST | `/api/checkout` | `{ items: [{id, qty}] }` → crée une session Stripe, renvoie `{ url }` |
| GET | `/api/order/:sessionId` | vérifie le paiement, enregistre la commande (idempotent) |
| POST | `/api/webhook` | webhook Stripe `checkout.session.completed` (optionnel) |
| GET | `/api/admin/orders` | commandes (header `x-admin-password`) |
| POST / PUT / DELETE | `/api/admin/products[/:id]` | gestion du catalogue (header `x-admin-password`) |

### Règles importantes dans le code
- **Les prix sont toujours recalculés côté serveur** à partir de `products.json`. On ne fait jamais confiance au prix envoyé par le navigateur.
- Le stock est vérifié avant le paiement (erreur 409 si insuffisant) et décrémenté après paiement.
- `recordOrder()` est idempotent : la commande est enregistrée une seule fois, qu'elle arrive par le webhook ou par la page merci.
- Livraison : 12,99 $ fixe, gratuite dès 75 $ (constantes `SHIPPING_FLAT` et `FREE_SHIPPING_FROM` dans `server.js`). Canada seulement.
- Taxes : pas encore gérées (voir « À faire »).

---

## 4. Direction artistique

- **Accueil et pages d'info** : inspiré de la page Apple Watch de 2014. Fond blanc/gris clair, beaucoup d'espace, nav centrée en haut, titres en majuscules avec **premier mot gras + reste léger** (classe `.ttl` + `<b>`), pied de page gris foncé.
- **Boutique** : inspirée d'un dashboard e-commerce (Shoplytic) : filtres à gauche, grille de cartes produits.
- **Couleur d'accent** : orange `#FF7A00` (logo, boutons, badges de rabais).
- Toutes les couleurs sont des variables CSS en haut de `src/styles.css`.
- Mobile : menu hamburger, filtres dans un tiroir, grille en 2 colonnes.

---

## 5. À faire (par priorité)

1. **Clé Stripe** et test d'un vrai paiement, puis activer le compte Stripe (infos bancaires) pour passer en `sk_live_`.
2. **Vraies photos** : champ `image` dans l'admin (URL). Idéalement ajouter un upload (Supabase Storage, Cloudinary…). ⚠️ Ne pas utiliser les photos d'Amazon (droits d'auteur).
3. **Taxes** : TPS/TVQ (Québec) → activer `automatic_tax` de Stripe Tax ou ajouter des `tax_rates` dans la session Checkout.
4. **Mise en ligne** : `npm run build` puis `npm start` sur un hébergeur Node (Render, Railway, Fly.io). ⚠️ Les fichiers JSON ne survivent pas aux redéploiements sur la plupart des hébergeurs → migrer vers une base de données (Supabase recommandé, déjà utilisé sur un autre projet du proprio) **avant** la vraie mise en ligne.
5. **Webhook Stripe** en production (URL `https://domaine/api/webhook`, événement `checkout.session.completed`).
6. **Notification au propriétaire** à chaque commande (courriel via Resend, ou texto).
7. **Nom de domaine** (ex. yb.ca) + mettre à jour `PUBLIC_URL` et le courriel de contact (`bonjour@yb.ca` est un placeholder dans `App.jsx` et `Aide.jsx`).
8. Plus tard : page détail produit, gestion des statuts de commande (expédiée, numéro de suivi), codes promo (Stripe les gère avec `allow_promotion_codes: true`).

---

## 6. Points légaux à garder en tête

- Acheter des lots Amazon (surplus / retours) et les revendre = OK. Faire du **dropshipping depuis Amazon** (commander sur Amazon après la vente) est interdit par les conditions d'Amazon.
- Le pied de page précise que YB **n'est pas affilié à Amazon** et que le « prix Amazon » est un prix observé à titre de comparaison. Garder cette mention.
- Politique de retour de 14 jours affichée sur la page Aide : à confirmer avec le propriétaire.
