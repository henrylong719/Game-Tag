// make connection
// let socket = io('http://192.168.1.116:3000/'); 192.168.1.116

const { fromEvent } = rxjs;
const { map, filter, tap, pluck } = rxjs.operators;

let player;
let players = [];

let scoreBubbles = [];
let powerUpBoxes = [];
let invisibleBoxes = [];

let startGame = false;

// const width = 350;
// const height = 610;

let zoom = 1;

let colorArr = [
  '#DC401E',
  '#F7FB09',
  '#4CFC00',
  '#00FCE9',
  '#0045FC',
  '#F000FC ',
  '#FC001B',
];
let ipAddress = 0;

let gameOverFlag = false;

/************* for drawing background **********/

let backgroundHorizontalLines = [];
let horizontalLineCounter = 0;
let backgroundVerticalLines = [];
let verticalLineCounter = 0;

let startButton;
let restartButton;
let input;

/********************** for cordova loading   **********************/
function onLoad() {
  document.addEventListener('deviceready', onDeviceReady, false);
}

function onDeviceReady() {
  screen.orientation.lock('portrait-primary');
}

function setup() {
  // createCanvas(350, 610);
  // for some reason, the windowHeight is higher than screen height, so I minus 4
  createCanvas(windowWidth, windowHeight - 4);

  // console.log(displayWidth, displayHeight);

  /************************ interface asking user to input ip address *******************/

  background('#f4fbff');
  fill('#000');
  textSize(25);
  textAlign(CENTER);
  text('Welcome to Tag !', displayWidth / 2, displayHeight / 4);
  text('Please Input You IP Address 🙈', displayWidth / 2, displayHeight / 3);

  if (!startButton) {
    input = createInput();
    startButton = createButton('submit');
  } else {
    startButton.show();
    input.show();
  }
  input.position(displayWidth / 4.8, displayHeight / 2.5);

  startButton.position(input.x + input.width, displayHeight / 2.5);
  startButton.mousePressed(greet);

  function greet() {
    ipAddress = input.value();
    startGame = true;
    socket = io('http://' + ipAddress + ':3000');
    io_connect();
    startButton.hide();
    input.hide();
    console.log(startGame);
  }

  /******************** create local player ****************/
  player = new Player(
    Math.random() * 300,
    Math.random() * 300,

    Math.random() * 11 + 4
  );

  /******************** create score bubbles  ***************/
  for (let i = 0; i < 40; i++) {
    let x = random(-2 * width, 2 * width);
    let y = random(-2 * height, 2 * height);
    let r = random(8, 14);

    let color = colorArr[Math.floor(Math.random() * 7)];

    scoreBubbles.push(new ScoreBubbles(x, y, r, color));
  }

  /******************** create power up boxes *****************/

  for (let j = 0; j < 40; j++) {
    let x = random(-2 * width, 2 * width);
    let y = random(-2 * height, 2 * height);
    powerUpBoxes[j] = new PowerUpBox(x, y, 8);
  }

  /******************** create invisible boxes *****************/

  for (let k = 0; k < 40; k++) {
    let x = random(-2 * width, 2 * width);
    let y = random(-2 * height, 2 * height);
    invisibleBoxes[k] = new InvisibleBox(x, y, 8);
  }

  /*******************   background lines   *******************/

  // create horizontal background lines
  // line(x1, y1, x2, y2);

  for (let i = -height * 3; i < height * 3; i = i + 55) {
    backgroundHorizontalLines[horizontalLineCounter] = new drawLine(
      width * -3,
      i,
      width * 3,
      i
    );
    horizontalLineCounter++;
  }

  // create vertical background lines
  // line(x1, y1, x2, y2);
  for (let j = -width * 3; j < width * 3; j = j + 55) {
    backgroundVerticalLines[verticalLineCounter] = new drawLine(
      j,
      height * -3,
      j,
      height * 3
    );
    verticalLineCounter++;
  }

  /********************** io.connect **********************/
  function io_connect() {
    if (startGame) {
      // emit player player's initial info to server
      socket.emit('start_info', {
        x: player.pos.x,
        y: player.pos.y,
        r: player.r,
        color: player.color,
      });

      // emit scoreBubbles, powerUpBox and invisibleBox to server in one go
      socket.emit('power_ups', {
        score_bubbles: scoreBubbles,
        power_up_boxes: powerUpBoxes,
        invisible_boxes: invisibleBoxes,
      });

      socket.on('score_bubbles', (data) => {
        scoreBubbles = data;
        // console.log(scoreBubbles);
      });

      socket.on('power_up_boxes', (data) => {
        powerUpBoxes = data;
        // console.log(powerUpBoxes);
      });

      socket.on('invisible_boxes', (data) => {
        invisibleBoxes = data;
      });
    }
  }
}

