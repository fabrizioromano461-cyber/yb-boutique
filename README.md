# YB — boutique en ligne (lots Amazon)

## Démarrer
    npm install
    npm run dev        # site : http://localhost:5180  ·  API : http://localhost:4242

## Activer les paiements Stripe
1. Crée un compte sur https://dashboard.stripe.com (gratuit)
2. Mode TEST → Développeurs → Clés API → copie la clé secrète `sk_test_...`
3. Colle-la dans `.env` : `STRIPE_SECRET_KEY=sk_test_...`
4. Relance `npm run dev`. Carte de test : 4242 4242 4242 4242, date future, CVC quelconque.
5. Pour vendre pour vrai : active ton compte Stripe et remplace par la clé `sk_live_...`.

## Admin
Page `#/admin` — mot de passe = `ADMIN_PASSWORD` dans `.env`.
Ajouter/modifier les articles (prix, prix Amazon, stock, photo), voir les commandes.

## Fichiers
- `data/products.json` : catalogue · `data/orders.json` : commandes payées
- `server.js` : API + Stripe Checkout (les prix sont toujours recalculés côté serveur)
- `public/logo.svg`, `public/logo-mark.svg` : logo

## Mise en ligne
`npm run build` puis `npm start` sur un hébergeur Node (Render, Railway, Fly.io).
Définis les variables de `.env` sur l'hébergeur + `PUBLIC_URL=https://ton-domaine`.
