# JDIS Games 2025 Starter Kit - Typescript

Le kit de démarrage est un projet TypeScript qui vous permet de commencer rapidement à développer un bot pour les JDIS Games 2025. Il contient tous les types nécessaires pour communiquer avec le serveur et pour gérer les données du jeu.

## Installation

Vous allez avoir besoin de [Bun](https://bun.sh/). Une fois bien installé, vous pouvez installer les dépendances du projet en exécutant la commande suivante :

```bash
bun install
```

## Usage

Assurez-vous d'avoir bien mis votre token de connexion dans [index.ts](./index.ts).

Pour démarrer le bot en mode développement (avec hot reload) :

```bash
bun dev
# ou
bun dev:ranked
```

Pour démarrer le bot normalement :

```bash
bun start
# ou
bun start:ranked
```

Les commandes ranked démarrent le bot en se connectant au serveur classé, alors que les commandes non-ranked démarrent le bot en se connectant au playground.

## Format

Le projet viens avec [Biome.js](https://biomejs.dev/), un outil de formatage de code qui vous permet de formater votre code de manière cohérente et standardisée.

Pour formater votre code, vous pouvez utiliser une de leurs [extensions](https://biomejs.dev/guides/editors/first-party-extensions/) ou exécuter la commande suivante :

```bash
bun check:write
```
