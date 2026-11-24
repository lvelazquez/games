import "./style.css";
import {
  COLOR_BACKGROUND,
  COLOR_DIM,
  COLOR_FOREGROUND,
  COURT_HEIGHT,
  COURT_WIDTH,
  FONT_HINT,
  FONT_MESSAGE,
  FONT_SCORE,
  MAX_FRAME_SECONDS,
  NET_DASH,
  NET_GAP,
  NET_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  POINTER_DEAD_ZONE,
  REDUCED_MOTION_TIME_SCALE,
  BALL_SIZE,
  WINNING_SCORE,
} from "./constants";
import {
  CPU_X,
  PLAYER_X,
  type Direction,
  type GameState,
  createState,
  start,
  step,
  togglePause,
  winner,
} from "./logic";

const UP_KEYS = new Set(["ArrowUp", "w", "W"]);
const DOWN_KEYS = new Set(["ArrowDown", "s", "S"]);

const TEMPLATE = `
  <canvas width="${COURT_WIDTH}" height="${COURT_HEIGHT}" tabindex="0"
    aria-label="Pong court. Press Space or Enter to start."></canvas>
  <div class="controls">
    <button type="button" data-action="up" aria-label="Move paddle up">&#9650;</button>
    <button type="button" data-action="toggle">Start</button>
    <button type="button" data-action="restart">Restart</button>
    <button type="button" data-action="down" aria-label="Move paddle down">&#9660;</button>
  </div>
  <p class="status" role="status" aria-live="polite"></p>
  <p class="help">
    Move: <kbd>W</kbd>/<kbd>S</kbd> or <kbd>&uarr;</kbd>/<kbd>&darr;</kbd>, or drag on the court.
    Start/resume: <kbd>Space</kbd>. Pause: <kbd>P</kbd>. Restart: <kbd>R</kbd>.
    First to ${WINNING_SCORE} wins.
  </p>`;

class PongGame extends HTMLElement {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private toggleButton!: HTMLButtonElement;
  private statusEl!: HTMLElement;
  private state: GameState = createState();
  private keyDirection: Direction = 0;
  private buttonDirection: Direction = 0;
  private pointerY: number | null = null;
  private lastTime: number | null = null;
  private frame = 0;
  private lastAnnounced = "";
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  connectedCallback(): void {
    this.innerHTML = TEMPLATE;
    this.canvas = this.querySelector("canvas") as HTMLCanvasElement;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      this.textContent = "Canvas is not supported in this browser.";
      return;
    }
    this.ctx = ctx;
    this.toggleButton = this.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    this.statusEl = this.querySelector(".status") as HTMLElement;

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("blur", this.autoPause);
    this.canvas.addEventListener("pointerdown", this.onPointer);
    this.canvas.addEventListener("pointermove", this.onPointer);
    this.canvas.addEventListener("pointerup", this.onPointerEnd);
    this.canvas.addEventListener("pointercancel", this.onPointerEnd);
    this.addEventListener("click", this.onClick);
    this.bindHold("up", -1);
    this.bindHold("down", 1);

