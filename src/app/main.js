import { LVL } from './levels';
import { timestamp, overlap, t2p, p2t, bound } from './helpers';
import Map from './map';
import Tileset from './tileset';
import Anim from './anim';
import Player from './player';

import { TILES, LOGO, LOGO_2, DEAD } from './constants';

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

canvas.width = 128;
canvas.height = 128;

var mapTileset = new Tileset(TILES, 8, 8, 18, ctx);
var logoTileset = new Tileset(LOGO, 8, 8, 18, ctx);
var logo2Tileset = new Tileset(LOGO_2, 8, 8, 18, ctx);
var deadTileset = new Tileset(DEAD, 8, 8, 18, ctx);

var game = {},
  ground = [],
  doors = [],
  player = {},
  objects = [],
  map = {},
  collision = [],
  checkpoints = [],
  ladders = [],
  traps = [],
  enemies = [],
  bars = [],
  keys = [],
  arrows = [],
  coins = [],
  gems = [],
  play = false,
  exit = {};

var dt = 0,
  now,
  last = timestamp(),
  step = 1 / 100;

function frame() {
  now = timestamp();
  dt = dt + Math.min(1, (now - last) / 1000);
  while (dt > step) {
    dt = dt - step;
    update(step);
  }
  render();
  last = now;
  requestAnimationFrame(frame, canvas);
}

function render() {
  ctx.fillStyle = game.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!game || !game.state) return;

  drawMap();
  drawCheckpoints();
  drawLadders();
  drawTraps();
  drawEnemies();
  drawBars();
  drawKeys();
  drawArrows();
  drawCoins();
  drawGems();
  drawPlayer();

  if (game.state == 'menu') drawLogo();
  if (game.state == 'dead') drawGameOver();
  if (game.state == 'win') drawWin();
}

function drawWin() {
  ctx.drawImage(
    logo2Tileset.i,
    0,
    24,
    160,
    8,
    canvas.width - 25.8 * 4.55,
    60,
    120,
    8
  );

  ctx.drawImage(
    logo2Tileset.i,
    0,
    32,
    160,
    8,
    canvas.width - 23.8 * 4.55,
    80,
    120,
    8
  );
}

function drawLogo() {
  if (game.fps >= 51) {
    ctx.drawImage(
      logo2Tileset.i,
      0,
      0,
      160,
      8,
      canvas.width - 22.8 * 4.55,
      85,
      80,
      8
    );
  }

  ctx.drawImage(
    logoTileset.i,
    0,
    0,
    32,
    24,
    canvas.width - 24.5 * 4.55,
    10,
    32 * 3,
    24 * 3
  );
}

function drawGameOver() {
  if (game.fps >= 51) {
    ctx.drawImage(
      logo2Tileset.i,
      0,
      16,
      160,
      8,
      canvas.width - 22.8 * 4.55,
      85,
      80,
      8
    );
  }

  ctx.drawImage(
    deadTileset.i,
    0,
    0,
    32,
    8,
    canvas.width - 24.5 * 4.55,
    36,
    32 * 3,
    8 * 3
  );
}

function drawEnemies() {
  for (var i = 0; i < enemies.length; i++) {
    var assetY = Math.floor(enemies[i].g / 22);
    if (enemies[i].l) assetY += 1;
    drawElement(game.fps >= 51 ? 16 : 17, assetY, enemies[i].x, enemies[i].y);
  }
}

function drawCoins() {
  for (var i = 0; i < coins.length; i++) {
    if (!player.cs.includes(coins[i].c))
      drawElement(
        game.fps >= 51 ? 3 : 2,
        Math.floor(coins[i].g / 22),
        coins[i].x,
        coins[i].y
      );
  }
}

function drawArrows() {
  for (var i = 0; i < arrows.length; i++) {
    drawElement(
      arrows[i].l ? (game.fps >= 51 ? 15 : 14) : game.fps >= 51 ? 16 : 17,
      Math.floor(arrows[i].g / 22),
      arrows[i].x,
      arrows[i].y
    );
  }
}

function drawBars() {
  for (var i = 0; i < bars.length; i++) {
    drawElement(
      player.k.includes(bars[i].k) ? 1 : (bars[i].g - 1) % 22,
      Math.floor(bars[i].g / 22),
      bars[i].x,
      bars[i].y
    );
  }
}

