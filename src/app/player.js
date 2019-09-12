export default class Player {
  constructor(sA, sS, x, y) {
    this.sA = sA;
    this.cS = sS;
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.ddx = 0;
    this.ddy = 0;
    this.mdx = 8 * 7;
    this.mdy = 8 * 20;
    this.l = false;
    this.r = false;
    this.j = false;
    this.st = false;
    this.jm = false;
    this.fal = false;
    this.cli = false;
    this.f = this.mdx / (1 / 20);
    this.a = this.mdx / (1 / 10);
    this.i = 8 * 1700;
    this.c = {
      m: 0,
      c: 0,
      x: 0,
      y: 0,
      n: 0
    };
    this.k = [];
    this.cs = [];
    this.g = [];
    this.win = false;
    this.s = 120;
    this.d = 0;
  }
}