function draw() {
  if (gameOverFlag) {
    background('#f4fbff');
    fill('#000');
    textSize(25);
    textAlign(CENTER);
    text(
      'game over with a score of ' + player.score,
      displayWidth / 2,
      displayHeight / 3
    );

    if (!restartButton) {
      restartButton = createButton('click me to restart');
    } else {
      restartButton.show();
    }

    restartButton.size(90, 40);
    restartButton.position(displayWidth / 2.5, displayHeight / 2);
    restartButton.mousePressed(changeBG);

    function changeBG() {
      // console.log('start');
      // regenerate position
      player.pos.x = Math.random() * 300;
      player.pos.y = Math.random() * 300;
      player.r = Math.random() * 11 + 4;
      restartButton.hide();

      gameOverFlag = false;
    }
  } else if (startGame) {
    background('#f4fbff');
    fill('#000');
    textSize(30);
    textAlign(CENTER);
    text(
      'current score: ' + player.score,
      displayWidth / 2,
      displayHeight / 10
    );

    //   The translate() method remaps the (0,0) info on the canvas.
    translate(width / 2, height / 2);

    let newzoom = 16 / player.r;
    zoom = lerp(zoom, newzoom, 0.1);
    scale(zoom);
    translate(-player.pos.x, -player.pos.y);

    /*******************  create background lines   *********************/
    // draw horizontal lines
    for (let k = horizontalLineCounter - 1; k >= 0; k--) {
      backgroundHorizontalLines[k].show();
    }

    // console.log('from phone' + player.pos.x);

    // draw vertical lines
    for (let l = verticalLineCounter - 1; l >= 0; l--) {
      backgroundVerticalLines[l].show();
    }

    /*************************** display other players *******************/
    for (let i = players.length - 1; i >= 0; i--) {
      if (players[i].id !== socket.id) {
        displayOtherPlayer(
          players[i].x,
          players[i].y,
          players[i].r,
          players[i].color
        );

        fill(0);
        textAlign(CENTER);
        textSize(5);
        text(players[i].id, players[i].x, players[i].y + players[i].r);
      } else {
        player.r = players[i].r;

        // add score to the current player
        player.score = players[i].score;

        // add speedy effect
        player.isPowerUp = players[i].isPowerUp;

        if (players[i].isInvisible) {
          player.color = '#f4fbff';
        } else {
          player.color = '#4CFC00';
        }
      }
    }

    /*********************** display score bubbles ****************/

    for (let i = scoreBubbles.length - 1; i >= 0; i--) {
      // console.log(scoreBubbles);

      displayToolBox(
        scoreBubbles[i].x,
        scoreBubbles[i].y,
        scoreBubbles[i].r,
        scoreBubbles[i].color,
        true
      );
    }

    /***********************  show powerUp boxes   *******************/

    for (let j = powerUpBoxes.length - 1; j >= 0; j--) {
      displayToolBox(
        powerUpBoxes[j].x,
        powerUpBoxes[j].y,
        powerUpBoxes[j].r,
        powerUpBoxes[j].color
      );
    }

    /************************ show invisible boxes ********************/

    for (let k = invisibleBoxes.length - 1; k >= 0; k--) {
      displayToolBox(
        invisibleBoxes[k].x,
        invisibleBoxes[k].y,
        invisibleBoxes[k].r,
        invisibleBoxes[k].color
      );
    }

    /************* control player moves **********/

    if (mouseIsPressed) {
      if (player.isPowerUp) {
        player.update(3);
      } else {
        player.update();
      }
    }

    player.detectWalls();

    player.show();
    
    /**************** io.connect ****************/
    // emit player player's updated info to server
    socket.emit('update_info', {
      x: player.pos.x,
      y: player.pos.y,
      r: player.r,
      color: player.color,
    });


    // signal the catcher already catch the avoider game over
    socket.on('loserId', (data) => {
      if (data === socket.id) {
        gameOverFlag = true;
      }
    });

    // receive player's position info from server
    fromEvent(socket, 'update_info').subscribe((data) => {
      players = data;
    });

    // remove bubble when it is touched by players
    // fromEvent(socket, 'removed-bubble')
    //   .pipe(filter((data) => data !== null))
    //   .subscribe((data) => {
    //     scoreBubbles.forEach((target, index) => {
    //       if (target.x === data.x && target.y === data.y) {
    //         scoreBubbles.splice(index, 1);
    //       }
    //     });
    //   });

    // after refactoring my code in the server side, no need filter anymore

    // remove bubble when it is touched by players
    fromEvent(socket, 'removed_bubble').subscribe((data) => {
      scoreBubbles.forEach((target, index) => {
        if (target.x === data.x && target.y === data.y) {
          scoreBubbles.splice(index, 1);
        }
      });
    });

    // remove power up box when it is touched by players
    fromEvent(socket, 'removed_power_up_box').subscribe((data) => {
      powerUpBoxes.forEach((target, index) => {
        if (target.x === data.x && target.y === data.y) {
          powerUpBoxes.splice(index, 1);
        }
      });
    });

    // remove invisible box when it is touched by players
    fromEvent(socket, 'removed_invisible_box').subscribe((data) => {
      invisibleBoxes.forEach((target, index) => {
        if (target.x === data.x && target.y === data.y) {
          invisibleBoxes.splice(index, 1);
        }
      });
    });
  }
}

