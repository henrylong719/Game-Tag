const express = require('express');
let socket = require('socket.io');
const { fromEvent } = require('rxjs');
const { pluck, tap } = require('rxjs/operators');

// app setup
const app = express();
const port = 3000;

let players = [];

let scoreBubbles = [];

let powerUpBoxes = [];

let invisibleBoxes = [];

let PI = 3.1415;

let timeOutFlag;

// serve Static files
app.use(express.static('public'));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`app listening at http://localhost:${port}`);
});

// socket setup
let io = socket(server);

/********* player constructor **************/
function Player(
  id,
  x,
  y,
  r,
  color,
  score = 0,
  isPowerUp = false,
  isInvisible = false
) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = color;
  this.score = score;
  this.isPowerUp = isPowerUp;
  this.isInvisible = isInvisible;
}

// control sending data speed
setInterval(controlSpeed, 40);

function controlSpeed() {
  // when the players touch the bubble, the bubble will be removed
  checkScore();

  // when the players touch the power up box, the box will be removed
  checkPowerUp();

  // when the players touch the invisible box, the box will be removed
  checkInvisible();

  // check if a catcher (radius bigger one) touch the avoider, if so emit game over
  checkCollision();

  // send player's position info to clients
  io.sockets.emit('update_info', players);
}

/***************** socket connection **********************/

io.on('connection', (socket) => {
  // console.log(players);
  console.log(`a user connected ${socket.id}`);

  // initialize player's info
  // initializePlayersInfo();

  /********* for player's starting position **********/
  fromEvent(socket, 'start_info').subscribe((data) => {
    // console.log('data info' + data.x + data.y + data.r + data.color);

    let player = new Player(socket.id, data.x, data.y, data.r, data.color);
    players.push(player);
  });

  /********** for update player's position **********/
  fromEvent(socket, 'update_info').subscribe((data) => {
    // console.log('data info ' + data.x + data.y + data.r + data.color);
    let player;
    // console.log(socket.id);

    for (let i = 0; i < players.length; i++) {
      // console.log('socketid ' + socket.id);
      // console.log('playerid ' + players[i].id);

      if (socket.id === players[i].id) {
        player = players[i];
      }
    }

    if (player !== undefined) {
      player.x = data.x;
      player.y = data.y;
      player.r = data.r;
      player.color = data.color;
    }
  });

  /******** for power up effects **********/
  let power_ups = fromEvent(socket, 'power_ups');

  power_ups.pipe(pluck('score_bubbles')).subscribe((data) => {
    scoreBubbles = data;
    io.sockets.emit('score_bubbles', scoreBubbles);
  });

  power_ups.pipe(pluck('power_up_boxes')).subscribe((data) => {
    powerUpBoxes = data;
    io.sockets.emit('power_up_boxes', powerUpBoxes);
  });

  power_ups.pipe(pluck('invisible_boxes')).subscribe((data) => {
    invisibleBoxes = data;
    io.sockets.emit('invisible_boxes', invisibleBoxes);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');

    players.map((player, index) => {
      if (player.id === socket.id) {
        players.splice(index, 1);
      }
    });
  });
});

/********* helper functions ************/

//  check if a catcher (radius bigger one) touch the avoider, if so, emit game over
function checkCollision() {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      let distX = players[i].x - players[j].x;
      let distY = players[i].y - players[j].y;
      let distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < players[i].r + players[j].r) {
        let loserId;

        if (players[i].r > players[j].r) {
          loserId = players[j].id;
          players[j].x = 1000;

          initializePlayersInfo(players[j]);
        } else {
          loserId = players[i].id;
          players[i].x = 1000;
          initializePlayersInfo(players[i]);
        }

        // console.log(players[i].id + ' ' + distance);

        io.sockets.emit('loserId', loserId);

        console.log(loserId);
      }
    }
  }
}

function initializePlayersInfo(player) {
  player.score = 0;
  player.isInvisible = false;
  player.isPowerUp = false;
  // clearTimeout(player.timer);
}

function checkScore() {
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < scoreBubbles.length; j++) {
      let distX = players[i].x - scoreBubbles[j].x;
      let distY = players[i].y - scoreBubbles[j].y;
      let distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < players[i].r + scoreBubbles[j].r) {
        // console.log(players[i].id + ' ' + distance);

        players[i].score++;

        // console.log(players[i].id + 'score' + players[i].score);

        let sum =
          PI * players[i].r * players[i].r +
          PI * scoreBubbles[j].r * scoreBubbles[j].r * 0.1;

        players[i].r = Math.sqrt(sum / PI);

        // console.log(players[i].r);

        let removedBubble = scoreBubbles[j];

        // when the players touch the bubble, the bubble will be removed
        // server side
        scoreBubbles.splice(j, 1);

        // send removed bubble info to client side
        io.sockets.emit('removed_bubble', removedBubble);
      }
    }
  }
}

