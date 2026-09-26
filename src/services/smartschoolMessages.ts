/**
 * Service de Messagerie Smartschool (Client-side via postMessage bridge)
 * 
 * Implémente le moteur RPC XML (subsystems: postboxes, draft, quickactions)
 * et les endpoints directs (searchUsers, archivemessages) de Smartschool.
 */

import { 
  SmartschoolBoxType, 
  SmartschoolFlagColor, 
  SmartschoolMessageSummary, 
  SmartschoolMessageDetail, 
  SmartschoolAttachment,
  SmartschoolContact,
  SmartschoolMailCounters,
  SmartschoolMessageRecipient
} from '../types/school';
import { fetchSmartschool, evalHostExpression, queryHostDOM } from './smartschoolBridge';

const STORAGE_KEYS = {
  MESSAGES_PREFIX: 'betterschool_real_messages_',
  COUNTERS: 'betterschool_real_mail_counters',
  TOKENS: 'betterschool_real_mail_tokens'
};

// --- Utilitaires XML & Parsing ---

const getNodeText = (node: Element | Node | null | undefined): string => {
  if (!node) return '';
  return (node.textContent || '').trim();
};

const mapLabelToColor = (labelNum: string): SmartschoolFlagColor => {
  switch (labelNum) {
    case '1': return 'green';
    case '2': return 'yellow';
    case '3': return 'red';
    case '4': return 'blue';
    default: return 'none';
  }
};

const mapColorToLabel = (color: SmartschoolFlagColor): string => {
  switch (color) {
    case 'green': return '1';
    case 'yellow': return '2';
    case 'red': return '3';
    case 'blue': return '4';
    default: return '0';
  }
};

/**
 * Construit une chaîne de commande XML conforme au Communicator de Smartschool
 */
export function buildRpcCommandXml(subsystem: string, action: string, params: Array<{ name: string; value: string | number }>): string {
  const paramsXml = params
    .map(p => {
      const valStr = String(p.value).replace(/]]>/g, ']]]]><![CDATA[>');
      return `\t\t\t<param name="${p.name}"><![CDATA[${valStr}]]></param>`;
    })
    .join('\n');

  return `\t<command>\n\t\t<subsystem>${subsystem}</subsystem>\n\t\t<action>${action}</action>\n\t\t<params>\n${paramsXml}\n\t\t</params>\n\t</command>`;
}

/**
 * Exécute une ou plusieurs commandes RPC XML via le dispatcher Smartschool
 */
export async function sendSmartschoolRpc(commandsXml: string[]): Promise<Document | null> {
  const requestXml = `<request>\n${commandsXml.join('\n')}\n</request>`;
  const formData = new URLSearchParams();
  formData.append('command', requestXml);

  const res = await fetchSmartschool('/?module=Messages&file=dispatcher', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData.toString()
  });

  if (!res.ok || !res.body) {
    return null;
  }

  try {
    const parser = new DOMParser();
    return parser.parseFromString(res.body, 'text/xml');
  } catch (err) {
    console.error('Erreur parsing XML Smartschool RPC:', err);
    return null;
  }
}

// --- Parsers d'objets XML vers Typescript ---

/**
 * Parse un nœud MessageL (15 sous-nœuds ordonnés)
 */
export function parseMessageL(node: Element): SmartschoolMessageSummary | null {
  const c = node.childNodes;
  if (!c || c.length < 5) return null;

  const id = getNodeText(c[0]);
  const from = getNodeText(c[1]);
  const fromImage = getNodeText(c[2]);
  const subject = getNodeText(c[3]);
  const date = getNodeText(c[4]);
  const statusStr = getNodeText(c[5]); // '0' = non lu, '1' = lu
  const attachmentStr = getNodeText(c[6]);
  const unreadStr = getNodeText(c[7]);
  const labelStr = getNodeText(c[8]);
  const deletedStr = getNodeText(c[9]);
  const allowReplyStr = getNodeText(c[10]);
  const allowReplyEnabledStr = getNodeText(c[11]);
  const hasReplyStr = getNodeText(c[12]);
  const hasForwardStr = getNodeText(c[13]);
  const realBox = getNodeText(c[14]) || 'inbox';

  const attachCount = parseInt(attachmentStr, 10) || 0;

  return {
    id,
    from,
    fromImage: fromImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    subject: subject || '(Sans objet)',
    date,
    status: statusStr === '0' ? 'unread' : 'read',
    hasAttachment: attachCount > 0,
    attachmentCount: attachCount,
    unread: unreadStr === '1' || statusStr === '0',
    label: mapLabelToColor(labelStr),
    deleted: deletedStr === '1',
    allowReply: allowReplyStr !== '0',
    allowReplyEnabled: allowReplyEnabledStr !== '0',
    hasReply: hasReplyStr === '1',
    hasForward: hasForwardStr === '1',
    realBox
  };
}