/****************** support functions to draw other players and tool boxes **********/

function displayOtherPlayer(x, y, r, color) {
  noStroke();
  fill(color);
  ellipse(x, y, r * 3);
}

function displayToolBox(x, y, r, color, isScoreBubble) {
  if (isScoreBubble) {
    fill(color);
    ellipse(x, y, r * 3);
  } else {
    fill(color);
    rect(x, y, r * 3);
  }
}

// function removeBubbles(targetIndex) {
//   // scoreBubbles[targetIndex].r = 0;
//   scoreBubbles.splice(targetIndex, 1);
//   console.log(scoreBubbles.length);
// }

// function createNewPlayer() {
//   let x = random(-3 * width, 3 * width);
//   let y = random(-3 * height, 3 * height);
//   let r = random(8, 14);

//   let color = colorArr[Math.floor(Math.random() * 7)];
//   let newPlayer = new Player(x, y, r, color);

//   return newPlayer;
// }

// console.log(powerUpBoxes);
// for (let j = powerUpBoxes.length - 1; j >= 0; j--) {
//   powerUpBoxes[j].show(true);
//   if (player.eats(powerUpBoxes[j])) {
//     powerUpBoxes.splice(j, 1);
//     addSpeed = true;
//     score++;
//     console.log('speed up!');
//   }
// }

// if (addSpeed && mouseIsPressed) {
//   let currentTime = new Date().getTime();
//   player.update(6);

//   if (!timeFlag) {
//     recordedTime = currentTime;
//     // get recorded time in seconds
//     console.log(Math.floor((recordedTime / 1000) % 60));
//     timeFlag = true;
//   }

//   // ten seconds later
//   if (currentTime >= recordedTime + 10000) {
//     // get current time in seconds
//     console.log(Math.floor((currentTime / 1000) % 60));
//     console.log('timeout!');
//     timeFlag = false;
//     addSpeed = false;
//   }
// } else {

// fill(255);
// textAlign(CENTER);
// console.log('dd');
// textSize(4);
// text(players[i].id, players[i].x, players[i].y + players[i].r);
