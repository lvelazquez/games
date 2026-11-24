import { describe, expect, it } from "vitest";
import {
  BALL_SIZE,
  COURT_HEIGHT,
  COURT_WIDTH,
  PADDLE_HEIGHT,
  WINNING_SCORE,
} from "./constants";
import {
  CPU_X,
  PLAYER_X,
  type GameState,
  createState,
  cpuDirection,
  start,
  step,
  togglePause,
  winner,
} from "./logic";

const fixed = () => 0.5;
const playing = (over: Partial<GameState> = {}): GameState => ({
  ...createState(fixed),
  phase: "playing",
  ...over,
});

describe("phases", () => {
  it("does not advance while ready or paused", () => {
    const ready = createState(fixed);
    expect(step(ready, 1, 0.016, fixed)).toBe(ready);
    const paused = togglePause(playing());
    expect(paused.phase).toBe("paused");
    expect(step(paused, 1, 0.016, fixed)).toBe(paused);
    expect(togglePause(paused).phase).toBe("playing");
  });

  it("togglePause ignores ready and over", () => {
    const ready = createState(fixed);
    expect(togglePause(ready)).toBe(ready);
  });

  it("start resets scores after game over", () => {
    const over = playing({ phase: "over", playerScore: 7, cpuScore: 3 });
    const next = start(over, fixed);
    expect(next.phase).toBe("playing");
    expect(next.playerScore).toBe(0);
    expect(next.cpuScore).toBe(0);
  });
});

describe("movement", () => {
  it("clamps the player paddle to the court", () => {
    let s = playing({ playerY: 0, ballVX: 0, ballVY: 0 });
    s = step(s, -1, 0.05, fixed);
    expect(s.playerY).toBe(0);
    s = playing({ playerY: COURT_HEIGHT - PADDLE_HEIGHT, ballVX: 0, ballVY: 0 });
    s = step(s, 1, 0.05, fixed);
    expect(s.playerY).toBe(COURT_HEIGHT - PADDLE_HEIGHT);
  });

  it("bounces off the top and bottom walls", () => {
    const top = step(playing({ ballY: 1, ballVY: -300, ballVX: 0 }), 0, 0.05, fixed);
    expect(top.ballY).toBe(0);
    expect(top.ballVY).toBeGreaterThan(0);
    const bottom = step(
      playing({ ballY: COURT_HEIGHT - BALL_SIZE - 1, ballVY: 300, ballVX: 0 }),
      0,
      0.05,
      fixed,
    );
    expect(bottom.ballVY).toBeLessThan(0);
  });

  it("computer paddle tracks the ball", () => {
    expect(cpuDirection(playing({ cpuY: 0, ballY: 400 }))).toBe(1);
    expect(cpuDirection(playing({ cpuY: 400, ballY: 0 }))).toBe(-1);
    expect(
      cpuDirection(playing({ cpuY: 100, ballY: 100 + PADDLE_HEIGHT / 2 - BALL_SIZE / 2 })),
    ).toBe(0);
  });
});

describe("paddles and scoring", () => {
  it("returns the ball and speeds it up on a player hit", () => {
    const s = playing({
      playerY: 200,
      ballX: PLAYER_X + 4,
      ballY: 200 + PADDLE_HEIGHT / 2 - BALL_SIZE / 2,
      ballVX: -300,
      ballVY: 0,
    });
    const next = step(s, 0, 0.001, fixed);
    expect(next.ballVX).toBeGreaterThan(300);
  });

  it("returns the ball on a computer hit", () => {
    const s = playing({
      cpuY: 200,
      ballX: CPU_X - BALL_SIZE + 2,
      ballY: 200 + PADDLE_HEIGHT / 2 - BALL_SIZE / 2,
      ballVX: 300,
      ballVY: 0,
    });
    const next = step(s, 0, 0.001, fixed);
    expect(next.ballVX).toBeLessThan(0);
  });

  it("awards the player a point when the ball leaves the right edge", () => {
    const s = playing({ ballX: COURT_WIDTH - 1, ballVX: 300, ballVY: 0, cpuY: 0 });
    const next = step(s, 0, 0.05, fixed);
    expect(next.playerScore).toBe(1);
    expect(next.ballX).toBeLessThan(COURT_WIDTH);
  });

  it("ends the game at the winning score", () => {
    const s = playing({
      playerScore: WINNING_SCORE - 1,
      ballX: COURT_WIDTH - 1,
      ballVX: 300,
      ballVY: 0,
      cpuY: 0,
    });
    const next = step(s, 0, 0.05, fixed);
    expect(next.phase).toBe("over");
    expect(winner(next)).toBe("player");
  });

  it("awards the computer a point when the ball leaves the left edge", () => {
    const s = playing({ ballX: -BALL_SIZE + 1, ballVX: -300, ballVY: 0, playerY: 400 });
    const next = step(s, 0, 0.05, fixed);
    expect(next.cpuScore).toBe(1);
  });
});
