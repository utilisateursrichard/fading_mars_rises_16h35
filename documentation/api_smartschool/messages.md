# 💬 API Smartschool — Spécification Exhaustive : Messagerie (Messages)

Ce document répertorie l'intégralité des spécifications techniques, endpoints HTTP, structures de commandes RPC XML, paramètres de soumission, règles de validation et modèles de données associés au module de **messagerie interne** (`Messages`) de Smartschool.

---

## 1. ⚙️ Architecture & Stack Technique

* **Plateforme :** Smartschool (identifiant interne `smsc` / `SMSC`).
* **Architecture frontend client :** AMD / RequireJS, CanJS 2.3.29 (modèles `can.Map`, templates `stache` / `ejs`), jQuery 1.8+ & jQuery UI, jQuery++ 1.0.1.
* **Architecture backend de communication :**
  1. **Endpoints HTTP Directs (REST / JSON) :** pour les configurations, métadonnées, archivage et modules connexes (Présence, Années scolaires).
  2. **Bus de commandes unifié RPC XML (`Communicator` & `Dispatcher`) :** point d'accès central `POST /?module=Messages&file=dispatcher` transmettant des requêtes XML encapsulées sous le paramètre `command`.
  3. **Soumission de formulaire standard :** `POST /?module=Messages&file=composeMessage` pour la création/expédition de messages.

---

## 2. 🌐 Endpoints HTTP Directs

| Endpoint | Méthode | Format réponse | Rôle & Utilité | Paramètres attendus |
| :--- | :---: | :---: | :--- | :--- |
| `?module=Messages&file=index&function=getSearchConfig` | `GET` | JSON | Récupère la structure et les options des filtres de recherche (dossiers, champs, périodes). | Aucun |
| `?module=Messages&file=searchUsers` | `POST` | XML | Autocomplétion et recherche de destinataires (élèves, enseignants, classes). | `val`, `type`, `parentNodeId`, `xml`, `uniqueUsc` |
| `?module=Messages&file=searchUsers&function=countUsers` | `POST` | JSON | Vérifie le nombre de destinataires et les quotas autorisés avant envoi. | `uniqueUsc=<uscToken>` |
| `/Messages/Xhr/archivemessages` | `POST` | JSON | Archive en masse un ou plusieurs messages. | `msgIDs[]=<id>` |
| `?module=Messages&file=download&fileID={fileID}&target=0` | `GET` | Binaire | Téléchargement direct d'une pièce jointe. | Paramètre URL `fileID` |
| `?module=Messages&file=wopi&fileID={fileID}&target=0` | `GET` | HTML/Redirect | Visionneuse Office 365 en ligne (WOPI) pour Word/Excel/PPT. | Paramètre URL `fileID` |
| `/Presence/Main/getSchoolyear` | `POST` | JSON | Récupère les données d'une année scolaire active. | Object générique |
| `/Presence/Pupil/getSchoolyears` | `POST` | JSON | Récupère les années scolaires associées à un élève. | Object générique |
| `/Presence/Main/getSchoolyearFreedays` | `POST` | JSON | Liste des jours fériés / congés scolaires pour les filtres de dates. | `{ date: "YYYY-MM-DD", classID: <groupID> }` |

---

## 3. 📡 Protocole RPC XML Central (`Communicator` & `Dispatcher`)

Toutes les actions principales (liste de messages, lecture, suppressions, drapeaux, déplacement, compteurs, envoi) transitent par l'URL centrale :
```http
POST /?module=Messages&file=dispatcher HTTP/2
Host: <ecole>.smartschool.be
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

Le corps est encodé en formulaire standard sous la clé unique `command` :
```text
command=<request><command>...</command></request>
```

### A. Échappement des caractères CDATA
Le moteur interne Smartschool applique une règle spécifique pour les caractères d'échappement CDATA :
```javascript
// Règle d'échappement Smartschool pour les valeurs de paramètres :
value = value.replace(/]]>/g, "]]><![CDATA[]]]]><![CDATA[>]]><![CDATA[");
```

### B. Format d'Envoi XML (Support du Batching)
Plusieurs commandes peuvent être empilées dans un seul appel HTTP `<request>` :
```xml
<request>
	<!-- Commande 1 : Affichage du message -->
	<command>
		<subsystem>postboxes</subsystem>
		<action>show message</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
			<param name="limitList"><![CDATA[true]]></param>
		</params>
	</command>
	<!-- Commande 2 : Récupération des pièces jointes -->
	<command>
		<subsystem>postboxes</subsystem>
		<action>attachment list</action>
		<params>
			<param name="msgID"><![CDATA[123456]]></param>
			<param name="boxType"><![CDATA[inbox]]></param>
		</params>
	</command>