function drawGems() {
  for (var i = 0; i < gems.length; i++) {
    if (!player.g.includes(gems[i].h))
      drawElement(
        (gems[i].g - 1) % 22,
        Math.floor(gems[i].g / 23),
        gems[i].x,
        gems[i].y
      );
  }
}

function drawKeys() {
  for (var i = 0; i < keys.length; i++) {
    if (!player.k.includes(keys[i].k))
      drawElement(
        (keys[i].g - 1) % 22,
        Math.floor(keys[i].g / 22),
        keys[i].x,
        keys[i].y
      );
  }
}

function drawMap() {
  for (var i = 0; i < ground.length; i++) {
    var assetX = (ground[i] - 1) % 22;
    var assetY = Math.floor(ground[i] / 22);

    if (assetX === 8 && assetY === 1) {
      assetX = game.fps >= 51 ? 7 : assetX;
    } else if (assetX === 10 && assetY === 1) {
      assetX = game.fps >= 51 ? 9 : assetX;
    }

    if (player.win) {
      if (assetX <= 15 && assetX >= 12 && assetY <= 3) assetX += 6;
    }

    drawElement(assetX, assetY, (i % 16) * 8, Math.floor(i / 16) * 8);
  }

  if (game.lvl == 0 && player.g.length && !player.win) {
    for (var j = 0; j < player.g.length; j++) {
      var aY = 4,
        aX,
        pX,
        pY;

      switch (player.g[j]) {
        case 1:
          aX = 20;
          pX = 56;
          pY = 104;
          break;
        case 2:
          aX = 19;
          pX = 64;
          pY = 96;
          break;
        case 3:
          aX = 21;
          pX = 64;
          pY = 104;
          break;
        case 4:
          aX = 18;
          pX = 56;
          pY = 96;
          break;
      }

      drawElement(aX, aY, pX, pY);
    }
  }
}

function drawTraps() {
  for (var i = 0; i < traps.length; i++) {
    var assetX = (traps[i].g - 1) % 22;
    if (assetX == 11) assetX = game.fps >= 51 ? 10 : assetX;
    drawElement(assetX, Math.floor(traps[i].g / 22), traps[i].x, traps[i].y);
  }
}

function drawCheckpoints() {
  for (var i = 0; i < checkpoints.length; i++) {
    var assetX = (checkpoints[i].g - 1) % 22;
    if (checkpoints[i].active) assetX = game.fps >= 51 ? 9 : 10;
    drawElement(
      assetX,
      Math.floor(checkpoints[i].g / 22),
      checkpoints[i].x,
      checkpoints[i].y
    );
  }
}

function drawLadders() {
  for (var i = 0; i < ladders.length; i++) {
    drawElement(
      (ladders[i].g - 1) % 22,
      Math.floor(ladders[i].g / 22),
      ladders[i].x,
      ladders[i].y
    );
  }
}

function drawPlayer() {
  ctx.drawImage(
    player.sA[player.cS].t.i,
    player.sA[player.cS].f[player.sA[player.cS].cF].split(',')[0] * 8,
    player.sA[player.cS].f[player.sA[player.cS].cF].split(',')[1] * 8,
    8,
    8,
    player.x,
    player.y,
    8,
    8
  );
  if (player.c.n > 0) {
    ctx.drawImage(
      logo2Tileset.i,
      0,
      8,
      32,
      8,
      player.x - 12,
      player.y - 12,
      32,
      8
    );

    player.c.n++;
    if (player.c.n > 80) player.c.n = 0;
  }
}

function drawElement(aX, aY, pX, pY) {
  ctx.drawImage(game.currentMap.t.i, aX * 8, aY * 8, 8, 8, pX, pY, 8, 8);
}

