# 💬 API Smartschool — Spécification Complète : Messagerie (Messages)

Ce document répertorie l'intégralité des spécifications techniques, endpoints HTTP, structures de commandes RPC XML, paramètres de recherche et modèles de données associés au module de **messagerie interne** (`Messages`) de Smartschool.

---

## 1. ⚙️ Architecture & Stack Technique

* **Plateforme :** Smartschool (identifiant interne `smsc` / `SMSC`).
* **Architecture frontend interne :** AMD / RequireJS, CanJS 2.3.29 (modèles `can.Map`, templates `stache` / `ejs`), jQuery 1.8+ & jQuery UI, jQuery++ 1.0.1.
* **Architecture backend de communication :**
  1. **Endpoints HTTP Directs (REST / JSON) :** pour les configurations, métadonnées, archivage et modules connexes (Présence, Années scolaires).
  2. **Bus de commandes unifié RPC XML (`Communicator` & `Dispatcher`) :** point d'accès central `POST /?module=Messages&file=dispatcher` transmettant des requêtes XML encapsulées sous le paramètre `command`.

---

## 2. 🌐 Endpoints HTTP Directs (JSON)

| Endpoint | Méthode | Format réponse | Rôle & Utilité | Paramètres attendus |
| :--- | :---: | :---: | :--- | :--- |
| `?module=Messages&file=index&function=getSearchConfig` | `GET` | JSON | Récupère la structure et les options des filtres de recherche (dossiers, champs, périodes). | Aucun |
| `/Messages/Xhr/archivemessages` | `POST` | JSON | Archive en masse un ou plusieurs messages. | `msgIDs[]=<id>` |
| `?module=Messages&file=searchUsers&function=countUsers` | `POST` | JSON | Vérifie le nombre de destinataires et les quotas autorisés avant envoi. | `uniqueUsc=<uscToken>` |
| `?module=Messages&file=download&fileID={fileID}&target=0` | `GET` | Binaire | Téléchargement direct d'une pièce jointe. | Paramètre URL `fileID` |
| `?module=Messages&file=wopi&fileID={fileID}&target=0` | `GET` | HTML/Redirect | Visionneuse Office 365 en ligne (WOPI) pour Word/Excel/PPT. | Paramètre URL `fileID` |
| `/Presence/Main/getSchoolyear` | `POST` | JSON | Récupère les données d'une année scolaire active. | Object générique |
| `/Presence/Pupil/getSchoolyears` | `POST` | JSON | Récupère les années scolaires associées à un élève. | Object générique |
| `/Presence/Main/getSchoolyearFreedays` | `POST` | JSON | Liste des jours fériés / congés scolaires pour les filtres de dates. | `{ date: "YYYY-MM-DD", classID: <groupID> }` |

---

## 3. 📡 Protocole RPC XML Central (`oCommunicator`)

Toutes les actions principales (liste de messages, lecture, suppressions, drapeaux, déplacement, envoi) transitent par l'URL :
```http
POST /?module=Messages&file=dispatcher HTTP/2
Host: <ecole>.smartschool.be
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

Le corps est encodé en URL sous la forme `command=<request>...</request>`.

### Format d'Envoi XML (Support du Batching)
Plusieurs commandes peuvent être empilées dans un seul appel HTTP :

```xml
<request>
	<command>
		<subsystem>postboxes</subsystem>
		<action>show message</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
		</params>
	</command>
</request>
```

### Format de Réponse XML Serveur

```xml
<server>
	<response>
		<status>ok</status>
		<message><![CDATA[]]></message>
		<actions>
			<action>
				<subsystem>message list</subsystem>
				<action>rebuild</action>
				<data>...</data>
			</action>
		</actions>
	</response>
</server>
```

---

## 4. 📁 Dossiers & Compteurs de Messages

### Types de Dossiers (`boxType`)
* `inbox` : Boîte de réception (id standard: `0`)
* `outbox` : Messages envoyés
* `draft` : Brouillons
* `scheduled` : Messages programmés (envoi différé)
* `trash` : Corbeille
* `smartfolder` : Dossiers intelligents (filtres automatiques)
* `smartbox` : Dossiers personnalisés
* `search` : Boîte virtuelle de résultats de recherche

### Calcul des compteurs (`calculate_postbox_counters`)
* **Commande :** `<subsystem>postboxes</subsystem>`, `<action>calculate_postbox_counters</action>`
* **Retour :** Tableau JSON par sous-dossier avec `{ subid: 0, unread: X, total: Y }`.

### Rafraîchissement des non-lus (`reloadunreadmessages`)
* **Commande :** `<subsystem>quickactions</subsystem>`, `<action>reloadunreadmessages</action>`

---

## 5. 📥 Liste des Messages (`message list`)

### Requête

```xml
<command>
	<subsystem>postboxes</subsystem>
	<action>message list</action>
	<params>
		<param name="boxType"><![CDATA[inbox]]></param>
		<param name="boxID"><![CDATA[0]]></param>
		<param name="sortField"><![CDATA[date]]></param>
		<param name="sortKey"><![CDATA[desc]]></param>
		<param name="poll"><![CDATA[false]]></param>
		<param name="poll_ids"><![CDATA[]]></param>
		<param name="layout"><![CDATA[classic]]></param>
	</params>