</request>
```

### C. Format de Réponse XML Serveur
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

### D. Table de Routage Interne (`window.oDispatcher`)
Lors de la réception de la réponse, le `Dispatcher` Smartschool achemine l'action vers l'objet JavaScript responsable :

| Subsystem dans la réponse | Objet JavaScript Gestionnaire |
| :--- | :--- |
| `message list` | `window.oMessageList.handleAction(action, data)` |
| `show message` | `window.oMessageRead.handleAction(action, data)` |
| `show attachments` | `window.oAttachmentList.handleAction(action, data)` |
| `draft` | `window.oDraft.handleAction(action, data)` |
| `triggers` | `window.oTriggers.handleAction(action, data)` |
| `postboxform` | `window.oPostboxForm.handleAction(action, data)` |
| `smartfolder` | `window.oSmartFolder.handleAction(action, data)` |
| `messagerule` | `window.oMessageRule.handleAction(action, data)` |
| `properties form` | `window.oPropertiesForm.handleAction(action, data)` |
| `info popup` | `window.oInfoPopup.handleAction(action, data)` |
| `favorites` | `window.oFavorites.handleAction(action, data)` |
| `file list` | `window.oFileList.handleAction(action, data)` |

---

## 4. 🚀 Envoi de Message & Gestion des Brouillons (Spécification Précise)

### A. Différence Cruciale : Brouillon (`refresh`) vs Envoi Réel (`send`)

Dans le moteur Smartschool, la même commande RPC `<subsystem>draft</subsystem><action>save draft</action>` est utilisée à la fois pour l'enregistrement automatique du brouillon et pour l'envoi définitif.

> [!IMPORTANT]
> **Le comportement dépend intégralement de la valeur du paramètre `send` :**
> * **`send: "refresh"`** : **Enregistrement de brouillon uniquement** (déclenché automatiquement toutes les quelques secondes par `oDraft`). Ne délivre pas le message aux destinataires. Si le sujet et le corps sont vides, Smartschool retourne l'action `draftnotsavedempty`.
> * **`send: "send"`** : **Envoi effectif du message** (déclenché lors du clic sur le bouton "Envoyer" via `CheckForm()`). Le serveur valide les destinataires, transfère le message dans la boîte d'envoi (`outbox`), décrémente le compteur de brouillons et notifie les destinataires.

### B. Validation Client Smartschool (`CheckForm`)
Avant d'envoyer le message, la fonction cliente `CheckForm()` effectue les contrôles stricts suivants :
1. **Contrôle des destinataires (`checkReceivers`) :** Vérifie qu'au moins un destinataire est spécifié dans l'un des 6 types de listes :
   * `to` (`receiverPart0`) : Destinataires principaux (élèves, professeurs, personnel).
   * `toco` (`receiverPart1`) : Co-comptes des destinataires principaux (parents / tuteurs).
   * `tocc` (`receiverPart2`) : Destinataires en copie (`CC`).
   * `tobcc` (`receiverPart3`) : Destinataires en copie cachée (`BCC`).
   * `toccco` (`receiverPart4`) : Co-comptes des destinataires en copie (`CC`).
   * `tobccco` (`receiverPart5`) : Co-comptes des destinataires en copie cachée (`BCC`).
2. **Contrôle de l'objet (`checkStringLength("subject", 1)`) :** L'objet ne peut pas être vide (au moins 1 caractère requis).
3. **Comportement de soumission :**
   * Désactive le bouton d'envoi (`#submitbtn`).
   * Désactive l'auto-sauvegarde (`oDraft.disableSaving()`).
   * Affiche l'indicateur de chargement (`#sendLoading`).
   * Renseigne `document.form.send.value = "send"`.
   * Soumet le formulaire (`document.form.submit()`).

