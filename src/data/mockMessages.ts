import { 
  SmartschoolBoxType, 
  SmartschoolMessageSummary, 
  SmartschoolMessageDetail, 
  SmartschoolContact, 
  SmartschoolMailCounters 
} from '../types/school';

export const mockMailCounters: SmartschoolMailCounters = {
  inbox: 3,
  outbox: 2,
  draft: 1,
  trash: 1,
  scheduled: 0
};

export const mockContacts: SmartschoolContact[] = [
  {
    userID: 5748,
    name: 'Richard De Gandt',
    className: 'Classe: 4T1',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
  },
  {
    userID: 6012,
    name: 'Imena (Prof. Mathématiques)',
    className: 'Enseignant - Mathématiques',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'
  },
  {
    userID: 6014,
    name: 'Mme. Nollet (Prof. Histoire-Géo)',
    className: 'Enseignant - Histoire-Géo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
  },
  {
    userID: 6016,
    name: 'M. Dury (Prof. Physique-Chimie)',
    className: 'Enseignant - Sciences',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'
  },
  {
    userID: 6020,
    name: 'Secrétariat Jean XXIII',
    className: 'Administration Scolaire',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'
  },
  {
    userID: 6025,
    name: 'Direction Pédagogique',
    className: 'Direction',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120'
  }
];

export const mockInboxSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'msg-in-1',
    from: 'Mme. Nollet (Histoire-Géo)',
    fromImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    subject: 'Préparation du contrôle de géographie & documents d\'accompagnement',
    date: 'Aujourd\'hui à 11:24',
    status: 'unread',
    unread: true,
    hasAttachment: true,
    attachmentCount: 1,
    label: 'green',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'inbox',
    snippet: 'Bonjour à tous, vous trouverez en pièce jointe la fiche de révision pour le contrôle de géographie prévu jeudi prochain...'
  },
  {
    id: 'msg-in-2',
    from: 'M. Dury (Physique-Chimie)',
    fromImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    subject: 'Rapport de TP : consignes de laboratoire et barème d\'évaluation',
    date: 'Hier à 16:45',
    status: 'unread',
    unread: true,
    hasAttachment: true,
    attachmentCount: 2,
    label: 'yellow',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'inbox',
    snippet: 'Chers élèves, suite à la séance de manipulation d\'hier, voici les critères de notation attendus pour votre compte-rendu...'
  },
  {
    id: 'msg-in-3',
    from: 'Secrétariat Jean XXIII',
    fromImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    subject: 'Voyage scolaire à Amsterdam : autorisation parentale et modalités',
    date: '24 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: true,
    attachmentCount: 1,
    label: 'red',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: true,
    hasForward: false,
    realBox: 'inbox',
    snippet: 'Madame, Monsieur, veuillez trouver ci-joint le formulaire d\'autorisation de sortie de territoire ainsi que le programme détaillé...'
  },
  {
    id: 'msg-in-4',
    from: 'Imena (Mathématiques)',
    fromImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    subject: 'Exercices complémentaires sur les suites arithmétiques',
    date: '22 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: false,
    attachmentCount: 0,
    label: 'blue',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'inbox',
    snippet: 'Pour les élèves souhaitant consolider les notions vues en classe, les exercices 42 à 48 page 112 sont vivement recommandés...'
  },
  {
    id: 'msg-in-5',
    from: 'Direction Pédagogique',
    fromImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
    subject: 'Organisation des épreuves blanches du 3ème trimestre',
    date: '19 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: false,
    attachmentCount: 0,
    label: 'none',
    deleted: false,
    allowReply: false,
    allowReplyEnabled: false,
    hasReply: false,
    hasForward: false,
    realBox: 'inbox',
    snippet: 'Le planning des devoirs surveillés communs du trimestre 3 a été arrêté par le conseil pédagogique...'
  }
];