</command>
```

### Structure des Éléments (`MessageL`)
Dans l'action `rebuild` renvoyée, chaque nœud enfant de `<data>` contient exactement **15 balises ordonnées** :

| Index (`childNodes[n]`) | Champ | Type | Description |
| :---: | :--- | :---: | :--- |
| `0` | **`id`** | `string` | ID unique du message (ex: `"123456"`). |
| `1` | **`from`** | `string` | Nom affiché de l'expéditeur. |
| `2` | **`fromImage`** | `string` | URL complète de la photo de l'expéditeur. |
| `3` | **`subject`** | `string` | Sujet / Objet du message. |
| `4` | **`date`** | `string` | Date formatée (ex: `"Aujourd'hui 09:12"`, `"24.09.26"`). |
| `5` | **`status`** | `string` | Statut de lecture (`"0"` = non lu, `"1"` = lu). |
| `6` | **`attachment`** | `string` | Nombre de pièces jointes (`"0"` si aucune). |
| `7` | **`unread`** | `string` | Indicateur non-lu. |
| `8` | **`label`** | `string` | Flag couleur (`"0"`/`"none"`, `"1"` = vert, `"2"` = jaune, `"3"` = rouge, `"4"` = bleu). |
| `9` | **`deleted`** | `string` | Marqué comme supprimé (`"0"` ou `"1"`). |
| `10` | **`allowReply`** | `string` | Droit de réponse autorisé (`"0"` ou `"1"`). |
| `11` | **`allowreplyenabled`** | `string` | Bouton de réponse activé dans l'interface (`"0"` ou `"1"`). |
| `12` | **`hasReply`** | `string` | Indique si le message a déjà reçu une réponse (`"0"` ou `"1"`). |
| `13` | **`hasForward`** | `string` | Indique si le message a été transféré (`"0"` ou `"1"`). |
| `14` | **`realBox`** | `string` | Nom réel du dossier parent (`"inbox"`, etc.). |

---

## 6. 🔍 Moteur de Recherche Avancée (`search list` & `getSearchConfig`)

### A. Configuration de la recherche (`getSearchConfig`)
Smartschool fournit la structure des filtres via `GET ?module=Messages&file=index&function=getSearchConfig` :

```json
{
  "searchOn": [
    { "value": "subject", "label": "Objet" },
    { "value": "body", "label": "Contenu" },
    { "value": "sender", "label": "Expéditeur" }
  ],
  "searchIn": [
    {
      "value": "inbox",
      "pbvalue": "inbox_system_id",
      "label": "Boîte de réception",
      "selected": false,
      "children": []
    }
  ],
  "searchInPeriod": [
    { "value": "thisYear", "label": "Cette année scolaire" },
    { "value": "choice", "label": "Période personnalisée" }
  ]
}
```

### B. Commande RPC `search list`

```xml
<command>
	<subsystem>postboxes</subsystem>
	<action>search list</action>
	<params>
		<param name="boxType"><![CDATA[search]]></param>
		<param name="boxID"><![CDATA[0]]></param>
		<param name="sortField"><![CDATA[date]]></param>
		<param name="sortKey"><![CDATA[desc]]></param>
		<param name="searchString"><![CDATA[examen de math]]></param>
		<param name="searchWhat"><![CDATA[subject]]></param>
		<param name="searchWhere"><![CDATA[inbox,outbox]]></param>
		<param name="searchPeriod"><![CDATA[choice,2026-09-01,2026-09-26]]></param>
		<param name="layout"><![CDATA[classic]]></param>
	</params>