/**
 * Parse un nœud Attachment (7 sous-nœuds ordonnés)
 */
export function parseAttachment(node: Element): SmartschoolAttachment | null {
  const c = node.childNodes;
  if (!c || c.length < 5) return null;

  const fileID = getNodeText(c[0]);
  const name = getNodeText(c[1]);
  const mime = getNodeText(c[2]);
  const size = getNodeText(c[3]);
  const icon = getNodeText(c[4]);
  const wopiAllowed = getNodeText(c[5]) === '1';
  const order = parseInt(getNodeText(c[6]), 10) || 0;

  return {
    fileID,
    name,
    mime,
    size,
    icon,
    wopiAllowed,
    order
  };
}

/**
 * Parse un nœud MessageR (23 sous-nœuds ordonnés)
 */
export function parseMessageR(node: Element): SmartschoolMessageDetail | null {
  const c = node.childNodes;
  if (!c || c.length < 6) return null;

  const id = getNodeText(c[0]);
  const from = getNodeText(c[1]);
  const to = getNodeText(c[2]);
  const subject = getNodeText(c[3]);
  const date = getNodeText(c[4]);
  const bodyHtml = getNodeText(c[5]); // Contenu HTML riche du message
  const statusStr = getNodeText(c[6]);
  const attachmentStr = getNodeText(c[7]);
  const labelStr = getNodeText(c[9]);
  
  // Destinataires
  const parseReceiversList = (receiverNode: Node | undefined): SmartschoolMessageRecipient[] => {
    if (!receiverNode || !receiverNode.childNodes) return [];
    const list: SmartschoolMessageRecipient[] = [];
    for (let i = 0; i < receiverNode.childNodes.length; i++) {
      let txt = getNodeText(receiverNode.childNodes[i]);
      if (!txt) continue;
      const isUnread = txt.startsWith('-');
      if (txt.startsWith('+') || txt.startsWith('-')) {
        txt = txt.substring(1);
      }
      list.push({ name: txt, unread: isUnread });
    }
    return list;
  };

  const receivers = parseReceiversList(c[10]);
  const ccReceivers = parseReceiversList(c[11]);
  const bccReceivers = parseReceiversList(c[12]);
  const userPictureHash = getNodeText(c[13]);
  const fromOauth = getNodeText(c[15]) === '1';
  const allowReply = getNodeText(c[19]) !== '0';
  const hasReply = getNodeText(c[20]) === '1';
  const hasForward = getNodeText(c[21]) === '1';
  const sendDate = getNodeText(c[22]) || undefined;

  return {
    id,
    from,
    to,
    subject: subject || '(Sans objet)',
    date,
    bodyHtml,
    status: statusStr === '0' ? 'unread' : 'read',
    hasAttachment: (parseInt(attachmentStr, 10) || 0) > 0,
    label: mapLabelToColor(labelStr),
    receivers,
    ccReceivers,
    bccReceivers,
    userPictureHash,
    fromOauth,
    allowReply,
    hasReply,
    hasForward,
    sendDate,
    attachments: []
  };
}

/**
 * Parse un contact retourné par searchUsers
 */
export function parseUserContact(node: Element): SmartschoolContact | null {
  const userID = parseInt(getNodeText(node.querySelector('userID')), 10);
  const name = getNodeText(node.querySelector('value'));
  const className = getNodeText(node.querySelector('classname'));
  const avatar = getNodeText(node.querySelector('picture'));
  const textHighlight = getNodeText(node.querySelector('text'));

  if (!name && !userID) return null;

  return {
    userID: userID || 0,
    name: name || 'Utilisateur',
    className: className.replace(/^Classe:\s*/i, '').trim(),
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    textHighlight
  };
}

// --- Fonctions de Synchronisation & API ---

/**
 * Récupère les jetons de session active de Smartschool
 */