### C. Structure de la Commande RPC d'Envoi Définitif
```xml
<request>
	<command>
		<subsystem>draft</subsystem>
		<action>save draft</action>
		<params>
			<param name="draftID"><![CDATA[0]]></param>
			<param name="send"><![CDATA[send]]></param> <!-- 👈 "send" = envoi effectif -->
			<param name="origMsgID"><![CDATA[0]]></param> <!-- ID du message source si réponse/transfert -->
			<param name="composeAction"><![CDATA[0]]></param>
			<param name="randomDir"><![CDATA[FWaCpQ8tr5UkvHzJ3n5XNALwc179042447546265748]]></param>
			<param name="uniqueUsc"><![CDATA[4907sWCVC7Hj25ktf8UZCcSsEzh6e17904244754907]]></param>
			<param name="to"><![CDATA[5748,5749]]></param> <!-- IDs séparés par des virgules -->
			<param name="to_users"><![CDATA[5748,5749]]></param>
			<param name="subject"><![CDATA[Objet du message]]></param>
			<param name="bcc"><![CDATA[0]]></param>
			<param name="composeType"><![CDATA[0]]></param>
			<param name="msgID"><![CDATA[0]]></param>
			<param name="message"><![CDATA[<p>Contenu HTML riche du message</p>]]></param>
			<param name="preload_type"><![CDATA[]]></param>
			<param name="encryptedSender"><![CDATA[f2cf19ee400347bc788c38d6359d9a73]]></param>
			<param name="sendDate"><![CDATA[]]></param> <!-- Optionnel : date si envoi programmé -->
		</params>
	</command>
</request>
```

### D. Soumission HTTP Parallèle du Formulaire (`composeMessage`)
En complément du flux RPC, Smartschool utilise le endpoint Same-Origin :
```http
POST /?module=Messages&file=composeMessage HTTP/2
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

Avec les paramètres du formulaire :
* `send=send`
* `subject=<objet>`
* `message=<html_du_message>`
* `uniqueUsc=<uniqueUsc>`
* `randomDir=<randomDir>`
* `draftID=0`
* `msgID=0`
* `origMsgID=<origMsgId>`
* `to=<id1,id2>`
* `to[]=<id1>`
* `to[]=<id2>`

---

## 5. ⚡ Compteurs & Messages Non-Lus en Temps Réel

> [!WARNING]
> **Interdiction du Cache Local pour les Non-Lus en Mode Réel :**
> En mode direct avec Smartschool, le nombre de messages non lus ne doit **jamais** dépendre du `localStorage` (source de désynchronisation). Il doit toujours être interrogé directement via les mécanismes natifs de Smartschool.

Smartschool utilise **deux canaux officiels** pour obtenir le compte exact des messages non-lus :

### Canal 1 : Commande RPC `reloadunreadmessages`
```xml
<command>
	<subsystem>quickactions</subsystem>
	<action>reloadunreadmessages</action>
	<params></params>
</command>
```

#### Réponse du Serveur :
```xml
<action>
	<subsystem>triggers</subsystem>
	<command>reloadunreadmessagesdone</command>
	<data><![CDATA[{"0":3,"sub_1":0}]]></data>
</action>
```

* `data` contient un objet JSON où `"0"` représente la boîte de réception principale (`inbox`).
* Le client Smartschool traite la réponse avec l'algorithme :
  ```javascript
  reloadUnreadMessagesDone = function(data) {
      data = eval("(" + getData(data.childNodes[0]) + ")");
      for (i in data) {
          "0" == data[i] 
              ? $("#inbox_" + i + "_unread").html("") 
              : $("#inbox_" + i + "_unread").html(data[i]);
      }
  };
  ```

### Canal 2 : Inspection Directe du DOM Hôte
Dans la barre de navigation supérieure de Smartschool, le badge de non-lus est rendu dans :
* `.topnav__badge`
* `#bot_unread_counter`
* `#inbox_0_unread`
* `.js-btn-messages .badge`
* `[data-unread-count]`

---

## 6. 📑 Répertoire Exhaustif des Commandes RPC (`buildCommand`)

Le client Smartschool (`messages.js`) implémente **43 commandes RPC** distribuées sur 6 sous-systèmes :

### A. Sous-système `postboxes` (Gestion des Boîtes et Messages)