export const mockOutboxSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'msg-out-1',
    from: 'Moi (Richard De Gandt)',
    fromImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    subject: 'Re: Questions sur la dissertation d\'histoire',
    date: 'Hier à 17:42',
    status: 'read',
    unread: false,
    hasAttachment: false,
    attachmentCount: 0,
    label: 'none',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'outbox',
    snippet: 'Merci Madame Nollet pour vos éclaircissements. J\'ai bien intégré la structure thématique pour l\'introduction...'
  },
  {
    id: 'msg-out-2',
    from: 'Moi (Richard De Gandt)',
    fromImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    subject: 'Attestation médicale d\'absence - 18 mars',
    date: '19 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: true,
    attachmentCount: 1,
    label: 'none',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'outbox',
    snippet: 'Veuillez trouver ci-joint mon certificat médical justifiant mon absence du mercredi 18 mars matin...'
  }
];

export const mockDraftSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'msg-draft-1',
    from: 'Brouillon',
    fromImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    subject: 'Demande de rendez-vous pour clarification TP Optique',
    date: '21 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: false,
    attachmentCount: 0,
    label: 'yellow',
    deleted: false,
    allowReply: false,
    allowReplyEnabled: false,
    hasReply: false,
    hasForward: false,
    realBox: 'draft',
    snippet: 'Bonjour Monsieur Dury, serait-il possible de convenir d\'un court échange lors de la permanence du mardi...'
  }
];

export const mockTrashSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'msg-trash-1',
    from: 'Centre de Documentation (CDI)',
    fromImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=120',
    subject: 'Rappel : Ouvrage à retourner avant les vacances',
    date: '12 mars 2026',
    status: 'read',
    unread: false,
    hasAttachment: false,
    attachmentCount: 0,
    label: 'none',
    deleted: true,
    allowReply: false,
    allowReplyEnabled: false,
    hasReply: false,
    hasForward: false,
    realBox: 'trash',
    snippet: 'Le livre "Les Misérables - Tome 1" emprunté le 15 février est attendu au bureau des retours...'
  }
];

