/** Logical court size; the canvas is scaled to fit the viewport. */
export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 500;

export const PADDLE_WIDTH = 12;
export const PADDLE_HEIGHT = 80;
export const PADDLE_MARGIN = 24;
/** Player paddle speed in court units per second. */
export const PLAYER_SPEED = 420;
/** Computer paddle is slower than the player so it can be beaten. */
export const CPU_SPEED = 300;
/** Computer ignores ball offsets smaller than this (units) to avoid jitter. */
export const CPU_DEAD_ZONE = 10;

export const BALL_SIZE = 12;
export const BALL_START_SPEED = 320;
export const BALL_MAX_SPEED = 680;
/** Speed multiplier applied on every paddle hit. */
export const BALL_SPEEDUP = 1.06;
/** Maximum deflection angle off a paddle edge, in radians. */
export const MAX_BOUNCE_ANGLE = Math.PI / 3;
/** Maximum serve angle from horizontal, in radians. */
export const MAX_SERVE_ANGLE = Math.PI / 6;

export const WINNING_SCORE = 7;
/** Longest simulated frame, so a background tab cannot teleport the ball. */
export const MAX_FRAME_SECONDS = 0.05;

export const COLOR_BACKGROUND = "#000000";
export const COLOR_FOREGROUND = "#ffffff";
export const COLOR_DIM = "rgba(255, 255, 255, 0.35)";
export const FONT_SCORE = "48px monospace";
export const FONT_MESSAGE = "24px monospace";
export const FONT_HINT = "16px monospace";
export const NET_DASH = 14;
export const NET_GAP = 12;
export const NET_WIDTH = 4;

/** Simulation speed multiplier when the user prefers reduced motion. */
export const REDUCED_MOTION_TIME_SCALE = 0.65;
/** Pointer/touch drag: ignore target offsets smaller than this (units). */
export const POINTER_DEAD_ZONE = 6;
