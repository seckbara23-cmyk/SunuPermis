# Guide Administration — SunuPermis

**Version 1.0 — Pilote — CONFIDENTIEL**
**Ministère des Transports Terrestres — République du Sénégal**

---

> Ce guide est réservé aux **opérateurs et agents administratifs** disposant d'un accès administrateur à la plateforme SunuPermis. Son contenu est confidentiel.

---

## Table des matières

1. [Accès et authentification](#1-accès-et-authentification)
2. [Gestion des demandes d'inscription](#2-gestion-des-demandes-dinscription)
3. [Validation et rejet des dossiers](#3-validation-et-rejet-des-dossiers)
4. [Gestion des sessions d'examen](#4-gestion-des-sessions-dexamen)
5. [Contrôle des convocations](#5-contrôle-des-convocations)
6. [Journaux d'audit](#6-journaux-daudit)
7. [Gestion des anomalies](#7-gestion-des-anomalies)
8. [Vérification des numéros de référence](#8-vérification-des-numéros-de-référence)
9. [Sécurité et confidentialité](#9-sécurité-et-confidentialité)
10. [Escalades et contacts](#10-escalades-et-contacts)

---

## 1. Accès et authentification

### 1.1 Connexion

1. Accédez à SunuPermis depuis votre navigateur sécurisé.
2. Sur la page de connexion, sélectionnez l'onglet **Administration**.
3. Saisissez votre identifiant administrateur et votre mot de passe.
4. Cliquez sur **Se connecter**.

### 1.2 Droits d'accès

Le rôle **Super Administrateur** donne accès à l'intégralité des fonctionnalités de gestion. Les droits incluent :

| Fonctionnalité | Accès |
|---|---|
| Validation / rejet des demandes | ✅ Oui |
| Validation / rejet des réservations | ✅ Oui |
| Gestion des sessions d'examen | ✅ Oui |
| Consultation des journaux d'audit | ✅ Oui |
| Gestion des auto-écoles | ✅ Oui |
| Gestion des comptes élèves | ✅ Oui |

### 1.3 Politique de mot de passe

- Longueur minimale : 12 caractères
- Renouvellement recommandé tous les 90 jours
- Ne jamais partager ses identifiants entre agents

---

## 2. Gestion des demandes d'inscription

### 2.1 Tableau de bord des demandes

Depuis le menu **Réservations** (ou **Demandes**), vous accédez à la liste des dossiers soumis par les auto-écoles.

Chaque dossier affiche :

| Colonne | Contenu |
|---|---|
| Élève | Nom, prénom |
| Auto-école | Établissement soumettant la demande |
| Date de soumission | Horodatage de la demande |
| Statut | En attente / Confirmée / Rejetée |
| Actions | Valider / Rejeter |

### 2.2 Filtres disponibles

Vous pouvez filtrer les demandes par :
- Statut (en attente, confirmées, rejetées)
- Auto-école
- Période de soumission

### 2.3 Consulter le détail d'une demande

Cliquez sur une demande pour voir :
- Les informations de l'élève (identité, contact)
- Les informations de l'auto-école
- Le document médical associé
- L'historique des actions sur le dossier

---

## 3. Validation et rejet des dossiers

### 3.1 Valider une demande d'inscription

1. Ouvrez le dossier à valider.
2. Vérifiez la complétude du dossier (identité, document médical).
3. Cliquez sur **Approuver**.
4. La demande passe au statut **Confirmée**.
5. Une convocation est automatiquement générée et envoyée à l'élève et à l'auto-école.

> La validation est enregistrée dans le journal d'audit avec l'identifiant de l'agent, l'horodatage et les détails de l'action.

### 3.2 Rejeter une demande d'inscription

1. Ouvrez le dossier à rejeter.
2. Cliquez sur **Rejeter**.
3. Saisissez le motif du rejet (obligatoire).
4. Confirmez le rejet.

Le motif est transmis à l'auto-école et à l'élève par notification automatique.

**Motifs de rejet courants :**

| Motif | Description |
|---|---|
| Document médical manquant | Aucun certificat médical déposé |
| Document médical non conforme | Format incorrect, illisible, ou non signé |
| Dossier incomplet | Informations manquantes |
| Doublon | Élève déjà inscrit à une session active |
| Élève non éligible | Conditions réglementaires non remplies |

### 3.3 Valider une réservation de session

Le même workflow s'applique aux réservations de sessions d'examen :

1. Accédez à **Réservations de sessions**.
2. Consultez les réservations en attente.
3. Approuvez ou rejetez chaque réservation.

> **Contrainte d'unicité :** La plateforme empêche automatiquement l'approbation d'une seconde réservation active pour le même élève. Un message d'erreur s'affiche si vous tentez cette action. Rejetez la réservation existante avant d'en approuver une nouvelle.

---

## 4. Gestion des sessions d'examen

### 4.1 Créer une session d'examen

1. Depuis le menu **Sessions**, cliquez sur **Nouvelle session**.
2. Renseignez :
   - Date et heure de la session
   - Centre d'examen
   - Capacité maximale (nombre de places)
3. Confirmez la création.

La session est alors visible et réservable par les auto-écoles.

### 4.2 Modifier ou annuler une session

- **Modification** : possible tant que des réservations approuvées ne sont pas liées à la session.
- **Annulation** : si des réservations approuvées existent, les auto-écoles concernées seront notifiées automatiquement.

> Toute modification ou annulation de session est tracée dans le journal d'audit.

### 4.3 Clôturer une session (résultats)

Après la tenue d'un examen, renseignez les résultats des élèves dans la session correspondante. Cela libère la contrainte d'unicité pour les élèves ayant passé l'examen.

---

## 5. Contrôle des convocations

### 5.1 Types de convocations

| Type | Format de référence | Source |
|---|---|---|
| Demande individuelle | `SP-AAAA-XXXXXX` | Demande d'inscription validée |
| Réservation de session | `BK-AAAA-XXXXXX` | Réservation de session approuvée |

`AAAA` = année de génération, `XXXXXX` = identifiant hexadécimal unique

### 5.2 Vérifier une convocation

Pour vérifier l'authenticité d'une convocation présentée le jour de l'examen :

1. Accédez à **Recherche** depuis votre tableau de bord.
2. Saisissez le numéro de référence (`SP-…` ou `BK-…`).
3. Les informations de l'élève et de l'examen s'affichent.
4. Comparez avec la pièce d'identité présentée.

### 5.3 Convocation non trouvée

Si un numéro de référence ne correspond à aucun dossier :
- La convocation peut être falsifiée
- Refusez l'accès à l'examen
- Notez le numéro présenté et signalez l'incident au responsable de centre

---

## 6. Journaux d'audit

### 6.1 Accès aux journaux

Depuis le menu **Journaux d'audit**, vous accédez à l'historique complet des actions effectuées sur la plateforme.

### 6.2 Informations enregistrées

Chaque entrée du journal contient :

| Champ | Détail |
|---|---|
| Date et heure | Horodatage précis (UTC) |
| Agent | Identifiant et rôle de l'opérateur |
| Action | Type d'action (approbation, rejet, modification…) |
| Entité | Type de dossier concerné (demande, réservation, session…) |
| Identifiant | Référence unique du dossier concerné |
| Métadonnées | Informations contextuelles (centre, date d'examen…) |

### 6.3 Filtrage et export

Les journaux peuvent être filtrés par :
- Période (date de début / date de fin)
- Type d'action
- Agent responsable
- Auto-école concernée

> Les journaux d'audit sont en lecture seule. Aucune entrée ne peut être modifiée ou supprimée.

---

## 7. Gestion des anomalies

### 7.1 Élève avec plusieurs réservations actives

La plateforme applique une contrainte d'unicité : un élève ne peut avoir qu'une seule réservation active approuvée à la fois. Si une anomalie est détectée :

1. Accédez au profil de l'élève via **Élèves**.
2. Consultez la liste de ses réservations.
3. Identifiez la réservation la plus récente et valide.
4. Rejetez les autres en indiquant le motif "Doublon résolu".

### 7.2 Dossier bloqué en état indéfini

Si un dossier reste bloqué dans un état inattendu :
1. Consultez le journal d'audit pour identifier la dernière action.
2. Tentez une action corrective (approbation ou rejet explicite).
3. Si le problème persiste, escaladez au support technique avec le numéro de référence du dossier.

### 7.3 Document médical manquant après soumission

Si une demande a été soumise sans document médical valide :
1. Rejetez la demande avec le motif approprié.
2. Notifiez l'auto-école.
3. L'auto-école devra déposer le document et re-soumettre la demande.

### 7.4 Suspicion de fraude ou de falsification

En cas de suspicion :
1. Ne validez pas le dossier concerné.
2. Marquez-le comme "En attente" le temps de l'investigation.
3. Consultez les journaux d'audit pour retracer les actions sur le dossier.
4. Signalez à votre responsable hiérarchique avec les références complètes.

---

## 8. Vérification des numéros de référence

### 8.1 Structure des références

**Demande individuelle :**
```
SP - 2026 - A1B2C3
│    │       └── 6 premiers caractères hexadécimaux de l'UUID du dossier
│    └── Année de validation
└── Préfixe demande individuelle
```

**Réservation de session :**
```
BK - 2026 - D4E5F6
│    │       └── 6 premiers caractères hexadécimaux de l'UUID de la réservation
│    └── Année de la réservation/approbation
└── Préfixe réservation de session
```

### 8.2 Utilisation au centre d'examen

Le jour de l'examen, chaque candidat doit présenter :
- Sa convocation imprimée avec le numéro de référence
- Sa pièce d'identité nationale (CNI)

Vérifiez que :
1. Le numéro de référence existe dans le système
2. Le nom sur la convocation correspond à la pièce d'identité
3. La date et le centre correspondent à la session du jour

---

## 9. Sécurité et confidentialité

### 9.1 Données personnelles

SunuPermis traite des données personnelles sensibles (identité, documents médicaux, coordonnées). En tant qu'opérateur administrateur, vous êtes soumis aux obligations suivantes :

- Ne consulter que les dossiers relevant de votre périmètre de travail
- Ne pas télécharger ou copier les données personnelles en dehors du cadre professionnel
- Signaler immédiatement tout accès non autorisé ou toute suspicion de fuite de données

### 9.2 Mots de passe et sessions

- Ne jamais laisser une session ouverte sur un poste non sécurisé
- Déconnectez-vous systématiquement après chaque session de travail
- En cas de doute sur la sécurité de votre compte, changez immédiatement votre mot de passe et prévenez le responsable technique

### 9.3 Journaux et responsabilité

Toutes vos actions sur la plateforme sont tracées et associées à votre identifiant. Cette traçabilité est une protection pour vous et une garantie d'intégrité du système.

### 9.4 Documents médicaux

Les documents médicaux sont des données de santé à caractère personnel. Leur consultation est restreinte aux agents autorisés et ne doit se faire que dans le cadre de la validation du dossier. Toute consultation est enregistrée.

---

## 10. Escalades et contacts

### 10.1 Problèmes techniques

Pour les incidents techniques de la plateforme (bugs, accès impossible, données incorrectes) :

| Niveau | Contact |
|---|---|
| Premier niveau | Responsable technique de votre direction |
| Deuxième niveau | Équipe technique SunuPermis |

Lors d'un signalement, fournissez toujours :
- Le numéro de référence du dossier concerné
- L'action tentée et le message d'erreur exact
- Votre identifiant agent

### 10.2 Incidents de sécurité

Pour tout incident de sécurité (accès suspect, données compromises, fraude avérée), escaladez immédiatement à votre responsable hiérarchique et au responsable sécurité désigné.

---

*Document produit par le Ministère des Transports Terrestres — République du Sénégal*
*SunuPermis — Version pilote — CONFIDENTIEL*
*Diffusion restreinte aux agents administrateurs autorisés*
