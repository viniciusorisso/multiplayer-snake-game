<template>
  <div>
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

class MapGrid extends Canvas {
  boardSize;
  boardSizePx;
  running;
  cellSize;
  speed;
  constructor(boardSize = 0, boardSizePx = 0, cellSize, speed) {
    super();
    this.boardSize = new Coordenates(boardSize, boardSize);
    this.boardSizePx = boardSizePx;
    this.running = false;
    this.cellSize = cellSize;
    this.speed = speed;
    this.startGame = this.startGame.bind(this);
  }
  clear() {
    this.context.clearRect(0, 0, this.boardSizePx, this.boardSizePx);
  }
  middleCell() {
    let middleX = Math.round(this.boardSize.x / 2);
    let middleY = Math.round(this.boardSize.y / 2);

    return new Coordenates(middleX, middleY);
  }
  /**
   * @param {Coordenates} vertebraes
   * @param {boolean} isMainPlayer
   */
  drawSnake(vertebraes, isMainPlayer) {
    let board = this.context;
    vertebraes.forEach(({ x, y }) => {
      board.rect(
        x * this.cellSize,
        y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      board.fillStyle = isMainPlayer ? "black" : "blue";
      board.fill();
    });
  }
  getMoveDelay() {
    return (2 / Number(this.speed)) * 1000;
  }
  startGame() {
    this.running = true;
    // socket init
  }
  drawTarget(target) {
    this.context.beginPath();
    this.context.rect(
      target.x * this.cellSize,
      target.y * this.cellSize,
      this.cellSize,
      this.cellSize
    );
    this.context.fillStyle = "red";
    this.context.fill();
    this.context.closePath();
  }
  stop() {
    this.running = false;
    this.clear();
  }
}

let board = null;

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
      userToken: null,
      userId: "risso",
    };
  },
  computed: {
    boardSizePx() {
      return this.cellSize * this.boardSize;
    },
  },
  async created() {
    try {
      const response = await fetch(
        `http://localhost:3000/login/${this.userId}`
      );
      const jsonParsed = await response.json();
      this.lobbyId = jsonParsed.data.lobbyId;
    } catch (error) {
      console.log(error);
    }
  },
  mounted() {
    board = new MapGrid(
      this.boardSize,
      this.boardSizePx,
      this.cellSize,
      this.speed
    );
    window.addEventListener("keydown", this.onKeyPress);
  },
  beforeUnmount() {
    board = null;
    window.removeEventListener("keydown", this.onKeyPress);
  },
  watch: {
    isPlaying(value) {
      board.stop();
      if (value) {
        board.startGame();
      }
    },
  },
  methods: {
    onKeyPress(event) {
      const newDirection = constants.find((c) => c.keyCode === event.keyCode);

      if (!newDirection) {
        return;
      }

      this.sendKeyPressedToSocket(newDirection.direction);
    },
    async startGame() {
      try {
        await fetch(`http://localhost:3000/${this.lobbyId}/start`);
      } catch (error) {
        console.log(error);
      } finally {
        board.startGame();
      }
    },
    async sendKeyPressedToSocket(keyPress) {
      if (!board.running) await this.startGame();

      const body = JSON.stringify({
        lobbyId: this.lobbyId,
        userId: this.userId,
        userMovement: keyPress,
      });

      let mapState = null;

      try {
        const response = await fetch("http://localhost:3000/player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: body,
        });
        const jsonParsed = await response.json();
        mapState = jsonParsed.data.mapState;
      } catch (error) {
        console.log(error);
      } finally {
        board.clear();
        for (const [key, snake] of Object.entries(mapState.snakes)) {
          const isMainPlayer = key === this.userId;
          board.drawSnake(snake.vertebraes, isMainPlayer);
        }
        mapState.targetCells.forEach((target) => {
          board.drawTarget(target);
        });
      }
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
