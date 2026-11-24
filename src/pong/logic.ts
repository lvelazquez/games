import {
  BALL_MAX_SPEED,
  BALL_SIZE,
  BALL_SPEEDUP,
  BALL_START_SPEED,
  COURT_HEIGHT,
  COURT_WIDTH,
  CPU_DEAD_ZONE,
  CPU_SPEED,
  MAX_BOUNCE_ANGLE,
  MAX_SERVE_ANGLE,
  PADDLE_HEIGHT,
  PADDLE_MARGIN,
  PADDLE_WIDTH,
  PLAYER_SPEED,
  WINNING_SCORE,
} from "./constants";

export type Phase = "ready" | "playing" | "paused" | "over";
export type Direction = -1 | 0 | 1;

export interface GameState {
  phase: Phase;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  /** Top edge of each paddle. */
  playerY: number;
  cpuY: number;
  playerScore: number;
  cpuScore: number;
}

export const PLAYER_X = PADDLE_MARGIN;
export const CPU_X = COURT_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH;

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

const centeredPaddleY = (): number => (COURT_HEIGHT - PADDLE_HEIGHT) / 2;

/** Place the ball in the centre moving towards `direction` (1 = right). */
export function serve(
  state: GameState,
  direction: 1 | -1,
  random: () => number = Math.random,
): GameState {
  const angle = (random() * 2 - 1) * MAX_SERVE_ANGLE;
  return {
    ...state,
    ballX: (COURT_WIDTH - BALL_SIZE) / 2,
    ballY: (COURT_HEIGHT - BALL_SIZE) / 2,
    ballVX: Math.cos(angle) * BALL_START_SPEED * direction,
    ballVY: Math.sin(angle) * BALL_START_SPEED,
  };
}

export function createState(random: () => number = Math.random): GameState {
  return serve(
    {
      phase: "ready",
      ballX: 0,
      ballY: 0,
      ballVX: 0,
      ballVY: 0,
      playerY: centeredPaddleY(),
      cpuY: centeredPaddleY(),
      playerScore: 0,
      cpuScore: 0,
    },
    random() < 0.5 ? 1 : -1,
    random,
  );
}

/** Start from ready, resume from paused, or restart from over. */
export function start(state: GameState, random?: () => number): GameState {
  if (state.phase === "over") {
    return { ...createState(random), phase: "playing" };
  }
  return { ...state, phase: "playing" };
}

export function togglePause(state: GameState): GameState {
  if (state.phase === "playing") return { ...state, phase: "paused" };
  if (state.phase === "paused") return { ...state, phase: "playing" };
  return state;
}

/** Vertical speed the computer paddle should use to track the ball. */
export function cpuDirection(state: GameState): Direction {
  const diff = state.ballY + BALL_SIZE / 2 - (state.cpuY + PADDLE_HEIGHT / 2);
  if (Math.abs(diff) < CPU_DEAD_ZONE) return 0;
  return diff > 0 ? 1 : -1;
}

function bounceOffPaddle(
  state: GameState,
  paddleY: number,
  towards: 1 | -1,
): GameState {
  const relative =
    (state.ballY + BALL_SIZE / 2 - (paddleY + PADDLE_HEIGHT / 2)) /
    (PADDLE_HEIGHT / 2);
  const angle = clamp(relative, -1, 1) * MAX_BOUNCE_ANGLE;
  const speed = Math.min(
    Math.hypot(state.ballVX, state.ballVY) * BALL_SPEEDUP,
    BALL_MAX_SPEED,
  );
  return {
    ...state,
    ballVX: Math.cos(angle) * speed * towards,
    ballVY: Math.sin(angle) * speed,
  };
}

const overlapsVertically = (ballY: number, paddleY: number): boolean =>
  ballY + BALL_SIZE >= paddleY && ballY <= paddleY + PADDLE_HEIGHT;

/**
 * Advance the simulation by `dt` seconds. Pure: returns a new state and does
 * nothing unless the phase is "playing".
 */
export function step(
  prev: GameState,
  playerDirection: Direction,
  dt: number,
  random: () => number = Math.random,
): GameState {
  if (prev.phase !== "playing") return prev;

  const maxPaddleY = COURT_HEIGHT - PADDLE_HEIGHT;
  let state: GameState = {
    ...prev,
    playerY: clamp(prev.playerY + playerDirection * PLAYER_SPEED * dt, 0, maxPaddleY),
    cpuY: clamp(prev.cpuY + cpuDirection(prev) * CPU_SPEED * dt, 0, maxPaddleY),
    ballX: prev.ballX + prev.ballVX * dt,
    ballY: prev.ballY + prev.ballVY * dt,
  };

  // Walls
  const maxBallY = COURT_HEIGHT - BALL_SIZE;
  if (state.ballY <= 0) {
    state = { ...state, ballY: 0, ballVY: Math.abs(state.ballVY) };
  } else if (state.ballY >= maxBallY) {
    state = { ...state, ballY: maxBallY, ballVY: -Math.abs(state.ballVY) };
  }

  // Paddles (only when moving towards them, so a hit is resolved once)
  if (
    state.ballVX < 0 &&
    state.ballX <= PLAYER_X + PADDLE_WIDTH &&
    state.ballX + BALL_SIZE >= PLAYER_X &&
    overlapsVertically(state.ballY, state.playerY)
  ) {
    state = {
      ...bounceOffPaddle(state, state.playerY, 1),
      ballX: PLAYER_X + PADDLE_WIDTH,
    };
  } else if (
    state.ballVX > 0 &&
    state.ballX + BALL_SIZE >= CPU_X &&
    state.ballX <= CPU_X + PADDLE_WIDTH &&
    overlapsVertically(state.ballY, state.cpuY)
  ) {
    state = {
      ...bounceOffPaddle(state, state.cpuY, -1),
      ballX: CPU_X - BALL_SIZE,
    };
  }

  // Scoring
  if (state.ballX + BALL_SIZE < 0) {
    const cpuScore = state.cpuScore + 1;
    state = serve({ ...state, cpuScore }, -1, random);
    if (cpuScore >= WINNING_SCORE) state = { ...state, phase: "over" };
  } else if (state.ballX > COURT_WIDTH) {
    const playerScore = state.playerScore + 1;
    state = serve({ ...state, playerScore }, 1, random);
    if (playerScore >= WINNING_SCORE) state = { ...state, phase: "over" };
  }

  return state;
}

export function winner(state: GameState): "player" | "cpu" | null {
  if (state.phase !== "over") return null;
  return state.playerScore > state.cpuScore ? "player" : "cpu";
}