| Action | Paramètres clés | Rôle |
| :--- | :--- | :--- |
| `message list` | `boxType`, `boxID`, `sortField`, `sortKey`, `poll`, `poll_ids`, `layout` | Charge la liste des messages (supporte le polling incrémental). |
| `show message` | `msgID`, `boxType`, `limitList`, `limitListNr` | Charge le contenu complet HTML d'un message. |
| `attachment list` | `msgID`, `boxType`, `limitList` | Récupère la liste des pièces jointes associées à un message. |
| `mark message read` | `msgID`, `boxType` | Marque le message comme lu. |
| `mark message unread` | `boxType`, `boxID`, `msgID`, `clAction: "status"` | Marque le message comme non-lu. |
| `save msglabel` | `boxType`, `msgLabel` (`0`=aucun, `1`=vert, `2`=jaune, `3`=rouge, `4`=bleu), `msgID`, `clAction: "label"` | Associe un drapeau couleur à un message. |
| `delete messages` | `boxType`, `boxID`, `msgID` | Supprime un ou plusieurs messages sélectionnés. |
| `quick delete` | `msgID` | Suppression rapide d'un message individuel. |
| `quickmove messages` | `boxType`, `boxID`, `msgID`, `toBoxType`, `toBoxID` | Déplace des messages vers un autre dossier. |
| `empty_trash` | Aucun | Vide intégralement la corbeille. |
| `calculate_postbox_counters` | Aucun | Calcule les totaux et non-lus de tous les dossiers. |
| `continue_messages` | `boxType`, `boxID`, `start`, `limit` | Pagination infinie au défilement vers le bas. |
| `search list` | `boxType: "search"`, `searchString`, `searchWhat`, `searchWhere`, `searchPeriod`, `sortField`, `sortKey`, `layout` | Exécute une recherche multicritères. |
| `loadtooltip` | `boxType`, `boxID` | Charge les informations contextuelles au survol d'un dossier. |
| `reload_full_tree` | Aucun | Recharge l'arborescence complète des dossiers. |
| `addbox` / `editbox` / `delete postbox` / `save postbox` | `boxName`, `boxID`, `parentID` | Gestion des dossiers personnalisés. |
| `smartbox list` | Aucun | Liste les dossiers virtuels personnalisés. |
| `smartfolder list` | Aucun | Liste les dossiers intelligents. |

### B. Sous-système `draft` (Brouillons & Envois)

| Action | Paramètres clés | Rôle |
| :--- | :--- | :--- |
| `save draft` | `draftID`, `send` (`"send"` ou `"refresh"`), `to`, `to_users`, `subject`, `message`, `randomDir`, `uniqueUsc`, `encryptedSender`, `origMsgID` | Enregistre un brouillon (`refresh`) ou expédie le message (`send`). |

### C. Sous-système `quickactions` (Actions Rapides)

| Action | Paramètres clés | Rôle & Action retournée |
| :--- | :--- | :--- |
| `reloadunreadmessages` | Aucun | Rafraîchit les compteurs non-lus (`reloadunreadmessagesdone`). |
| `nrrecipients` | `uniqueUsc` | Calcule le nombre d'élèves et d'adultes destinataires (`listnrrecipients`). |
| `clearusers` | Aucun | Vide la sélection des destinataires en cours (`clearusersdone`). |
| `listattachments` | Aucun | Liste les fichiers téléversés dans la zone de composition. |
| `deleteattachments` | `randomDir`, `fileID` | Supprime une pièce jointe attachée au brouillon en cours. |
| `downloadZip` | `msgID`, `boxType` | Génère une archive ZIP de toutes les pièces jointes (`downloadZipDone`). |
| `tomydoc` | `fileID` | Copie une pièce jointe vers l'espace personnel "Mes Documents" (`saveattachtomydocsuccess` / `saveattachtomydocfailed`). |

### D. Sous-système `smartfolder` (Dossiers Intelligents)

| Action | Rôle |
| :--- | :--- |
| `list smartfolders` / `list smartfolderrules` | Liste les dossiers et leurs règles de filtrage. |
| `addsmartfolder` / `deletesmartfolder` / `savesmartfoldername` | Création, suppression et renommage de dossier intelligent. |
| `addsmartfolderrule` / `deletesmartfolderrule` / `saveruleline` | Ajout et édition des critères de filtrage. |
| `changesmartfolderruleline` / `changesmartfoldersearchoption` | Modification des opérateurs de recherche. |
| `addtreefolder` / `showaddtreefolder` / `showmanagefromtree` | Gestion dans l'arborescence latérale. |

