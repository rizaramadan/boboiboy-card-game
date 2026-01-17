export const GAME_CONFIG = {
  // Screen dimensions
  WIDTH: 720,
  HEIGHT: 1280,

  // Lane configuration (vertical columns: left, middle, right)
  LANES: {
    COUNT: 3,
    X_POSITIONS: [180, 360, 540], // Left, Middle, Right lane X positions
    SWITCH_DURATION: 150, // ms to switch lanes
  },

  // Hero settings (at bottom of screen)
  HERO: {
    Y_POSITION: 1050,
    DEFAULT_HEALTH: 100,
    DEFAULT_ATTACK: 45,
  },

  // Monster settings (spawn from top, move down)
  MONSTER: {
    SPAWN_Y: -100,
    MIN_HEALTH: 20,
    MAX_HEALTH: 100,
    SPEED: 300,
  },

  // Game speed
  SCROLL_SPEED: 300,
  SPAWN_INTERVAL: 1500, // ms between monster spawns
  
  // Speed scaling (game gets faster with higher score)
  SPEED_SCALING: {
    SCORE_PER_LEVEL: 200,      // Score needed to increase difficulty level
    MAX_SPEED_MULTIPLIER: 2.5, // Maximum speed multiplier
    SPEED_INCREMENT: 0.15,     // Speed increase per level
    MIN_SPAWN_INTERVAL: 600,   // Minimum spawn interval (ms)
    SPAWN_REDUCTION: 100,      // Spawn interval reduction per level (ms)
  },
};
