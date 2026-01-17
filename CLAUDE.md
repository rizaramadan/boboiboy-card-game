# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BoBoiBoy Card Game - A mobile browser-based vertical runner game (Temple Run style) where players photograph physical trading cards to extract character images and stats (health/attack power), then play as that character battling monsters coming from above.

## Game Concept

- **Card Scanning**: Players use device camera to capture trading cards
- **OCR/Vision**: Extract attack power and health numbers from card
- **Character Extraction**: Isolate the character artwork from the card background
- **Runner Gameplay**: 3-lane vertical runner where hero smashes through monsters whose health is lower than hero's attack power

## Tech Stack

- **Framework**: Phaser 3 (2D game engine optimized for mobile browsers)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Camera/Vision**: Browser MediaDevices API + Tesseract.js for OCR

## Build Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Production build
npm run preview    # Preview production build
```

## Architecture

```
src/
├── main.ts               # Phaser game config and entry point
├── config/
│   └── GameConfig.ts     # Game constants (lanes, speeds, positions)
├── scenes/
│   ├── BootScene.ts      # Asset preloading, placeholder graphics
│   ├── MenuScene.ts      # Main menu
│   ├── CameraScene.ts    # Card capture interface
│   └── GameScene.ts      # Runner gameplay
├── systems/
│   ├── CardScanner.ts    # Camera + OCR processing
│   └── LaneManager.ts    # 3-lane movement logic
└── entities/
    ├── Hero.ts           # Player character at bottom
    └── Monster.ts        # Enemies spawning from top
```

## Key Game Mechanics

- Hero stays at bottom of screen in one of 3 vertical lanes
- Monsters spawn from top and move downward
- Swipe left/right or use Arrow Keys (←/→) or A/D to change lanes
- Hero smashes through monsters when attack > monster health
- Taking damage when colliding with stronger monsters
- Game over when hero health reaches zero