### E. Sous-système `smartbox` & `maintenance`

| Commande | Rôle |
| :--- | :--- |
| `smartbox` -> `addtreefolder` | Ajout d'un dossier personnalisé dans l'arbre. |
| `maintenance` -> `save postbox` | Persistance des réglages de boîte aux lettres. |

---

## 7. 📥 Modèle de Données : Liste des Messages (`MessageL`)

Dans la réponse de la commande `message list`, chaque nœud contient **exactement 15 balises enfants ordonnées** :

| Index (`childNodes[n]`) | Propriété | Type | Signification |
| :---: | :--- | :---: | :--- |
| `0` | **`id`** | `string` | Identifiant unique du message (ex: `"123456"`). |
| `1` | **`from`** | `string` | Nom d'affichage de l'expéditeur. |
| `2` | **`fromImage`** | `string` | URL directe de la photo de profil de l'expéditeur. |
| `3` | **`subject`** | `string` | Objet / Sujet du message. |
| `4` | **`date`** | `string` | Date formatée (ex: `"Aujourd'hui 09:12"`, `"24.09.26"`). |
| `5` | **`status`** | `string` | Statut de lecture (`"0"` = non lu, `"1"` = lu). |
| `6` | **`attachment`** | `string` | Nombre de pièces jointes (`"0"` si aucune). |
| `7` | **`unread`** | `string` | Indicateur booléen non-lu. |
| `8` | **`label`** | `string` | Drapeau couleur (`"0"` = aucun, `"1"` = vert, `"2"` = jaune, `"3"` = rouge, `"4"` = bleu). |
| `9` | **`deleted`** | `string` | Indicateur de suppression (`"0"` ou `"1"`). |
| `10` | **`allowReply`** | `string` | Droit de réponse autorisé pour l'utilisateur (`"0"` ou `"1"`). |
| `11` | **`allowreplyenabled`** | `string` | Bouton de réponse actif dans l'UI (`"0"` ou `"1"`). |
| `12` | **`hasReply`** | `string` | Indique si le message a déjà reçu une réponse (`"0"` ou `"1"`). |
| `13` | **`hasForward`** | `string` | Indique si le message a été transféré (`"0"` ou `"1"`). |
| `14` | **`realBox`** | `string` | Dossier physique réel (`"inbox"`, `"outbox"`, etc.). |

---

## 8. 📖 Modèle de Données : Lecture Détaillée (`MessageR`)

Dans la réponse de la commande `show message`, chaque message comporte **exactement 23 balises enfants ordonnées** :

| Index | Propriété | Type | Signification |
| :---: | :--- | :---: | :--- |
| `0` | **`id`** | `string` | ID unique du message. |
| `1` | **`from`** | `string` | Expéditeur complet. |
| `2` | **`to`** | `string` | Destinataire principal affiché. |
| `3` | **`subject`** | `string` | Objet / Sujet. |
| `4` | **`date`** | `string` | Date et heure détaillées. |
| `5` | **`body`** | `html` | **Corps complet du message (HTML riche).** |
| `6` | **`status`** | `string` | Statut de lecture. |
| `7` | **`attachment`** | `string` | Nombre de pièces jointes. |
| `8` | **`unread`** | `string` | Indicateur non-lu. |
| `9` | **`label`** | `string` | Couleur du drapeau (`"0"` à `"4"`). |
| `10` | **`receivers`** | `DOM Element` | Nœuds enfants `<receiver>` contenant les destinataires principaux. |
| `11` | **`ccreceivers`** | `DOM Element` | Destinataires en copie (`CC`). |
| `12` | **`bccreceivers`** | `DOM Element` | Destinataires en copie cachée (`BCC`). |
| `13` | **`userpicture`** | `string` | Hash photo pour générer l'URL de l'avatar. |
| `14` | **`markedInLVS`** | `string` | Lien vers le suivi d'élève (LVS / Livret scolaire). |
| `15` | **`fromOauth`** | `string` | Message issu d'une intégration OAuth tierce. |
| `16` | **`otherToReceivers`** | `string` | Nombre de destinataires principaux masqués par quota. |
| `17` | **`otherCcReceivers`** | `string` | Nombre de destinataires CC masqués. |
| `18` | **`otherBccReceivers`** | `string` | Nombre de destinataires BCC masqués. |
| `19` | **`allowReply`** | `string` | Autorisation de réponse (`"0"` ou `"1"`). |
| `20` | **`hasReply`** | `string` | A déjà reçu une réponse. |
| `21` | **`hasForward`** | `string` | A déjà été transféré. |
| `22` | **`sendDate`** | `string` | Date d'envoi programmée (si envoi différé). |

