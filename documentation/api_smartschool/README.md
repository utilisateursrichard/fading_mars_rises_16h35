# 📡 Répertoire API & Endpoints Smartschool

Ce dossier documente les points d'accès internes (endpoints HTTP, requêtes AJAX, cookies et structures de données) découverts sur la plateforme **Smartschool**.

---

## 1. 🔑 Principes Généraux

| Propriété | Description |
| :--- | :--- |
| **URL de base** | `https://<ecole>.smartschool.be` (ex: `https://jean23.smartschool.be`) |
| **Protocole** | HTTPS / HTTP/2 |
| **Authentification** | Cookies de session (`PHPSESSID`, `smscndc`, `pid`) |
| **En-tête de module** | `smsc-module: <nom_du_module>` (ex: `planner`, `messages`, `results`) |
| **Politique CSP** | `frame-src https://*` & `frame-ancestors https://*` (autorise l'iframe BetterSchool) |
| **Appel client** | Via le pont `fetchSmartschool('/...')` défini dans `src/services/smartschoolBridge.ts` |

---

## 2. 📂 Modules Documentés

| Module | Fichier de doc | Statut | Endpoint principal |
| :--- | :--- | :---: | :--- |
| 📅 **Agenda / Planning** | [`agenda.md`](./agenda.md) | 🟡 En cours | `GET /planner` |
| 👤 **Profil & Établissement** | [`profil.md`](./profil.md) | 🟢 Documenté | `POST /Studentcard/Student/getStudents` |
| 💬 **Messagerie** | [`messages.md`](./messages.md) | 🟡 En cours | `POST /?module=Messages&file=dispatcher` |
| 📊 **Résultats (Skore)** | [`resultats.md`](./resultats.md) | 🟢 Documenté | `GET /results/api/v1/evaluations/` |
| 📚 **Espace Cours** | [`cours.md`](./cours.md) | ⚪ À documenter | `GET /courses` |

---

## 3. 🔍 Méthode pour capturer de nouvelles routes

1. Ouvrir Smartschool sur Chrome (<kbd>F12</kbd> > onglet **Réseau / Network**).
2. Cocher **Fetch/XHR** et **Doc** pour filtrer les requêtes utiles.
3. Cliquer sur l'action souhaitée (ex: changer de semaine dans l'agenda, ouvrir un devoir, lire un message).
4. Faire un clic droit sur la requête > *Copy* > *Copy as cURL* ou copier l'en-tête et la réponse JSON.
5. Ajouter la spécification dans le fichier correspondant dans ce dossier.