function start(lvl = {}) {
  doors = [];
  checkpoints = [];
  ladders = [];
  traps = [];
  enemies = [];
  bars = [];
  keys = [];
  arrows = [];
  coins = [];
  gems = [];

  var lvlNo = lvl.g || 0;
  var pX = lvl.pX || 60;
  var pY = lvl.pY || 104;

  if (player.cS === 'dead') {
    lvlNo = player.c.m || 0;
    pX = player.c.x || 60;
    pY = player.c.y || 104;
  }

  ground = LVL[lvlNo].layers[0].data;
  objects = LVL[lvlNo].layers[2].objects;
  collision = LVL[lvlNo].layers[1].data;
  map = new Map(ground, mapTileset);

  for (var n = 0; n < objects.length; n++) {
    var entity = {};

    switch (objects[n].n) {
      case 'exit':
        entity.x = objects[n].x;
        entity.y = objects[n].y;
        entity.w = objects[n].w;
        entity.h = objects[n].h;

        exit = entity;
        break;
      case 'd':
        entity.x = objects[n].x;
        entity.y = objects[n].y;
        entity.g = objects[n].properties
          ? objects[n].properties[0].value
          : null;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.pX = objects[n].properties
          ? objects[n].properties[1].value
          : null;
        entity.pY = objects[n].properties
          ? objects[n].properties[2].value
          : null;
        doors.push(entity);
        break;
      case 'cp':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.no = objects[n].t;
        entity.m = objects[n].properties
          ? objects[n].properties[0].value
          : null;
        entity.g = objects[n].g;

        if (player && player.c) {
          entity.active = player.c.m === entity.m && player.c.c === entity.no;
        } else {
          entity.active = false;
        }

        checkpoints.push(entity);
        break;
      case 'ld':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;

        ladders.push(entity);
        break;
      case 't':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;

        traps.push(entity);
        break;
      case 'e':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.dx = 0;
        entity.dy = 0;
        entity.ddx = 0;
        entity.ddy = 0;
        entity.mdx = objects[n].properties
          ? objects[n].properties[1].value
          : null;
        entity.mdy = 0;
        entity.l = objects[n].properties
          ? objects[n].properties[0].value
          : null;
        entity.r = objects[n].properties
          ? objects[n].properties[2].value
          : null;
        entity.j = false;
        entity.jm = false;
        entity.fal = false;
        entity.cli = false;
        entity.f = entity.mdx / (1 / 20);
        entity.a = entity.mdx / (1 / 10);
        entity.enemy = true;

        enemies.push(entity);
        break;
      case 'b':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.k = objects[n].properties
          ? objects[n].properties[2].value
          : null;
        entity.cX = objects[n].properties
          ? objects[n].properties[0].value
          : null;
        entity.cY = objects[n].properties
          ? objects[n].properties[1].value
          : null;

        bars.push(entity);
        break;
      case 'k':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.k = objects[n].properties
          ? objects[n].properties[0].value
          : null;

        if (!player.k.includes(entity.k)) keys.push(entity);
        break;
      case 'g':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.h = objects[n].properties
          ? objects[n].properties[0].value
          : null;

        if (!player.g.includes(entity.g)) gems.push(entity);
        break;
      case 'a':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.l = objects[n].properties
          ? objects[n].properties[0].value
          : null;
        entity.r = objects[n].properties
          ? objects[n].properties[1].value
          : null;
        entity.sX = objects[n].properties
          ? objects[n].properties[2].value
          : null;
        entity.sY = objects[n].properties
          ? objects[n].properties[3].value
          : null;

        arrows.push(entity);
        break;
      case 'c':
        entity.x = objects[n].x;
        entity.y = objects[n].y - 8;
        entity.w = objects[n].w;
        entity.h = objects[n].h;
        entity.g = objects[n].g;
        entity.c = objects[n].properties
          ? objects[n].properties[0].value
          : null;

        if (!player.cs.includes(entity.c)) coins.push(entity);
        break;
    }
  }

  if (player && player.x) {
    player.x = pX;
    player.y = pY;
  } else {
    player = new Player(
      {
        idle: new Anim(
          mapTileset,
          [
            '0,4',
            '0,4',
            '0,4',
            '0,4',
            '1,4',
            '6,4',
            '6,4',
            '6,4',
            '6,4',
            '7,4'
          ],
          300
        ),
        left: new Anim(mapTileset, ['5,4', '4,4', '5,4', '4,4'], 100),
        right: new Anim(mapTileset, ['2,4', '3,4', '2,4', '3,4'], 100),
        dead: new Anim(mapTileset, ['10,4'], 50),
        climb: new Anim(mapTileset, ['8,4', '9,4'], 200)
      },
      'idle',
      pX,
      pY
    );
  }

  game = {
    lvl: lvlNo,
    currentMap: map,
    backgroundColor: '#000',
    fps: 0,
    lastfps: 0,
    fpsTimer: 0,
    state: play ? 'play' : 'menu'
  };
}