    this.sync();
    this.frame = requestAnimationFrame(this.tick);
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.frame);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("blur", this.autoPause);
  }

  private bindHold(action: string, dir: Direction): void {
    const button = this.querySelector(`[data-action="${action}"]`) as HTMLElement;
    const release = () => {
      this.buttonDirection = 0;
    };
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.buttonDirection = dir;
      this.autoStart();
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  }

  /** Moving the paddle while paused/ready should not silently do nothing. */
  private autoStart(): void {
    if (this.state.phase === "ready") this.setState(start(this.state));
  }

  private setState(next: GameState): void {
    this.state = next;
    this.sync();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (UP_KEYS.has(e.key)) {
      this.keyDirection = -1;
      e.preventDefault();
    } else if (DOWN_KEYS.has(e.key)) {
      this.keyDirection = 1;
      e.preventDefault();
    } else if (e.key === " " || e.key === "Enter") {
      // Let focused buttons handle their own activation.
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      this.toggleOrStart();
    } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      this.setState(togglePause(this.state));
    } else if (e.key === "r" || e.key === "R") {
      this.restart();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (UP_KEYS.has(e.key) && this.keyDirection === -1) this.keyDirection = 0;
    if (DOWN_KEYS.has(e.key) && this.keyDirection === 1) this.keyDirection = 0;
  };

  private onClick = (e: Event): void => {
    const action = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")
      ?.dataset.action;
    if (action === "toggle") this.toggleOrStart();
    else if (action === "restart") this.restart();
  };

  private toggleOrStart(): void {
    const { phase } = this.state;
    this.setState(phase === "playing" ? togglePause(this.state) : start(this.state));
  }

  private restart(): void {
    this.setState(start({ ...this.state, phase: "over" }));
  }

  private autoPause = (): void => {
    if (this.state.phase === "playing") this.setState(togglePause(this.state));
  };

  private onVisibility = (): void => {
    if (document.hidden) this.autoPause();
  };

  private onPointer = (e: PointerEvent): void => {
    if (e.type === "pointermove" && e.pointerType === "mouse" && e.buttons === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerY = ((e.clientY - rect.top) / rect.height) * COURT_HEIGHT;
    if (e.type === "pointerdown") {
      this.canvas.setPointerCapture(e.pointerId);
      this.autoStart();
    }
  };

  private onPointerEnd = (): void => {
    this.pointerY = null;
  };

  private direction(): Direction {
    if (this.pointerY !== null) {
      const diff = this.pointerY - (this.state.playerY + PADDLE_HEIGHT / 2);
      if (Math.abs(diff) > POINTER_DEAD_ZONE) return diff > 0 ? 1 : -1;
      return 0;
    }
    return this.keyDirection !== 0 ? this.keyDirection : this.buttonDirection;
  }

  private tick = (time: number): void => {
    const elapsed = this.lastTime === null ? 0 : (time - this.lastTime) / 1000;
    this.lastTime = time;
    const scale = this.reducedMotion.matches ? REDUCED_MOTION_TIME_SCALE : 1;
    const dt = Math.min(elapsed, MAX_FRAME_SECONDS) * scale;
    const before = this.state;
    this.state = step(this.state, this.direction(), dt);
    if (
      before.phase !== this.state.phase ||
      before.playerScore !== this.state.playerScore ||
      before.cpuScore !== this.state.cpuScore
    ) {
      this.sync();
    }
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  /** Update button label, accessible name and live region from state. */
  private sync(): void {
    const { phase, playerScore, cpuScore } = this.state;
    const label = { ready: "Start", playing: "Pause", paused: "Resume", over: "Play again" }[phase];
    this.toggleButton.textContent = label;
    const score = `You ${playerScore}, computer ${cpuScore}.`;
    let message = score;
    if (phase === "ready") message = "Press Space or Start to play.";
    else if (phase === "paused") message = `Paused. ${score}`;
    else if (phase === "over") {
      message = `${winner(this.state) === "player" ? "You win" : "Computer wins"}. Final score ${score}`;
    }
    this.canvas.setAttribute("aria-label", `Pong court. ${message}`);
    if (message !== this.lastAnnounced) {
      this.statusEl.textContent = message;
      this.lastAnnounced = message;
    }
  }

  private draw(): void {
    const { ctx, state } = this;
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

    ctx.fillStyle = COLOR_DIM;
    for (let y = 0; y < COURT_HEIGHT; y += NET_DASH + NET_GAP) {
      ctx.fillRect((COURT_WIDTH - NET_WIDTH) / 2, y, NET_WIDTH, NET_DASH);
    }

    ctx.fillStyle = COLOR_FOREGROUND;
    ctx.textAlign = "center";
    ctx.font = FONT_SCORE;
    ctx.fillText(String(state.playerScore), COURT_WIDTH / 4, 64);
    ctx.fillText(String(state.cpuScore), (COURT_WIDTH * 3) / 4, 64);

    ctx.fillRect(PLAYER_X, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CPU_X, state.cpuY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

    if (state.phase !== "playing") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
      ctx.fillStyle = COLOR_FOREGROUND;
      const title = {
        ready: "PONG",
        paused: "PAUSED",
        over: winner(state) === "player" ? "YOU WIN" : "COMPUTER WINS",
        playing: "",
      }[state.phase];
      const hint = state.phase === "paused" ? "Space to resume" : "Space or tap to play";
      ctx.font = FONT_MESSAGE;
      ctx.fillText(title, COURT_WIDTH / 2, COURT_HEIGHT / 2 - 8);
      ctx.font = FONT_HINT;
      ctx.fillText(hint, COURT_WIDTH / 2, COURT_HEIGHT / 2 + 24);
    }
  }
}

customElements.define("pong-game", PongGame);