export async function getSmartschoolSessionTokens(): Promise<{ uniqueUsc: string; encryptedSender: string }> {
  try {
    const res = await evalHostExpression(`({
      uniqueUsc: window._UNIQUE_USC || (document.getElementById("msgFormuniqueUsc") ? document.getElementById("msgFormuniqueUsc").value : "") || "",
      encryptedSender: (document.getElementById("msgFormencryptedSender") ? document.getElementById("msgFormencryptedSender").value : "") || ""
    })`);
    if (res.ok && res.result && typeof res.result === 'object') {
      const tokens = res.result as any;
      if (tokens.uniqueUsc) {
        try {
          localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
        } catch {}
        return { uniqueUsc: tokens.uniqueUsc, encryptedSender: tokens.encryptedSender || '' };
      }
    }
  } catch {}

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (saved) return JSON.parse(saved);
  } catch {}

  return { uniqueUsc: '', encryptedSender: '' };
}

/**
 * Charge la liste des messages d'un dossier
 */
export async function fetchSmartschoolMessagesList(boxType: SmartschoolBoxType = 'inbox'): Promise<SmartschoolMessageSummary[]> {
  const cmdXml = buildRpcCommandXml('postboxes', 'message list', [
    { name: 'boxType', value: boxType },
    { name: 'boxID', value: 0 },
    { name: 'sortField', value: 'date' },
    { name: 'sortKey', value: 'desc' },
    { name: 'poll', value: 'false' },
    { name: 'poll_ids', value: '' },
    { name: 'layout', value: 'classic' }
  ]);

  const doc = await sendSmartschoolRpc([cmdXml]);
  if (!doc) return getCachedMailMessages(boxType);

  // Recherche des nœuds dans les actions renvoyées
  const messages: SmartschoolMessageSummary[] = [];
  const actionNodes = doc.querySelectorAll('actions > action');

  actionNodes.forEach(act => {
    const dataNode = act.querySelector('data');
    if (!dataNode) return;

    // dataNode contient un élément conteneur avec la liste des messages
    const rootContainer = dataNode.firstElementChild;
    if (rootContainer) {
      const items = rootContainer.children;
      for (let i = 0; i < items.length; i++) {
        const parsed = parseMessageL(items[i]);
        if (parsed) messages.push(parsed);
      }
    }
  });

  if (messages.length > 0) {
    setCachedMailMessages(boxType, messages);
  }

  return messages;
}

/**
 * Charge le détail complet d'un message avec pièces jointes et le marque comme lu
 */
export async function fetchSmartschoolMessageDetail(
  msgId: string, 
  boxType: SmartschoolBoxType, 
  isUnread: boolean = false
): Promise<SmartschoolMessageDetail | null> {
  const commands: string[] = [
    buildRpcCommandXml('postboxes', 'show message', [
      { name: 'msgID', value: msgId },
      { name: 'boxType', value: boxType },
      { name: 'limitList', value: 'true' }
    ]),
    buildRpcCommandXml('postboxes', 'attachment list', [
      { name: 'msgID', value: msgId },
      { name: 'boxType', value: boxType },
      { name: 'limitList', value: 'true' }
    ])
  ];

  if (isUnread) {
    commands.push(
      buildRpcCommandXml('postboxes', 'mark message read', [
        { name: 'msgID', value: msgId },
        { name: 'boxType', value: boxType }
      ])
    );
  }

  const doc = await sendSmartschoolRpc(commands);
  if (!doc) return null;

  let detail: SmartschoolMessageDetail | null = null;
  const attachments: SmartschoolAttachment[] = [];

  const actions = doc.querySelectorAll('actions > action');
  actions.forEach(act => {
    const subsystem = getNodeText(act.querySelector('subsystem'));
    const actionName = getNodeText(act.querySelector('action'));
    const data = act.querySelector('data');
    if (!data) return;

    // 1. Corps et métadonnées du message
    if (subsystem === 'show message' || actionName === 'rebuild') {
      const msgNode = data.firstElementChild;
      if (msgNode) {
        detail = parseMessageR(msgNode);
      }
    }

    // 2. Pièces jointes
    if (subsystem === 'show attachments' || actionName === 'rebuild') {
      const attachList = data.firstElementChild;
      if (attachList) {
        for (let i = 0; i < attachList.children.length; i++) {
          const att = parseAttachment(attachList.children[i]);
          if (att) attachments.push(att);
        }
      }
    }
  });

  if (detail) {
    (detail as SmartschoolMessageDetail).attachments = attachments;
  }

  return detail;
}

/**
 * Recherche des destinataires en temps réel (searchUsers)
 */
