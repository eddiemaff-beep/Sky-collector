# Sky Collector

A one-minute browser game. Catch falling shapes with a basket you move by tap, click, or the arrow keys.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints. On a phone, use the network address from that same output.

```bash
npm run build
npm run preview
```

## How to play

- Tap or click where the basket should go. Drag and it follows your finger.
- Arrow keys, or A and D, also slide the basket.
- A catch scores 1. A small shape with a white ring scores 2.
- A miss costs 1 point. The score never goes below 0.
- You have 60 seconds. Shapes fall faster as the clock runs down.
- Pause, mute, and reset sit in the header.
- Your best score and the last eight runs stay on this device.

## Stack

React, TypeScript, Vite, Tailwind CSS, and an HTML canvas. No account is required.

## GitLab CI

This repo includes [`.gitlab-ci.yml`](.gitlab-ci.yml). On every push it installs dependencies and runs `npm run build`. Pushes to the default branch also publish `dist` to GitLab Pages.

1. Create an empty project on GitLab named `sky-collector`. Do not add a README.
2. From this folder:

```bash
git init
git add .
git commit -m "Add Sky Collector"
git branch -M main
git remote add origin git@gitlab.com:YOUR_USER/sky-collector.git
git push -u origin main
```

3. Open **Build → Pipelines**. The `pages` job publishes the game.
4. The playable URL is under **Deploy → Pages**, usually `https://YOUR_USER.gitlab.io/sky-collector/`.
