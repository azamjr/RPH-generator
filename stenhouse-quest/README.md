# Stenhouse Quest — Classroom Battle Academy

An original monster-battle themed quiz web app inspired by the classroom inquiry process described by Lawrence Stenhouse. Designed for teachers, teacher trainees, and university curriculum students.

## Play locally

Open `index.html` in Chrome, Edge, Firefox, or Safari. No installation, internet, or account is required.

## Explore the island

1. Choose a trainer name and a creature companion, then select **EXPLORE THE ISLAND**.
2. Walk across five connected pixel-art zones using arrow keys / WASD, the on-screen D-pad, or by tapping a map tile.
3. Approach a glowing encounter marker. Press **E**, **Space**, or the **BATTLE** button to face a classroom scenario. Tapping the creature on the map walks up to it and starts the battle.
4. Answer the quiz question to earn points and XP, then return to the map to find the next encounter.
5. Clear all 10 encounters to see your score and local leaderboard.

Use **GUIDE ME** to walk automatically towards the next active creature. Cleared encounters are marked with a check; future encounters remain locked until earlier ones are cleared.

## Features

- Exactly 10 multiple-choice questions about Stenhouse’s Process Model
- Four stages: principle, try, observe, revise
- Maths teaching cases with fruit grouping and counting
- Three original pixel-art companions: Leaflet, Flarefox, Bubblo
- Battle animations, health, levels, score and streaks
- Optional original synthesized music and sound effects
- On-device top-10 leaderboard (stored in the same browser using localStorage; not shared online)
- Walkable pixel-art world with a moving trainer, companion follower, areas, animated environment, and camera scrolling
- Keyboard, touch D-pad, and click-to-walk controls; pathfinding and interactive battle markers
- Responsive interface for mobile and desktop, with keyboard access

## Public deployment

- Live game: https://stenhouse-quest-azam.onrender.com
- GitHub source: https://github.com/azamjr/RPH-generator/tree/stenhouse-quest/stenhouse-quest
- Render publishes the `stenhouse-quest` directory from branch `stenhouse-quest` and is set to auto-deploy after each push.

The game can also run from `index.html` offline without any external assets. The hosting configuration does not change the `main` branch of the existing RPH-generator project.

## Classroom leaderboard note

The leaderboard is **local to a browser** and does not sync results across students' devices. A shared, online leaderboard would require an authenticated backend/database and consent/privacy decisions. Students can compete on the same classroom device without setting that up.

## Source material

Learning concepts adapted from https://stenhouse-classroom-lab.leafy-wren-7212.chatgpt.site/ and the reference cited there: Stenhouse, L. (1975). *An Introduction to Curriculum Research and Development*.

## IP notice

This uses entirely original creature characters and game artwork. It is not an official Pokémon or Nintendo product and does not use their assets.