function update(mod) {
  if (game.state === 'play' || game.state === 'dead') {
    updateEntity(player, mod);
    checkDoors();
    updateCheckpoints();
    checkLadders();
    checkTraps();
    checkBars();
    checkKeys();
    checkCoins();
    checkGems();
    updateEnemies(mod);
    updateArrows();
    checkExit();
  } else if (game.state === 'menu') {
    if (player.st) {
      game.state = 'play';
      play = true;
    }
  }

  if (timestamp() - game.fpsTimer > 1000) {
    game.lastfps = game.fps;
    game.fps = 0;
    game.fpsTimer = timestamp();
  }

  game.fps++;
}

function checkExit() {
  if (player.win && game.lvl == 0) {
    if (overlap(player.x, player.y, 8, 8, exit.x, exit.y, exit.w, exit.h)) {
      game.state = 'win';
    }
  }
}

function updateArrows() {
  for (var n = 0; n < arrows.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        arrows[n].x,
        arrows[n].y,
        arrows[n].w,
        arrows[n].h
      )
    ) {
      killPlayer();
    } else {
      arrows[n].x =
        game.fps % 100
          ? arrows[n].l
            ? arrows[n].x - 0.6
            : arrows[n].x + 0.6
          : arrows[n].x;
      if (arrows[n].x < 0 || arrows[n].x > 128) arrows[n].x = arrows[n].sX;
    }
  }
}

function checkBars() {
  for (var n = 0; n < bars.length; n++) {
    if (player.k.includes(bars[n].k)) {
      collision[bars[n].cX + bars[n].cY * 16] = 0;
    }
  }
}

function checkCoins() {
  for (var n = 0; n < coins.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        coins[n].x,
        coins[n].y,
        coins[n].w,
        coins[n].h
      )
    ) {
      if (!player.cs.includes(coins[n].c)) {
        player.cs.push(coins[n].c);
        player.s += 2;
      }
    }
  }
}

function checkGems() {
  for (var n = 0; n < gems.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        gems[n].x,
        gems[n].y,
        gems[n].w,
        gems[n].h
      )
    ) {
      if (!player.g.includes(gems[n].h)) player.g.push(gems[n].h);
    }
  }

  if (player.g.length === 4) {
    player.win = true;
  }
}

function checkKeys() {
  for (var n = 0; n < keys.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        keys[n].x,
        keys[n].y,
        keys[n].w,
        keys[n].h
      )
    ) {
      if (!player.k.includes(keys[n].k)) player.k.push(keys[n].k);
    }
  }
}

function updateEnemies(mod) {
  for (var n = 0; n < enemies.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        enemies[n].x,
        enemies[n].y,
        enemies[n].w,
        enemies[n].h
      )
    ) {
      killPlayer(player);
      return;
    }
    updateEntity(enemies[n], mod);
  }
}

function checkTraps() {
  for (var n = 0; n < traps.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        traps[n].x,
        traps[n].y,
        traps[n].w,
        traps[n].h
      )
    ) {
      killPlayer();
    }
  }
}

function killPlayer() {
  if (game.state !== 'dead') {
    player.d += 1;
  }

  player.cS = 'dead';
  game.state = 'dead';
  player.dx = player.dy = 0;

  if (player.st) {
    start();
  }
}

function checkLadders() {
  var list = [];
  for (var n = 0; n < ladders.length; n++) {
    list.push(
      overlap(
        player.x,
        player.y,
        8,
        8,
        ladders[n].x,
        ladders[n].y,
        ladders[n].w,
        ladders[n].h
      )
    );
  }

  player.cli = list.includes(true);
}

function updateCheckpoints() {
  for (var n = 0; n < checkpoints.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        checkpoints[n].x,
        checkpoints[n].y,
        checkpoints[n].w,
        checkpoints[n].h
      )
    ) {
      if (!checkpoints[n].active) {
        checkpoints[n].active = true;
        player.c.m = checkpoints[n].m;
        player.c.c = checkpoints[n].no;
        player.c.x = checkpoints[n].x;
        player.c.y = checkpoints[n].y;
        player.c.n = 1;
      }
    }
  }
}

function checkDoors() {
  for (var n = 0; n < doors.length; n++) {
    if (
      overlap(
        player.x,
        player.y,
        8,
        8,
        doors[n].x,
        doors[n].y,
        doors[n].w,
        doors[n].h
      )
    ) {
      start(doors[n]);
    }
  }
}