---

## 9. 📎 Structure d'une Pièce Jointe (`Attachment`)

Chaque élément renvoyé par la commande `attachment list` comporte **7 attributs** :

1. **`fileID`** : Identifiant numérique unique du fichier.
2. **`name`** : Nom complet du fichier avec extension (ex: `cours_chimie.pdf`).
3. **`mime`** : Type MIME standard (ex: `application/pdf`, `image/png`).
4. **`size`** : Poids formaté (ex: `1.4 Mo`) ou taille brute en octets.
5. **`icon`** : Nom de l'icône de ressource Smartschool.
6. **`wopiAllowed`** : `"1"` si visualisable via Office 365 en ligne (WOPI), sinon `"0"`.
7. **`order`** : Ordre d'affichage dans la liste.

---

## 10. 🔄 Mécanisme de Polling Client (`pollNewMessages`)

Smartschool intègre un mécanisme d'actualisation en arrière-plan :
* **Fréquence :** Toutes les 5 minutes (`300 000 ms` via `setTimeout`).
* **Optimisation différentielle :** Le client transmet `poll=true` et `poll_ids=<id1,id2,...>`.
* Le serveur ne retourne alors que les messages récents ou modifiés, évitant de recharger l'ensemble de la boîte aux lettres.

---

## 11. 💻 Client TypeScript de Référence

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
   * Construit la chaîne XML pour une commande selon les règles d'échappement Smartschool
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
   * Envoie une ou plusieurs commandes groupées (batching)
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
   * Rafraîchissement direct des compteurs non-lus (sans cache)
   */
  public async reloadUnreadMessages(): Promise<number> {
    const doc = await this.sendRequest([
      { subsystem: 'quickactions', action: 'reloadunreadmessages', params: [] }
    ]);
    const actionNodes = doc.querySelectorAll('actions > action');
    for (let i = 0; i < actionNodes.length; i++) {
      const act = actionNodes[i];
      if (act.querySelector('command')?.textContent === 'reloadunreadmessagesdone') {
        const raw = act.querySelector('data')?.textContent;
        if (raw) {
          const parsed = JSON.parse(raw);
          return parseInt(parsed['0'] || '0', 10);
        }
      }
    }
    return 0;
  }

  /**
   * Expédition effective d'un message
   */
  public async sendMessage(params: {
    toUserIds: (string | number)[];
    subject: string;
    bodyHtml: string;
    uniqueUsc: string;
    origMsgId?: string | number;
  }): Promise<boolean> {
    const randomDir = 'FWaCpQ8tr5UkvHzJ3n5XNALwc' + Date.now();
    const toList = params.toUserIds.join(',');

    const doc = await this.sendRequest([
      {
        subsystem: 'draft',
        action: 'save draft',
        params: [
          { name: 'draftID', value: '0' },
          { name: 'send', value: 'send' }, // 👈 Envoi effectif
          { name: 'origMsgID', value: params.origMsgId || 0 },
          { name: 'composeAction', value: 0 },
          { name: 'randomDir', value: randomDir },
          { name: 'uniqueUsc', value: params.uniqueUsc },
          { name: 'to', value: toList },
          { name: 'to_users', value: toList },
          { name: 'subject', value: params.subject },
          { name: 'bcc', value: 0 },
          { name: 'composeType', value: 0 },
          { name: 'msgID', value: 0 },
          { name: 'message', value: params.bodyHtml },
          { name: 'preload_type', value: '' },
          { name: 'encryptedSender', value: '' },
          { name: 'sendDate', value: '' }
        ]
      }
    ]);

    const status = doc.querySelector('status')?.textContent;
    return status === 'ok';
  }
}
```
