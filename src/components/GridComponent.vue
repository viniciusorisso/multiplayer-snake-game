<template>
  <div>
    <p v-if="board">
      {{ board.getSnakePos() }}
    </p>
    <p v-if="board">
      {{ board.getTargetPos() }}
    </p>
    <canvas
      id="snake-canvas"
      :width="boardSizePx"
      :height="boardSizePx"
    ></canvas>
  </div>
</template>

<script>
import constants from "@/utils/constants";

class Canvas {
  constructor() {
    this.canvas = document.getElementById("snake-canvas");
    this.context = this.canvas.getContext("2d");
  }
}

class Coordenates {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Snake {
  vertebraes;
  direction;
  constructor(mapMiddleCell = 0) {
    this.vertebraes = [];
    this.vertebraes.unshift(new Coordenates(mapMiddleCell.x, mapMiddleCell.y));
    const randomDirectionIndex = Math.floor(Math.random() * 4);
    this.direction = constants[randomDirectionIndex];
  }
  get tail() {
    return this.vertebraes[0];
  }
  get size() {
    return this.vertebraes.length;
  }
  amountCellsInSnake(targetCell = null) {
    let cell = targetCell ?? this.tail;
    return this.vertebraes.filter(({ x, y }) => x === cell.x && y === cell.y)
      .length;
  }
  newHead({ x, y }) {
    const newHeadCell = new Coordenates(x, y);

    this.vertebraes.unshift(newHeadCell);
  }
  lostTail(foodCoord) {
    this.vertebraes.unshift(foodCoord);
    this.vertebraes.pop();
  }
}

class MapGrid extends Canvas {
  boardSize;
  boardSizePx;
  targetCell;
  snake;
  running;
  cellSize;
  speed;
  constructor(boardSize = 0, boardSizePx = 0, cellSize, speed) {
    super();
    this.boardSize = new Coordenates(boardSize, boardSize);
    this.boardSizePx = boardSizePx;
    this.targetCell = null;
    this.snake = null;
    this.running = false;
    this.cellSize = cellSize;
    this.speed = speed;
  }
  clear() {
    this.context.clearRect(0, 0, this.boardSizePx, this.boardSizePx);
  }
  middleCell() {
    let middleX = Math.round(this.boardSize.x / 2);
    let middleY = Math.round(this.boardSize.y / 2);

    return new Coordenates(middleX, middleY);
  }
  newSnake() {
    const middleCell = this.middleCell();
    this.snake = new Snake(middleCell);
    this.targetCell = null;
  }
  generateRandomTargetCell() {
    if (!this.targetCell) {
      let targetCell = this.getRandomCell();
      while (this.snake.amountCellsInSnake(targetCell) > 0) {
        targetCell = this.getRandomCell;
      }
      this.targetCell = targetCell;
    }

    this.context.beginPath();
    this.context.rect(
      this.targetCell.x * this.cellSize,
      this.targetCell.y * this.cellSize,
      this.cellSize,
      this.cellSize
    );
    this.context.fillStyle = "red";
    this.context.fill();
    this.context.closePath();
  }
  getRandomCell() {
    return new Coordenates(
      Math.floor(Math.random() * this.boardSize.x),
      Math.floor(Math.random() * this.boardSize.y)
    );
  }
  /**
   * @param {Coordenates}
   */
  drawCell(vertebraes) {
    let board = this.context;
    vertebraes.forEach(({ x, y }) => {
      board.rect(
        x * this.cellSize,
        y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      board.fillStyle = "black";
      board.fill();
    });
  }
  /**
   * @param {Coordenates} snakeTail
   */
  isTargetNewHead({ x, y }) {
    let condition =
      x + this.snake.direction.move.x === this.targetCell.x &&
      y + this.snake.direction.move.y === this.targetCell.y;
    return condition;
  }
  /**
   * @param {Coordenates} cell
   */
  isCellOutOfBoard({ x, y }) {
    return x < 0 || y < 0 || x >= this.boardSize.x || y >= this.boardSize.y;
  }
  getMoveDelay() {
    return (2 / Number(this.speed)) * 1000;
  }
  startGame() {
    this.running = true;
    this.newSnake();
    this.move();
  }
  move() {
    if (!this.running) {
      return;
    }

    this.clear();
    this.generateRandomTargetCell();

    const newHeadCell = new Coordenates(
      this.snake.tail.x + this.snake.direction.move.x,
      this.snake.tail.y + this.snake.direction.move.y
    );

    if (
      this.isCellOutOfBoard(newHeadCell) ||
      this.snake.amountCellsInSnake() > 1
    ) {
      this.stop();
      alert(`Game over! You've scored ${this.scores} points.`);
      return;
    }

    if (this.isTargetNewHead(this.snake.tail)) {
      this.snake.newHead(this.targetCell);
      this.targetCell = null;
      // this.addScores(this.speed);
    } else {
      this.snake.lostTail(newHeadCell);
    }

    this.context.beginPath();
    this.drawCell(this.snake.vertebraes);
    this.context.closePath();

    setTimeout(() => this.move(), this.getMoveDelay());
  }

  onKeyPress(newDirection) {
    if (!this.running) return;

    if (Math.abs(newDirection.keyCode - this.snake.direction.keyCode) !== 2) {
      this.snake.direction = newDirection;
    }
  }

  stop() {
    this.running = false;
    this.snake = null;
    this.targetCell = null;
    this.clear();
  }

  getSnakePos() {
    return this.snake?.tail ?? "";
  }

  getTargetPos() {
    return this.targetCell ?? "";
  }
}

export default {
  name: "SnakeCanvas",
  props: {
    cellSize: Number,
    boardSize: Number,
    speed: Number,
    isPlaying: Boolean,
    addScores: Function,
    scores: Number,
  },
  data() {
    return {
      board: null,
    };
  },
  computed: {
    boardSizePx() {
      return this.cellSize * this.boardSize;
    },
  },
  mounted() {
    this.board = new MapGrid(
      this.boardSize,
      this.boardSizePx,
      this.cellSize,
      this.speed
    );
    window.addEventListener("keydown", this.onKeyPress);
  },
  beforeUnmount() {
    this.board = null;
    window.removeEventListener("keydown", this.onKeyPress);
  },
  watch: {
    isPlaying(value) {
      this.board.stop();
      if (value) {
        this.board.startGame();
      }
    },
  },
  methods: {
    onKeyPress(event) {
      const newDirection = constants.find((c) => c.keyCode === event.keyCode);

      if (!newDirection) {
        return;
      }

      this.board.onKeyPress(newDirection);
    },
  },
};
</script>

<style>
#snake-canvas {
  border: 1px solid #ccc;
  margin: 10px 0;
  height: 100%;
}
</style>
