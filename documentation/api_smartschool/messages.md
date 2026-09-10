# 💬 API Smartschool — Messagerie

Ce document répertorie les endpoints liés à la messagerie interne de Smartschool (boîte de réception, messages envoyés, lecture de conversation).

---

## 1. Accès au module

- **URL principale :** `GET /messages` ou `GET /main/messages` (à confirmer via F12)
- **Module header :** `smsc-module: messages` (attendu)

---

## 2. Endpoints AJAX à découvrir (F12)

- Liste des conversations / dossiers
- Récupération du fil d'un message avec pièces jointes
- Envoi / Réponse à un message
