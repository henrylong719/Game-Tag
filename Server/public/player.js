class Player {
  constructor(x, y, r, color = '#4CFC00', score = 0, isWinner = 'unknown') {
    this.pos = createVector(x, y);
    // radius of the Player
    this.r = r;

    this.vel = createVector(0, 0);

    this.color = color;

    this.score = score;

    this.isWinner = isWinner;
  }

  // update the position of the main Player
  update = function (n = 3) {
    var newvel = createVector(mouseX - width / 2, mouseY - height / 2);

    // control the speed main Player following the mouse
    newvel.setMag(n);

    // velocity
    this.vel.lerp(newvel, 0.2);

    this.pos.add(this.vel);

    // console.log(this.pos.x);
    // console.log(this.pos.y);
  };

  show = function () {
    // ellipse(x coordinate, y coordinate, width, height)
    noStroke();
    fill(this.color);

    ellipse(this.pos.x, this.pos.y, this.r * 3, this.r * 3);
  };

  detectWalls = function () {
    // left wall
    if (this.pos.x + this.r < -2 * width) {
      this.pos.x = -2 * width - this.r;
    }

    // right wall
    if (this.pos.x + this.r > 2 * width) {
      this.pos.x = 2 * width - this.r;
    }

    //top wall
    if (this.pos.y + this.r < -2 * height) {
      this.pos.y = -2 * height - this.r;
    }

    //bottom wall
    if (this.pos.y + this.r > 2 * height) {
      this.pos.y = 2 * height - this.r;
    }
  };
}

function drawLine(x1, y1, x2, y2) {
  this.show = function () {
    stroke('#c4cace');
    line(x1, y1, x2, y2);
  };
}

function ScoreBubbles(x, y, r, color) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = color;
}

function PowerUpBox(x, y, r, color = '#F7FB09') {
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = color;
}

function InvisibleBox(x, y, r, color = '#c4cace') {
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = color;
}