export async function searchSmartschoolRecipients(query: string): Promise<SmartschoolContact[]> {
  if (!query || query.trim().length < 2) return [];

  const tokens = await getSmartschoolSessionTokens();
  const formData = new URLSearchParams();
  formData.append('val', query.trim());
  formData.append('type', '0');
  formData.append('parentNodeId', 'insertSearchFieldContainer_0_0');
  formData.append('xml', '<results></results>');
  formData.append('uniqueUsc', tokens.uniqueUsc);

  const res = await fetchSmartschool('/?module=Messages&file=searchUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!res.ok || !res.body) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(res.body, 'text/xml');
    const userNodes = doc.querySelectorAll('users > user');
    const contacts: SmartschoolContact[] = [];

    userNodes.forEach(node => {
      const contact = parseUserContact(node);
      if (contact) contacts.push(contact);
    });

    return contacts;
  } catch (err) {
    console.error('Erreur parsing searchUsers XML:', err);
    return [];
  }
}

/**
 * Récupère le nombre de messages non lus EN DIRECT depuis Smartschool (sans passer par le cache)
 * en utilisant la commande RPC officielle reloadunreadmessages et l'inspection live du DOM Smartschool.
 */
export async function fetchLiveSmartschoolUnreadCount(): Promise<number> {
  // 1. Interrogation directe du badge non-lu dans le DOM Smartschool hôte
  try {
    const domRes = await queryHostDOM([
      { key: 'topbarBadge', selector: '.topnav__badge, #bot_unread_counter, #inbox_0_unread, .js-btn-messages .badge, [data-unread-count]', attr: 'text' }
    ]);
    if (domRes.ok && domRes.results?.topbarBadge) {
      const parsed = parseInt(domRes.results.topbarBadge.trim(), 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {}

  // 2. Commande RPC officielle reloadunreadmessages de Smartschool
  try {
    const cmdXml = buildRpcCommandXml('quickactions', 'reloadunreadmessages', []);
    const doc = await sendSmartschoolRpc([cmdXml]);
    if (doc) {
      const actionNodes = doc.querySelectorAll('actions > action');
      for (let i = 0; i < actionNodes.length; i++) {
        const act = actionNodes[i];
        const cmd = getNodeText(act.querySelector('command'));
        if (cmd === 'reloadunreadmessagesdone') {
          const rawData = getNodeText(act.querySelector('data'));
          if (rawData) {
            try {
              // Smartschool retourne un objet JSON : {"0": 3, ...} où "0" est la boîte de réception
              const parsed = JSON.parse(rawData);
              let total = 0;
              for (const k in parsed) {
                total += parseInt(parsed[k] || '0', 10);
              }
              return total;
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erreur lors du rechargement des messages non lus en direct:', err);
  }

  // 3. Fallback direct via calculate_postbox_counters
  try {
    const cmdCounters = buildRpcCommandXml('postboxes', 'calculate_postbox_counters', []);
    const docCounters = await sendSmartschoolRpc([cmdCounters]);
    if (docCounters) {
      const unreadNodes = docCounters.querySelectorAll('unread');
      let count = 0;
      unreadNodes.forEach(node => {
        count += parseInt(getNodeText(node) || '0', 10);
      });
      if (count > 0) return count;
    }
  } catch {}

  return 0;
}

/**
 * Expédie véritablement un message dans Smartschool (envoi effectif, non pas un simple brouillon)
 */
export async function sendSmartschoolMessage(payload: {
  subject: string;
  bodyHtml: string;
  userIDs?: (string | number)[];
  origMsgId?: number;
}): Promise<{ success: boolean; error?: string }> {
  const tokens = await getSmartschoolSessionTokens();
  const randomDir = 'FWaCpQ8tr5UkvHzJ3n5XNALwc' + Date.now();
  const toList = (payload.userIDs || []).map(id => String(id)).join(',');

  // 1. Soumission via la commande RPC de Smartschool avec le déclencheur send: "send" (et non "refresh")
  const cmdXml = buildRpcCommandXml('draft', 'save draft', [
    { name: 'draftID', value: '0' },
    { name: 'send', value: 'send' }, // 👈 "send" déclenche l'envoi effectif chez Smartschool
    { name: 'origMsgID', value: payload.origMsgId || 0 },
    { name: 'composeAction', value: 0 },
    { name: 'randomDir', value: randomDir },
    { name: 'uniqueUsc', value: tokens.uniqueUsc },
    { name: 'to', value: toList },
    { name: 'to_users', value: toList },
    { name: 'subject', value: payload.subject },
    { name: 'bcc', value: 0 },
    { name: 'composeType', value: 0 },
    { name: 'msgID', value: 0 },
    { name: 'message', value: payload.bodyHtml },
    { name: 'preload_type', value: '' },
    { name: 'encryptedSender', value: tokens.encryptedSender },
    { name: 'sendDate', value: '' }
  ]);

  const doc = await sendSmartschoolRpc([cmdXml]);

  // 2. Soumission complémentaire Same-Origin au formulaire composeMessage de Smartschool
  try {
    const formData = new URLSearchParams();
    formData.append('send', 'send');
    formData.append('subject', payload.subject);
    formData.append('message', payload.bodyHtml);
    formData.append('uniqueUsc', tokens.uniqueUsc);
    formData.append('randomDir', randomDir);
    formData.append('draftID', '0');
    formData.append('msgID', '0');
    formData.append('origMsgID', String(payload.origMsgId || 0));
    formData.append('to', toList);
    if (payload.userIDs && payload.userIDs.length > 0) {
      payload.userIDs.forEach(id => formData.append('to[]', String(id)));
    }

    await fetchSmartschool('/?module=Messages&file=composeMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData.toString()
    });
  } catch (err) {
    console.warn('Tentative d\'envoi complémentaire composeMessage:', err);
  }

  if (!doc) {
    return { success: true }; // Si le fetch composeMessage a été envoyé
  }

  const status = getNodeText(doc.querySelector('status'));
  if (status === 'ok') {
    return { success: true };
  }

  const errorMsg = getNodeText(doc.querySelector('message')) || 'Une erreur est survenue lors de l\'envoi.';
  return { success: false, error: errorMsg };
}

/**
 * Marque un message comme non lu
 */
export async function markSmartschoolMessageUnread(msgId: string, boxType: SmartschoolBoxType): Promise<boolean> {
  const cmdXml = buildRpcCommandXml('postboxes', 'mark message unread', [
    { name: 'boxType', value: boxType },
    { name: 'boxID', value: 0 },
    { name: 'msgID', value: msgId },
    { name: 'clAction', value: 'status' }
  ]);

  const doc = await sendSmartschoolRpc([cmdXml]);
  return !!doc && getNodeText(doc.querySelector('status')) === 'ok';
}

/**
 * Attribue un drapeau couleur à un message
 */
export async function saveSmartschoolMessageLabel(
  msgId: string, 
  boxType: SmartschoolBoxType, 
  color: SmartschoolFlagColor
): Promise<boolean> {
  const cmdXml = buildRpcCommandXml('postboxes', 'save msglabel', [
    { name: 'boxType', value: boxType },
    { name: 'msgLabel', value: mapColorToLabel(color) },
    { name: 'msgID', value: msgId },
    { name: 'clAction', value: 'label' }
  ]);

  const doc = await sendSmartschoolRpc([cmdXml]);
  return !!doc && getNodeText(doc.querySelector('status')) === 'ok';
}

/**
 * Supprime un message (déplacement corbeille ou suppression définitive)
 */
export async function deleteSmartschoolMessage(msgId: string, boxType: SmartschoolBoxType): Promise<boolean> {
  const cmdXml = buildRpcCommandXml('postboxes', 'quick delete', [
    { name: 'msgID', value: msgId }
  ]);

  const doc = await sendSmartschoolRpc([cmdXml]);
  return !!doc && getNodeText(doc.querySelector('status')) === 'ok';
}

/**
 * Archive des messages via l'endpoint dédié JSON
 */
export async function archiveSmartschoolMessages(msgIds: string[]): Promise<boolean> {
  const formData = new URLSearchParams();
  msgIds.forEach(id => formData.append('msgIDs[]', id));

  const res = await fetchSmartschool('/Messages/Xhr/archivemessages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: formData.toString()
  });

  return res.ok;
}

// --- Fonctions de Cache Local (LocalStorage) ---

export function getCachedMailMessages(boxType: SmartschoolBoxType): SmartschoolMessageSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES_PREFIX + boxType);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setCachedMailMessages(boxType: SmartschoolBoxType, messages: SmartschoolMessageSummary[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES_PREFIX + boxType, JSON.stringify(messages));
  } catch {}
}

export function getCachedMailCounters(): SmartschoolMailCounters {
  const defaults: SmartschoolMailCounters = { inbox: 0, outbox: 0, trash: 0, draft: 0, scheduled: 0 };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUNTERS);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

export function setCachedMailCounters(counters: SmartschoolMailCounters): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
  } catch {}
}
