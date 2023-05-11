<template>
  <canvas
    ref="board"
    id="snake-canvas"
    :width="boardSizePx"
    :height="boardSizePx"
  ></canvas>
</template>

<script>
import constants from "@/utils/constants";

class Coordenates {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Snake {
  constructor(mapMiddleCell = 0) {
    this.vertebraes = [];
    this.vertebraes.push(new Coordenates(mapMiddleCell, mapMiddleCell));
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
  draw(fn) {
    this.vertebraes.forEach(fn);
  }
}

export default {
  name: "SnakeCanvas",
  props: {
    cellSize: Number,
    boardSize: Number,
    speed: Number,
    isPlaying: Boolean,
    stop: Function,
    addScores: Function,
    scores: Number,
  },
  data() {
    return {
      snake: null,
    };
  },
  computed: {
    boardSizePx() {
      return this.cellSize * this.boardSize;
    },
  },
  mounted() {
    this.boardContext = this.$refs.board.getContext("2d");
    window.addEventListener("keydown", this.onKeyPress);
  },
  created() {
    this.resetSnake();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyPress);
  },
  watch: {
    isPlaying(value) {
      this.clear();
      if (value) {
        this.resetSnake();
        this.move();
      }
    },
  },
  methods: {
    resetSnake() {
      const middleCell = this.getMiddleCell();
      this.snake = new Snake(middleCell);

      const randomDirectionIndex = Math.floor(Math.random() * 4);
      this.direction = constants[randomDirectionIndex];
      this.targetCell = null;
    },
    getMiddleCell() {
      return Math.round(this.boardSize / 2);
    },
    move() {
      if (!this.isPlaying) {
        return;
      }

      this.clear();
      this.setTargetCell();

      const newHeadCell = new Coordenates(
        this.snake.tail.x + this.direction.move.x,
        this.snake.tail.y + this.direction.move.y
      );

      if (
        this.isCellOutOfBoard(newHeadCell) ||
        this.snake.amountCellsInSnake() > 1
      ) {
        this.stop();
        alert(`Game over! You've scored ${this.scores} points.`);
      }

      if (this.isTargetNewHead(this.snake.tail)) {
        console.log("targetCell", this.targetCell);
        this.snake.newHead(this.targetCell);
        this.targetCell = null;
        this.addScores(this.speed);
      } else {
        this.snake.lostTail(newHeadCell);
      }

      this.boardContext.beginPath();
      this.snake.draw(this.drawCell);
      this.boardContext.closePath();

      setTimeout(this.move, this.getMoveDelay());
    },
    clear() {
      this.boardContext.clearRect(0, 0, this.boardSizePx, this.boardSizePx);
    },
    drawCell({ x, y }) {
      this.boardContext.rect(
        x * this.cellSize,
        y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      this.boardContext.fillStyle = "black";
      this.boardContext.fill();
    },
    getMoveDelay() {
      return (2 / Number(this.speed)) * 1000;
    },
    isCellOutOfBoard({ x, y }) {
      return x < 0 || y < 0 || x >= this.boardSize || y >= this.boardSize;
    },
    onKeyPress(event) {
      const newDirection = constants.find((c) => c.keyCode === event.keyCode);

      if (!newDirection) {
        return;
      }

      if (Math.abs(newDirection.keyCode - this.direction.keyCode) !== 2) {
        this.direction = newDirection;
      }
    },
    setTargetCell() {
      if (!this.targetCell) {
        let targetCell = this.getRandomCell();
        while (this.snake.amountCellsInSnake(targetCell) > 0) {
          targetCell = this.getRandomCell;
        }
        this.targetCell = targetCell;
      }

      this.boardContext.beginPath();
      this.boardContext.rect(
        this.targetCell.x * this.cellSize,
        this.targetCell.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      this.boardContext.fillStyle = "red";
      this.boardContext.fill();
      this.boardContext.closePath();
    },
    getRandomCell() {
      return new Coordenates(
        Math.floor(Math.random() * this.boardSize),
        Math.floor(Math.random() * this.boardSize)
      );
    },
    isTargetNewHead(tail) {
      return (
        tail.x + this.direction.move.x === this.targetCell.x &&
        tail.y + this.direction.move.y === this.targetCell.y
      );
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
