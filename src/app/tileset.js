export default class Tileset {
  constructor(i, tW, tH, tI, ctx) {
    this.i = new Image();
    this.i.src = i;
    this.tW = tW;
    this.tH = tH;
    this.tI = tI;

    this.i.onload = function () {
      ctx.imageSmoothingEnabled = false;
    }
  }
}