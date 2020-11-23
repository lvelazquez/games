enum KeyCodes {
  ArrowUp = 38,
  ArrowLeft = 39,
  ArrowRight = 37,
  ArrowDown = 40,
  Backspace = 8,
  a = 65,
  b = 66,
  c = 67,
  d = 68,
  e = 69,
  f = 70,
  g = 71,
  h = 72,
  i = 73,
  j = 74,
  k = 75,
  l = 76,
  m = 77,
  n = 78,
  o = 79,
  p = 80,
  q = 81,
  r = 82,
  s = 83,
  t = 84,
  u = 85,
  v = 86,
  w = 87,
  x = 88,
  y = 89,
  z = 90
}

const color = {
  DARK: "#000000",
  LIGHT: "#FFFFFF"
};

// create player controls
// setup board
// make computer player
// ParticleBase, PlayerEventsBase
// PongComputer, PongPlayer, PongBall

class Vector {
  public x: number = 0;
  public y: number = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public static add(v1: Vector, v2: Vector) {
    return new Vector(v1.x + v2.y, v1.y + v2.y);
  }

  public static sub(v1: Vector, v2: Vector) {
    return new Vector(v1.x - v2.y, v1.y - v2.y);
  }

  public static mult(v1: Vector, scalar: number) {
    return new Vector(v1.x * scalar, v1.y * scalar);
  }

  public static div(v1: Vector, scalar: number) {
    return new Vector(v1.x / scalar, v1.y / scalar);
  }
}

class Particle {
  public acceleration: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public position: Vector = new Vector(0, 0);
  constructor(x: number, y: number) {
    this.position = new Vector(x, y);
  }
  public update(): void {
    this.position = Vector.add(this.position, this.velocity);
    this.velocity = Vector.add(this.velocity, this.acceleration);
    Vector.mult(this.acceleration, 0);
  }
}

enum PongState {
  START,
  PLAYING,
  OVER
}

class Pong extends HTMLCanvasElement {
  private state: PongState = PongState.START;
  private context: CanvasRenderingContext2D;
  constructor() {
    super();
    const context: CanvasRenderingContext2D | boolean =
      this.getContext("2d") || false;
    if (context) {
      this.context = context;
    }
  }

  connectedCallback(): void {
    this.ownerDocument.addEventListener("keydown", this.handleKeyDown);
    this.ownerDocument.addEventListener("keydown", this.handleKeyUp);
  }

  disconnectedCallback(): void {
    this.ownerDocument.removeEventListener("keydown", this.handleKeyDown);
    this.ownerDocument.removeEventListener("keydown", this.handleKeyUp);
  }

  handleKeyDown(e: KeyboardEvent): void {}

  handleKeyUp(e: KeyboardEvent): void {}

  initGame() {
    // position paddles to
    // set event
  }

  updateState(): void {
    switch (this.state) {
      case PongState.START:
        break;
      case PongState.PLAYING:
        break;
      case PongState.OVER:
        break;
    }
  }
}

window.addEventListener(
  "load",
  () => {
    customElements.define("pong-game", Pong);
  },
  { once: true }
);
