<template>
  <div>
    <canvas
      id="snake-canvas"
      :width="boardSizePx"
      :height="boardSizePx"
    ></canvas>
    {{ gameScores.length }}
    <div class="scores" v-if="gameScores.length > 0">
      Scores: {{ gameScores[0] }}
    </div>
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
      socket: null,
      showGameScore: false,
      gameScores: [],
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
    // eslint-disable-next-line no-undef
    this.socket = io("http://localhost:3000");

    this.socket.on("mapState", (mapState) => {
      board.clear();
      for (const [key, snake] of Object.entries(mapState.snakes)) {
        const isMainPlayer = key === this.userId;
        board.drawSnake(snake.vertebraes, isMainPlayer);
      }
      mapState.targetCells.forEach((target) => {
        board.drawTarget(target);
      });
    });

    this.socket.on("gameFinished", () => {
      console.log("joao 20cm");
      this.gameScores = [10, 20];
    });
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

      const body = {
        lobbyId: this.lobbyId,
        userId: this.userId,
        userMovement: keyPress,
      };

      this.socket.emit("move", body);
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

.scores {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
  background-color: blue;
}
</style>