function checkPowerUp() {
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < powerUpBoxes.length; j++) {
      let distX = players[i].x - powerUpBoxes[j].x;
      let distY = players[i].y - powerUpBoxes[j].y;
      let distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < players[i].r + powerUpBoxes[j].r) {
        // console.log(players[i].id + ' ' + distance);

        let removedPowerUp = powerUpBoxes[j];

        players[i].isPowerUp = true;

        timeOutFlag = setTimeout(() => {
          console.log('time up!');
          if (players[i] !== undefined) {
            players[i].isPowerUp = false;
          }
        }, 10000);

        powerUpBoxes.splice(j, 1);

        io.sockets.emit('removed_power_up_box', removedPowerUp);

        // console.log(powerUpBoxes.length);
      }
    }
  }
}

function checkInvisible() {
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < invisibleBoxes.length; j++) {
      let distX = players[i].x - invisibleBoxes[j].x;
      let distY = players[i].y - invisibleBoxes[j].y;
      let distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < players[i].r + invisibleBoxes[j].r) {
        // console.log(players[i].id + ' ' + distance);

        let removedInvisible = invisibleBoxes[j];

        players[i].isInvisible = true;
        // clearTimeout(players[i].timer);

        timeOutFlag = setTimeout(() => {
          if (players[i] !== undefined) {
            console.log('time up!');
            players[i].isInvisible = false;
            // players[i].r = 10;
          }
        }, 10000);

        invisibleBoxes.splice(j, 1);

        io.sockets.emit('removed_invisible_box', removedInvisible);
        // console.log(invisibleBoxes.length);
      }
    }
  }
}

// function checkScore() {
//   for (let j = 0; j < scoreBubbles.length; j++) {
//     let distX = players[0].x - scoreBubbles[j].x;
//     let distY = players[0].y - scoreBubbles[j].y;
//     let distance = Math.sqrt(distX * distX + distY * distY);

//     if (!flagForPlayer1 && distance < players[0].r + scoreBubbles[j].r) {
//       // console.log(players[0].id + ' ' + distance);

//       recordPlayer1X = players[0].x;
//       recordPlayer1Y = players[0].y;

//       players[0].score++;
//       console.log('player1 score' + players[0].score);
//       flagForPlayer1 = true;

//       let tmp = scoreBubbles[j];

//       scoreBubbles.splice(j, 1);

//       return scoreBubbles[j];
//     }
//   }
// }

// function checkScoreForPlayer2() {
//   for (let j = 0; j < scoreBubbles.length; j++) {
//     let distX = players[1].x - scoreBubbles[j].x;
//     let distY = players[1].y - scoreBubbles[j].y;
//     let distance = Math.sqrt(distX * distX + distY * distY);

//     if (!flagForPlayer1 && distance < players[1].r + scoreBubbles[j].r) {
//       // console.log(players[1].id + ' ' + distance);

//       recordPlayer2X = players[1].x;
//       recordPlayer2Y = players[1].y;

//       players[1].score++;
//       console.log('player2 score' + players[1].score);
//       flagForPlayer2 = true;

//       return scoreBubbles[j];
//     }
//   }
// }

// /*************** used to record players position */
// let recordPlayer1X;
// let recordPlayer1Y;
// let flagForPlayer1 = false;

// let recordPlayer2X;
// let recordPlayer2Y;
// let flagForPlayer2 = false;

// /***************** check if the player already leave the old position  ****************/
// if (
//   Math.abs(recordPlayer1X - players[0].x) > 80 ||
//   Math.abs(recordPlayer1Y - players[0].y) > 80
// ) {
//   flagForPlayer1 = false;
// }

// if (
//   Math.abs(recordPlayer2X - players[1].x) > 80 ||
//   Math.abs(recordPlayer2Y - players[1].y) > 80
// ) {
//   flagForPlayer2 = false;
// }

// if (players[0] !== undefined && players[1] !== undefined) {
//   console.log('player0' + players[0].isWinner);
//   console.log('player1' + players[1].isWinner);
// }

// //  check if a catcher (radius bigger one) touch the avoider, if so emit game over
// function checkCollision() {
//   for (let i = 0; i < players.length; i++) {
//     for (let j = i + 1; j < players.length; j++) {
//       let distX = players[i].x - players[j].x;
//       let distY = players[i].y - players[j].y;
//       let distance = Math.sqrt(distX * distX + distY * distY);

//       if (distance < players[i].r + players[j].r) {
//         // console.log(players[i].id + ' ' + distance);

//         if (players[i].r > players[j].r) {
//           console.log('tests');
//           players[i].isWinner = true;
//           players[j].isWinner = true;
//         } else {
//           console.log('testt222');
//           players[j].isWinner = true;
//           players[i].isWinner = true;
//         }

//         console.log(players[i].isWinner);
//         console.log(players[j].isWinner);

//         return true;
//       }
//     }
//   }
// }

// io.sockets.emit('GameOver', gameOverFlag);