</command>
```

### C. Règles de Validation & Formats
1. **`searchString` :** Longueur minimale de **3 caractères** requise (`val.length > 2`). En-dessous, la requête est invalidée côté client.
2. **`searchWhat` :** Cible du filtre textuel (`"subject"` par défaut, ou `"body"`, `"sender"`).
3. **`searchWhere` :** Liste des dossiers ciblés. Si un dossier parent est sélectionné, ses enfants (`children`) sont inclus récursivement. Prend la valeur `item.pbvalue` en priorité si elle existe.
4. **`searchPeriod` :**
   * Standard : simple clé (ex: `"thisYear"`).
   * Période personnalisée (`"choice"`) : triplet séparé par des virgules `["choice", "YYYY-MM-DD", "YYYY-MM-DD"]` (`fromDate`, `untilDate`).

---

## 7. 📖 Lecture Détaillée d'un Message (`show message`)

Lorsqu'un message est ouvert, Smartschool envoie un **batch de 3 commandes groupées** dans un seul appel POST si le message n'était pas lu :

```xml
<request>
	<!-- 1. Récupération du corps du message -->
	<command>
		<subsystem>postboxes</subsystem>
		<action>show message</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
			<param name="limitList"><![CDATA[true]]></param>
		</params>
	</command>
	<!-- 2. Récupération des pièces jointes -->
	<command>
		<subsystem>postboxes</subsystem>
		<action>attachment list</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
			<param name="limitList"><![CDATA[true]]></param>
		</params>
	</command>
	<!-- 3. Marquer comme lu -->
	<command>
		<subsystem>postboxes</subsystem>
		<action>mark message read</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
		</params>
	</command>
</request>
```

### Schéma du Message Complet (`MessageR`)
L'action renvoyée contient exactement **23 balises ordonnées** :

| Index | Champ | Type | Description |
| :---: | :--- | :---: | :--- |
| `0` | **`id`** | `string` | ID unique du message. |
| `1` | **`from`** | `string` | Expéditeur complet. |
| `2` | **`to`** | `string` | Destinataire principal. |
| `3` | **`subject`** | `string` | Objet / Sujet du message. |
| `4` | **`date`** | `string` | Date et heure détaillées. |
| `5` | **`body`** | `html` | **Corps complet du message au format HTML riche.** |
| `6` | **`status`** | `string` | Statut de lecture. |
| `7` | **`attachment`** | `string` | Nombre de pièces jointes. |
| `8` | **`unread`** | `string` | Indicateur non-lu. |
| `9` | **`label`** | `string` | Couleur du drapeau (`"0"` à `"4"`). |
| `10` | **`receivers`** | `DOM Element` | Liste des nœuds enfants `<receiver>`. |
| `11` | **`ccreceivers`** | `DOM Element` | Nœuds enfants destinataires en copie (`CC`). |
| `12` | **`bccreceivers`** | `DOM Element` | Nœuds enfants destinataires en copie cachée (`BCC`). |
| `13` | **`userpicture`** | `string` | Hash photo pour générer l'URL de l'avatar. |
| `14` | **`markedInLVS`** | `string` | Lien vers le suivi d'élève (LVS / Livret scolaire). |
| `15` | **`fromOauth`** | `string` | Indique si le message provient d'une auth OAuth externe. |
| `16` | **`otherToReceivers`** | `string` | Nombre de destinataires masqués par limitation. |
| `17` | **`otherCcReceivers`** | `string` | Nombre de destinataires CC masqués. |
| `18` | **`otherBccReceivers`** | `string` | Nombre de destinataires BCC masqués. |
| `19` | **`allowReply`** | `string` | Droit de réponse (`"0"` ou `"1"`). |
| `20` | **`hasReply`** | `string` | Déjà répondu. |
| `21` | **`hasForward`** | `string` | Déjà transféré. |
| `22` | **`sendDate`** | `string` | Date d'envoi programmée (si envoi différé). |

---

## 8. 📎 Pièces Jointes (`attachment list`)

### Structure d'une Pièce Jointe (`Attachment`)
Chaque élément retourné dans `attachment list` comporte **7 attributs** :
1. `fileID` : Identifiant numérique unique du fichier
2. `name` : Nom complet du fichier (ex: `devoir_math.pdf`)
3. `mime` : Type MIME standard (ex: `application/pdf`)
4. `size` : Poids formaté ou taille en octets
5. `icon` : Icône de fichier associée
6. `wopiAllowed` : `1` si le fichier peut être visualisé avec Microsoft Office 365, sinon `0`
7. `order` : Ordre d'affichage

### Téléchargement ZIP Groupé
```xml
<command>
	<subsystem>quickactions</subsystem>
	<action>downloadZip</action>
	<params>
		<param name="msgID"><![CDATA[123456]]></param>
		<param name="boxType"><![CDATA[inbox]]></param>
	</params>
