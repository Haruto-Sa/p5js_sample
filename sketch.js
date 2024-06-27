let cols = 10;
let rows = 30;
let visibleRows = 30;
let gridSize = 20;
let board;
let currentPiece;
let nextPiece;
let heldPiece = null;
let holdUsed = false;
let dropInterval = 1000;
let lastDropTime = 0;
let score = 0;
let highScore = 0;
let speedIncreaseInterval = 30000; // 30 seconds
let lastSpeedIncreaseTime = 0;
let gameOver = false;
let hiddenRows = 1;

function setup() {
  let canvas = createCanvas(cols * gridSize, visibleRows * gridSize);
  canvas.parent('game');
  board = createBoard(rows + hiddenRows, cols);
  currentPiece = new Piece();
  nextPiece = new Piece();
  frameRate(60);
  lastSpeedIncreaseTime = millis();
  loadHighScore();
  updateScore();
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('retry-button').addEventListener('click', retryGame);
  document.getElementById('home-button').addEventListener('click', goToHome);
}

function draw() {
  if (gameOver) return;

  background(50);
  drawBoard();
  drawPiece(currentPiece);
  displayHold();

  if (millis() - lastDropTime > dropInterval) {
    moveDown();
    lastDropTime = millis();
  }

  if (millis() - lastSpeedIncreaseTime > speedIncreaseInterval) {
    dropInterval *= 0.9;
    lastSpeedIncreaseTime = millis();
  }
}

function keyPressed() {
  if (gameOver) return;

  if (keyCode === LEFT_ARROW) {
    move(-1);
  } else if (keyCode === RIGHT_ARROW) {
    move(1);
  } else if (keyCode === UP_ARROW) {
    rotatePiece();
  } else if (key === ' ') {
    drop();
  } else if (keyCode === SHIFT) {
    hold();
  } else if (keyCode === DOWN_ARROW) {
    moveDown();
  }
}

function createBoard(rows, cols) {
  let board = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = 0;
    }
  }
  return board;
}

function drawBoard() {
  for (let row = hiddenRows; row < rows + hiddenRows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col] === 0) {
        fill(50);
        stroke(255);
      } else {
        fill(board[row][col]);
        stroke(255);
      }
      rect(col * gridSize, (row - hiddenRows) * gridSize, gridSize, gridSize);
    }
  }
}

function drawPiece(piece) {
  fill(piece.color);
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        rect((piece.x + col) * gridSize, (piece.y + row - hiddenRows) * gridSize, gridSize, gridSize);
      }
    }
  }
}

class Piece {
  constructor() {
    this.shapes = [
      // I
      [[1, 1, 1, 1]],
      // O
      [[1, 1],
       [1, 1]],
      // T
      [[0, 1, 0],
       [1, 1, 1]],
      // S
      [[0, 1, 1],
       [1, 1, 0]],
      // Z
      [[1, 1, 0],
       [0, 1, 1]],
      // J
      [[1, 0, 0],
       [1, 1, 1]],
      // L
      [[0, 0, 1],
       [1, 1, 1]]
    ];
    this.colors = [
      color(0, 255, 255),
      color(255, 255, 0),
      color(128, 0, 128),
      color(0, 255, 0),
      color(255, 0, 0),
      color(0, 0, 255),
      color(255, 165, 0)
    ];
    let type = floor(random(0, this.shapes.length));
    this.shape = this.shapes[type];
    this.color = this.colors[type];
    this.x = floor(cols / 2) - floor(this.shape[0].length / 2);
    this.y = 0;
  }
}

function move(dir) {
  currentPiece.x += dir;
  if (collision()) {
    currentPiece.x -= dir;
  }
}

function rotatePiece() {
  let originalShape = currentPiece.shape;
  currentPiece.shape = rotateMatrix(currentPiece.shape);
  if (collision()) {
    currentPiece.shape = originalShape;
  }
}

function rotateMatrix(matrix) {
  let result = [];
  for (let i = 0; i < matrix[0].length; i++) {
    result[i] = [];
    for (let j = 0; j < matrix.length; j++) {
      result[i][j] = matrix[matrix.length - j - 1][i];
    }
  }
  return result;
}

function moveDown() {
  currentPiece.y++;
  if (collision()) {
    currentPiece.y--;
    mergePiece();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = new Piece();
    holdUsed = false;
    if (collision()) {
      gameOver = true;
      saveHighScore();
      document.getElementById('game-over').classList.remove('hidden');
    }
  }
}

function drop() {
  while (!collision()) {
    currentPiece.y++;
  }
  currentPiece.y--;
  mergePiece();
  clearLines();
  currentPiece = nextPiece;
  nextPiece = new Piece();
  holdUsed = false;
}

function hold() {
  if (holdUsed) return;
  if (heldPiece === null) {
    heldPiece = currentPiece;
    currentPiece = nextPiece;
    nextPiece = new Piece();
  } else {
    let temp = currentPiece;
    currentPiece = heldPiece;
    heldPiece = temp;
  }
  holdUsed = true;
  currentPiece.x = floor(cols / 2) - floor(currentPiece.shape[0].length / 2);
  currentPiece.y = 0;
}

function collision() {
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col] === 1) {
        let x = currentPiece.x + col;
        let y = currentPiece.y + row;
        if (x < 0 || x >= cols || y >= rows + hiddenRows || board[y][x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function mergePiece() {
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col] === 1) {
        board[currentPiece.y + row][currentPiece.x + col] = currentPiece.color;
      }
    }
  }
}

function clearLines() {
  for (let row = hiddenRows; row < rows + hiddenRows; row++) {
    let isFull = true;
    for (let col = 0; col < cols; col++) {
      if (board[row][col] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      board.splice(row, 1);
      board.unshift(new Array(cols).fill(0));
      score += 100;
      updateScore();
    }
  }
}

function updateScore() {
  document.getElementById('score-value').innerText = score;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
}

function loadHighScore() {
  let savedHighScore = localStorage.getItem('highScore');
  if (savedHighScore !== null) {
    highScore = parseInt(savedHighScore);
  }
  document.getElementById('high-score-value').innerText = highScore;
}

function displayHold() {
  let holdPieceElement = document.getElementById('hold-piece');
  holdPieceElement.innerHTML = ''; // Clear the hold piece display

  if (heldPiece !== null) {
    for (let row = 0; row < heldPiece.shape.length; row++) {
      for (let col = 0; col < heldPiece.shape[row].length; col++) {
        if (heldPiece.shape[row][col] === 1) {
          let block = document.createElement('div');
          block.style.width = `${gridSize}px`;
          block.style.height = `${gridSize}px`;
          block.style.backgroundColor = heldPiece.color.toString();
          block.style.position = 'absolute';
          block.style.left = `${col * gridSize}px`;
          block.style.top = `${row * gridSize}px`;
          holdPieceElement.appendChild(block);
        }
      }
    }
  }
}

function startGame() {
  document.getElementById('home-screen').classList.add('hidden');
  document.getElementById('main-game').classList.remove('hidden');
  loop();
}

function retryGame() {
  gameOver = false;
  board = createBoard(rows + hiddenRows, cols);
  currentPiece = new Piece();
  nextPiece = new Piece();
  heldPiece = null;
  holdUsed = false;
  dropInterval = 1000;
  lastDropTime = 0;
  score = 0;
  updateScore();
  document.getElementById('game-over').classList.add('hidden');
  loop();
}

function goToHome() {
  gameOver = true;
  document.getElementById('main-game').classList.add('hidden');
  document.getElementById('home-screen').classList.remove('hidden');
  noLoop();
}