function updateEntity(entity, mod) {
  entity.cS = 'idle';

  var wasleft = entity.dx < 0,
    wasright = entity.dx > 0,
    falling = entity.fal,
    friction = entity.f * (falling ? 0.5 : 1),
    accel = entity.a * (falling ? 0.5 : 1);

  entity.ddx = 0;
  entity.ddy = 470.4;

  if (entity.l) {
    entity.cS = 'left';
    entity.ddx = entity.ddx - accel;
  } else if (wasleft) {
    entity.ddx = entity.ddx + friction;
  }

  if (entity.r) {
    entity.cS = 'right';
    entity.ddx = entity.ddx + accel;
  } else if (wasright) {
    entity.ddx = entity.ddx - friction;
  }

  if (entity.cli) {
    entity.cS = 'climb';
    if (entity.j) {
      entity.ddy = entity.ddy - entity.i;
      entity.jm = false;
      entity.mdy = 30;
    }
  } else {
    entity.mdy = 8 * 20;

    if (entity.j && !entity.jm && !falling) {
      entity.ddy = entity.ddy - entity.i;
      entity.jm = true;
    }
  }

  entity.x = entity.x + mod * entity.dx;
  entity.y = entity.y + mod * entity.dy;
  entity.dx = bound(entity.dx + mod * entity.ddx, -entity.mdx, entity.mdx);
  entity.dy = bound(entity.dy + mod * entity.ddy, -entity.mdy, entity.mdy);

  if ((wasleft && entity.dx > 0) || (wasright && entity.dx < 0)) {
    entity.dx = 0;
  }

  var tx = p2t(entity.x),
    ty = p2t(entity.y),
    nx = entity.x % 6,
    ny = entity.y % 6,
    cell = cellAvailable(entity.x, entity.y),
    cellright = cellAvailable(entity.x + 8, entity.y),
    celldown = cellAvailable(entity.x, entity.y + 8),
    celldiag = cellAvailable(entity.x + 8, entity.y + 8);

  if (entity.dy > 0) {
    if ((celldown && !cell) || (celldiag && !cellright && nx)) {
      entity.y = t2p(ty);
      entity.dy = 0;
      entity.fal = false;
      entity.jm = false;
      ny = 0;
    }
  } else if (entity.dy < 0) {
    if ((cell && !celldown) || (cellright && !celldiag && nx)) {
      entity.y = t2p(ty + 1);
      entity.dy = 0;
      cell = celldown;
      cellright = celldiag;
      ny = 0;
    }
  }
  if (entity.dx > 0) {
    if ((cellright && !cell) || (celldiag && !celldown && ny)) {
      entity.x = t2p(tx);
      entity.dx = 0;
    }
  } else if (entity.dx < 0) {
    if ((cell && !cellright) || (celldown && !celldiag && ny)) {
      entity.x = t2p(tx + 1);
      entity.dx = 0;
    }
  }

  if (entity.enemy) {
    if (entity.l && (cell || !celldown)) {
      entity.l = false;
      entity.r = true;
    } else if (entity.r && (cellright || !celldiag)) {
      entity.r = false;
      entity.l = true;
    }
  }

  entity.fal = !(celldown || (nx && celldiag));
  if (!entity.enemy) updateAnimation(entity.sA[entity.cS]);
}

function cellAvailable(x, y) {
  var px = Math.floor(x);
  var py = Math.floor(y);

  if (px >= 128 || px <= 0 || py <= 0 || py >= 128) return false;

  var cell = tcell(p2t(x), p2t(y));
  return cell;
}

function tcell(tx, ty) {
  return collision[tx + ty * 16];
}

function updateAnimation(anim) {
  if (timestamp() - anim.fT > anim.fD) {
    if (anim.cF < anim.f.length - 1) {
      anim.cF++;
    } else {
      anim.cF = 0;
    }
    anim.fT = timestamp();
  }
}

document.addEventListener(
  'keydown',
  function(ev) {
    return onkey(ev, ev.keyCode, true);
  },
  false
);
document.addEventListener(
  'keyup',
  function(ev) {
    return onkey(ev, ev.keyCode, false);
  },
  false
);

function onkey(_, key, down) {
  switch (key) {
    case 37:
      player.l = down;
      return false;
    case 39:
      player.r = down;
      return false;
    case 38:
      player.j = down;
      return false;
    case 32:
      player.st = down;
      return false;
  }
}

frame();
start();