export const mockMessageDetails: Record<string, SmartschoolMessageDetail> = {
  'msg-in-1': {
    id: 'msg-in-1',
    from: 'Mme. Nollet (Histoire-Géo)',
    to: 'Classe de 4T1',
    subject: 'Préparation du contrôle de géographie & documents d\'accompagnement',
    date: '26 mars 2026 à 11:24',
    status: 'unread',
    label: 'green',
    hasAttachment: true,
    userPictureHash: 'hash_nollet_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Richard De Gandt', unread: true },
      { name: '4T1 - Classe entière', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [
      {
        fileID: 'att_geo_rev_1',
        name: 'Fiche_Synthese_Geographie_Mondialisation.pdf',
        mime: 'application/pdf',
        size: '1.4 Mo',
        icon: 'pdf',
        wopiAllowed: true
      },
      {
        fileID: 'att_geo_rev_2',
        name: 'Croquis_Espaces_Productifs.png',
        mime: 'image/png',
        size: '890 Ko',
        icon: 'image',
        wopiAllowed: false
      }
    ],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Bonjour à tous,</p>
        <p>Comme convenu lors de notre dernière séance, le contrôle de géographie sur le thème <strong>« Les espaces de la mondialisation et les flux maritimes »</strong> aura lieu ce jeudi.</p>
        <p>Pour vous accompagner efficacement dans vos révisions :</p>
        <ul>
          <li>Relisez attentivement les chapitres 3 et 4 du manuel scolaire.</li>
          <li>Maîtrisez le repérage des 10 principaux détroits et canaux interocéaniques (carte en pièce jointe).</li>
          <li>Apprenez le vocabulaire clé : <em>hinterland, hub logistique, conteneurisation, zone industrialo-portuaire</em>.</li>
        </ul>
        <p>Vous trouverez ci-joint la fiche de synthèse récapitulative ainsi que le fond de carte d'entraînement.</p>
        <p>Je reste à votre disposition si vous avez des questions avant l'épreuve.</p>
        <br/>
        <p>Bien cordialement,</p>
        <p><strong>Mme Nollet</strong><br/><span style="font-size: 0.9em; opacity: 0.8;">Enseignante d'Histoire-Géographie — Collège Jean XXIII</span></p>
      </div>
    `
  },
  'msg-in-2': {
    id: 'msg-in-2',
    from: 'M. Dury (Physique-Chimie)',
    to: 'Élèves du groupe TP 2',
    subject: 'Rapport de TP : consignes de laboratoire et barème d\'évaluation',
    date: '25 mars 2026 à 16:45',
    status: 'unread',
    label: 'yellow',
    hasAttachment: true,
    userPictureHash: 'hash_dury_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Richard De Gandt', unread: true },
      { name: 'Groupe Sciences 4T1', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [
      {
        fileID: 'att_pc_bareme_1',
        name: 'Bareme_Evaluation_Rapport_TP_Optique.docx',
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '420 Ko',
        icon: 'doc',
        wopiAllowed: true
      }
    ],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Chers élèves,</p>
        <p>Suite aux mesures réalisées en laboratoire d'optique sur la réfraction et les lentilles convergentes, le compte-rendu devra m'être remis sous format numérique avant <strong>lundi 18h00</strong>.</p>
        <p>Points de vigilance majeurs :</p>
        <ol>
          <li>Respect rigoureux des chiffres significatifs dans vos tableaux de mesures.</li>
          <li>Présence d'un schéma légendé avec les axes optiques et la position du foyer $F'$.</li>
          <li>Conclusion justifiant la loi de Snell-Descartes à partir de vos tracés graphiques.</li>
        </ol>
        <p>Le barème détaillé sur 20 points est disponible en pièce jointe.</p>
        <br/>
        <p>Bon travail,</p>
        <p><strong>M. Dury</strong><br/><span style="font-size: 0.9em; opacity: 0.8;">Physique-Chimie — Laboratoire 2</span></p>
      </div>
    `
  },
  'msg-in-3': {
    id: 'msg-in-3',
    from: 'Secrétariat Jean XXIII',
    to: 'Parents d\'élèves & Élèves de 4ème',
    subject: 'Voyage scolaire à Amsterdam : autorisation parentale et modalités',
    date: '24 mars 2026 à 09:15',
    status: 'read',
    label: 'red',
    hasAttachment: true,
    userPictureHash: 'hash_secretariat_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: true,
    hasForward: false,
    receivers: [
      { name: 'Richard De Gandt', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [
      {
        fileID: 'att_sortie_amsterdam',
        name: 'Autorisation_Parentale_Sortie_Territoire_2026.pdf',
        mime: 'application/pdf',
        size: '850 Ko',
        icon: 'pdf',
        wopiAllowed: true
      }
    ],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Madame, Monsieur, Chers élèves,</p>
        <p>Dans le cadre du projet européen interdisciplinaire (Arts, Histoire et Langues), le voyage pédagogique à Amsterdam est programmé du <strong>12 au 16 mai 2026</strong>.</p>
        <p>Merci de bien vouloir imprimer, signer et renvoyer le formulaire ci-joint au secrétariat des élèves au plus tard pour le <strong>10 avril 2026</strong>.</p>
        <p>Pensez à vérifier la validité de la pièce d'identité (CNI ou passeport en cours de validité) ainsi que la Carte Européenne d'Assurance Maladie (CEAM).</p>
        <br/>
        <p>Restant à votre entière écoute,</p>
        <p><strong>Secrétariat de Direction</strong><br/>Collège & Lycée Jean XXIII</p>
      </div>
    `
  },
  'msg-in-4': {
    id: 'msg-in-4',
    from: 'Imena (Mathématiques)',
    to: 'Richard De Gandt',
    subject: 'Exercices complémentaires sur les suites arithmétiques',
    date: '22 mars 2026 à 14:10',
    status: 'read',
    label: 'blue',
    hasAttachment: false,
    userPictureHash: 'hash_imena_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Richard De Gandt', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Bonjour Richard,</p>
        <p>Comme discuté à la fin du cours de vendredi, j'ai vérifié ton raisonnement sur le calcul de la somme des termes $S_n = \\sum_{k=0}^{n} u_k$. Ta méthode est tout à fait exacte, fais simplement attention à l'indice du premier terme ($u_0$ contre $u_1$).</p>
        <p>Tu peux t'entraîner sur les exercices 45 et 46 de la page 112 si tu souhaites valider la formule générale.</p>
        <br/>
        <p>Bonne continuation,</p>
        <p><strong>M. Imena</strong></p>
      </div>
    `
  },
  'msg-in-5': {
    id: 'msg-in-5',
    from: 'Direction Pédagogique',
    to: 'Tous les élèves',
    subject: 'Organisation des épreuves blanches du 3ème trimestre',
    date: '19 mars 2026 à 08:30',
    status: 'read',
    label: 'none',
    hasAttachment: false,
    userPictureHash: 'hash_dir_4907',
    fromOauth: false,
    allowReply: false,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Élèves Jean XXIII', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Chers élèves,</p>
        <p>Nous vous informons que le calendrier des épreuves blanches du troisième trimestre est désormais disponible sur votre planning.</p>
        <p>Les convocations nominatives avec salles et numéros d'anonymat vous seront remises par vos professeurs principaux d'ici la fin de la semaine.</p>
        <p><em>Rappel : aucun appareil électronique connecté (montres, smartphones) n'est autorisé en salle d'examen.</em></p>
        <br/>
        <p>La Direction des Études</p>
      </div>
    `
  },
  'msg-out-1': {
    id: 'msg-out-1',
    from: 'Moi (Richard De Gandt)',
    to: 'Mme. Nollet (Histoire-Géo)',
    subject: 'Re: Questions sur la dissertation d\'histoire',
    date: 'Hier à 17:42',
    status: 'read',
    label: 'none',
    hasAttachment: false,
    userPictureHash: 'hash_me_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Mme. Nollet (Histoire-Géo)', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Merci Madame Nollet pour vos explications.</p>
        <p>J'ai bien noté que pour la deuxième partie, il convient d'aborder les conséquences économiques avant d'analyser les mutations sociales.</p>
        <p>Passez une excellente soirée,</p>
        <p>Richard</p>
      </div>
    `
  },
  'msg-out-2': {
    id: 'msg-out-2',
    from: 'Moi (Richard De Gandt)',
    to: 'Secrétariat Jean XXIII',
    subject: 'Attestation médicale d\'absence - 18 mars',
    date: '19 mars 2026 à 18:20',
    status: 'read',
    label: 'none',
    hasAttachment: true,
    userPictureHash: 'hash_me_4907',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Secrétariat Jean XXIII', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [
      {
        fileID: 'att_certificat_med',
        name: 'Certificat_Medical_18032026.pdf',
        mime: 'application/pdf',
        size: '310 Ko',
        icon: 'pdf',
        wopiAllowed: false
      }
    ],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint mon certificat médical justifiant mon absence de la matinée du 18 mars 2026.</p>
        <p>Cordialement,</p>
        <p>Richard De Gandt — 4T1</p>
      </div>
    `
  },
  'msg-draft-1': {
    id: 'msg-draft-1',
    from: 'Brouillon',
    to: 'M. Dury (Physique-Chimie)',
    subject: 'Demande de rendez-vous pour clarification TP Optique',
    date: '21 mars 2026 à 15:30',
    status: 'read',
    label: 'yellow',
    hasAttachment: false,
    userPictureHash: 'hash_me_4907',
    fromOauth: false,
    allowReply: false,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'M. Dury', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Bonjour Monsieur Dury,</p>
        <p>Serait-il possible de convenir d'un court échange lors de votre permanence du mardi afin que je puisse vous poser deux questions sur le calcul des incertitudes de mesure ?</p>
        <p>En vous remerciant par avance,</p>
      </div>
    `
  },
  'msg-trash-1': {
    id: 'msg-trash-1',
    from: 'Centre de Documentation (CDI)',
    to: 'Richard De Gandt',
    subject: 'Rappel : Ouvrage à retourner avant les vacances',
    date: '12 mars 2026 à 10:00',
    status: 'read',
    label: 'none',
    hasAttachment: false,
    userPictureHash: 'hash_cdi_4907',
    fromOauth: false,
    allowReply: false,
    hasReply: false,
    hasForward: false,
    receivers: [
      { name: 'Richard De Gandt', unread: false }
    ],
    ccReceivers: [],
    bccReceivers: [],
    attachments: [],
    bodyHtml: `
      <div style="font-family: inherit; line-height: 1.6; color: inherit;">
        <p>Bonjour,</p>
        <p>Le roman « Les Misérables » (Tome 1) emprunté le 15 février est attendu au bureau d'accueil du CDI pour prolongation ou restitution.</p>
        <p>Merci de vous présenter avant le vendredi 17h.</p>
        <p>L'équipe du CDI</p>
      </div>
    `
  }
};