</command>
```

---

## 9. 🛠️ Actions Utilitaires (Drapeaux, Suppression, Déplacement, Corbeille)

| Action désirée | Subsystem | Action | Paramètres nécessaires |
| :--- | :--- | :--- | :--- |
| **Marquer non lu** | `postboxes` | `mark message unread` | `boxType`, `boxID`, `msgID`, `clAction: "status"` |
| **Changer le drapeau (0 à 4)** | `postboxes` | `save msglabel` | `boxType`, `msgLabel` (`0`=aucun, `1`=vert, `2`=jaune, `3`=rouge, `4`=bleu), `msgID`, `clAction: "label"` |
| **Supprimer des messages** | `postboxes` | `delete messages` | `boxType`, `boxID`, `msgID` |
| **Suppression rapide unitaire** | `postboxes` | `quick delete` | `msgID` |
| **Déplacer un message** | `postboxes` | `quickmove messages` | `boxType`, `boxID`, `msgID`, `toBoxType`, `toBoxID` |
| **Vider la corbeille** | `postboxes` | `empty_trash` | Aucun paramètre |

---

## 10. ✍️ Composition & Expédition de Message

### Déroulement de l'envoi :
1. **Réservation de la session :** attribution d'un `draftID`, d'un `uniqueUsc` et d'un répertoire temporaire `randomDir`.
2. **Ajout de pièces jointes temporaires :** téléversement dans `/Upload/?dir={randomDir}&mode=1` et inspection via `listattachments`.
3. **Sélection et vérification des destinataires :** contrôlé par `POST ?module=Messages&file=searchUsers&function=countUsers`.
4. **Expédition finale (`subsystem: draft`, `action: save draft`) :**
   Déclenchée par l'argument `<param name="send"><![CDATA[refresh]]></param>`.

```xml
<request>
	<command>
		<subsystem>draft</subsystem>
		<action>save draft</action>
		<params>
			<param name="draftID"><![CDATA[2456314]]></param>
			<param name="send"><![CDATA[refresh]]></param>
			<param name="origMsgID"><![CDATA[0]]></param>
			<param name="composeAction"><![CDATA[0]]></param>
			<param name="randomDir"><![CDATA[yUvaDIKthC74s6VChAQ3syzfD179042234959885748]]></param>
			<param name="uniqueUsc"><![CDATA[4907e6yNh9rQ92iQpeNEgBBv8SkNw17904223494907]]></param>
			<param name="subject"><![CDATA[test2 (sujet)]]></param>
			<param name="bcc"><![CDATA[0]]></param>
			<param name="composeType"><![CDATA[0]]></param>
			<param name="msgID"><![CDATA[0]]></param>
			<param name="message"><![CDATA[<p>message&nbsp;<br><strong>message en bold</strong></p>]]></param>
			<param name="preload_type"><![CDATA[]]></param>
			<param name="encryptedSender"><![CDATA[f2cf19ee400347bc788c38d6359d9a73]]></param>
			<param name="sendDate"><![CDATA[]]></param>
		</params>
	</command>
