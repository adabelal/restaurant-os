# Automation Gmail - Scanner & Nettoyeur

Ce projet vous permet de scanner votre boîte Gmail pour trouver des factures, télécharger les pièces jointes et nettoyer/trier vos emails.

## 1. Prérequis : Obtenir les identifiants Google (credentials.json)

Pour que ce script puisse accéder à votre compte de manière sécurisée, vous devez créer un projet sur la Google Cloud Console.

1.  Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2.  Créez un **Nouveau Projet** (ex: "Gmail-Cleaner").
3.  Allez dans **APIs & Services** > **Bibliothèque** (Library).
4.  Cherchez **"Gmail API"** et cliquez sur **Activer**.
5.  Allez dans **APIs & Services** > **Identifiants** (Credentials).
6.  Cliquez sur **Créer des identifiants** > **ID client OAuth**.
    *   **Type d'application** : Application de bureau (Desktop app).
    *   **Nom** : "Gmail Script" (ou autre).
7.  Cliquez sur **Télécharger le fichier JSON** (icône de téléchargement).
8.  **Renommez** ce fichier `credentials.json` et **glissez-le** dans ce dossier : `/Users/adambelal/Desktop/Mail`.
9.  Ensuite, allez dans **Ecran de consentement OAuth** (OAuth consent screen) :
    *   Ajoutez votre propre adresse email comme **Utilisateur test** (Test user) sinon la connexion sera bloquée.

## 2. Installation

Une fois le fichier `credentials.json` présent, je m'occupe d'installer les dépendances et de lancer le script.