</request>
```

---

## 11. 🛡️ Gestion des Erreurs HTTP & Cycle de Session (`$.ajaxSetup`)

Le client Smartschool applique des comportements stricts selon le code d'erreur HTTP retourné :

```javascript
switch(status) {
    case 400:
        // Erreur fonctionnelle ou RPC : le corps contient le message d'erreur utilisateur
        showDialog(lng_rpc_error_title, responseText);
        break;
    case 401:
        // Session expirée : invalidation immédiate et redirection forcée vers le login
        window.location = "/";
        break;
    case 0:
        // Requête annulée / abort (changement rapide de dossier) : ignorée
        break;
    default:
        // Erreur serveur inconnue
        showDialog(lng_rpc_error_title, lng_rpc_error_unknown_msg);
}
```

---

## 12. 🗺️ Cartographie DOM & Sélecteurs Clés

| Sélecteur CSS | Rôle & Usage |
| :--- | :--- |
| `#messageSearchButton` | Bouton d'ouverture de la modale de recherche dans la toolbar. |
| `#smscSearchView` | Conteneur racine injecté pour la boîte de dialogue de recherche. |
| `.message-search__input` | Champ de saisie du terme de recherche (`searchString`). |
| `#search_on_select` | Menu déroulant du champ cible (`searchWhat`). |
| `#search_in_select` | Menu déroulant des dossiers cibles (`searchWhere`). |
| `#search_in_period` | Menu déroulant de la période temporelle (`searchPeriod`). |
| `#date_choice` | Conteneur de dates personnalisées (masqué tant que `"choice"` n'est pas sélectionné). |
| `#search_send` | Bouton d'envoi de la recherche (activé dès que `val.length > 2`). |
| `div.postbox_selected` | Dossier principal actif dans le menu latéral. |
| `div.postboxsub_selected` | Sous-dossier actif dans le menu latéral. |
| `.modern-message` | Ligne d'un message dans la liste. |
| `.modern-message--new` | Classe indiquant un message non-lu. |
| `.modern-message--selected` | Classe indiquant un message sélectionné. |

---

## 13. 📂 Arborescence Serveur Smartschool (`require.config`)

L'organisation des modules et ressources statiques du backend Smartschool :

```text
/
├── includes/
│   └── jQuery/plugins/                   <- oldjqplugins
└── modules/
    ├── IconLib/desktop/ui/iconPopup/amd/ <- iconPopup
    ├── Messages/
    │   ├── models/                       <- Modèles CanJS
    │   └── desktop/messageSearchDialog/  <- Interface de recherche
    └── Presence/models/                  <- Modèles de calendrier et présences
└── smsc/
    ├── resources/
    │   ├── requirejs-jquery/
    │   ├── canjs/2.3.29/amd/
    │   ├── jquerypp/1.0.1/amd/
    │   └── requirejs-jqueryui/
    └── desktop/
        └── ui/                           <- mainui, layout, doubledatepicker
```

---

## 14. 💻 Implémentation Client Universelle TypeScript

```typescript
export interface SmartschoolCommandParam {
  name: string;
  value: string | number;
}

export interface SmartschoolCommand {
  subsystem: string;
  action: string;
  params: SmartschoolCommandParam[];
}

export class SmartschoolMessageCommunicator {
  private dispatcherUrl = '/?module=Messages&file=dispatcher';

  /**
   * Construit la chaîne XML pour une commande
   */
  private buildCommandXml(cmd: SmartschoolCommand): string {
    const paramsXml = cmd.params
      .map(p => {
        const escaped = String(p.value).replace(/]]>/g, ']]]]><![CDATA[>');
        return `\t\t\t<param name="${p.name}"><![CDATA[${escaped}]]></param>`;
      })
      .join('\n');

    return `\t<command>\n\t\t<subsystem>${cmd.subsystem}</subsystem>\n\t\t<action>${cmd.action}</action>\n\t\t<params>\n${paramsXml}\n\t\t</params>\n\t</command>`;
  }

  /**
   * Envoie une ou plusieurs commandes groupées
   */
  public async sendRequest(commands: SmartschoolCommand[]): Promise<Document> {
    const commandsXml = commands.map(c => this.buildCommandXml(c)).join('\n');
    const requestXml = `<request>\n${commandsXml}\n</request>`;

    const formData = new URLSearchParams();
    formData.append('command', requestXml);

    const res = await fetch(this.dispatcherUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData.toString()
    });

    if (res.status === 401) {
      window.location.href = '/';
      throw new Error('Session expirée');
    }

    const responseText = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(responseText, 'text/xml');
  }

  /**
   * Récupère la liste des messages
   */
  public async getMessageList(boxType: 'inbox' | 'outbox' | 'draft' | 'trash' = 'inbox') {
    return this.sendRequest([
      {
        subsystem: 'postboxes',
        action: 'message list',
        params: [
          { name: 'boxType', value: boxType },
          { name: 'boxID', value: 0 },
          { name: 'sortField', value: 'date' },
          { name: 'sortKey', value: 'desc' },
          { name: 'poll', value: 'false' },
          { name: 'poll_ids', value: '' },
          { name: 'layout', value: 'classic' }
        ]
      }
    ]);
  }

  /**
   * Recherche de messages avec filtres
   */
  public async searchMessages(query: string, options: {
    what?: 'subject' | 'body' | 'sender';
    where?: string[];
    period?: string[];
  } = {}) {
    if (query.trim().length < 3) {
      throw new Error('Le terme de recherche doit comporter au moins 3 caractères.');
    }

    const whereList = options.where && options.where.length > 0 ? options.where.join(',') : 'inbox';
    const periodValue = options.period && options.period.length > 0 ? options.period.join(',') : 'thisYear';

    return this.sendRequest([
      {
        subsystem: 'postboxes',
        action: 'search list',
        params: [
          { name: 'boxType', value: 'search' },
          { name: 'boxID', value: 0 },
          { name: 'sortField', value: 'date' },
          { name: 'sortKey', value: 'desc' },
          { name: 'searchString', value: query.trim() },
          { name: 'searchWhat', value: options.what || 'subject' },
          { name: 'searchWhere', value: whereList },
          { name: 'searchPeriod', value: periodValue },
          { name: 'layout', value: 'classic' }
        ]
      }
    ]);
  }
}
```
