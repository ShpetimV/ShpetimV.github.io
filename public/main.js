
import { render, parseSjdon, createElement } from "/lib/suiweb.min.js";

// Constants
const ROWS = 6;
const COLS = 7;
const RED = 'r';
const YELLOW = 'y';
const API_KEY = "c4game";
const DATA_KEY = "gameState";

// Model
const model = {
    stateSeq: [],
    state: {
        board: Array(ROWS).fill('').map(() => Array(COLS).fill('')),
        currentPlayer: RED,
    },
    init() {
        this.clearBoard(); // Initialize the board
    },
    undo() {
        if(this.stateSeq.length > 0) {
            this.state = this.stateSeq.pop();
        }
    },
    setState() {
        this.stateSeq.push(JSON.parse(JSON.stringify(this.state)));
    },
    clearBoard() {
        this.state.board = Array(ROWS).fill('').map(() => Array(COLS).fill(''));
        this.state.currentPlayer = RED;
    },
    togglePlayer() {
        this.state = setInObject(this.state, 'currentPlayer', this.state.currentPlayer === RED ? YELLOW : RED);
    },
    updateCell(row, col) {
        const newRow = setInList(this.state.board[row], col, this.state.currentPlayer);
        const newBoard = setInList(this.state.board, row, newRow);
        this.state = setInObject(this.state, 'board', newBoard);
    },
    loadState() {
        fetch(`/api/data/${DATA_KEY}?api-key=${API_KEY}`, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                if (data && data.gameState) {
                    this.state.board = data.gameState.board;
                    this.state.currentPlayer = data.gameState.currentPlayer;
                    view.renderBoard();
                    view.updateTurnMessage();
                    console.log("Game loaded successfully:", data);
                } else {
                    alert("No saved game found on the server.");
                }
            })
            .catch(error => {
                console.error("Error loading game:", error);
                alert("Failed to load game. Please try again.");
            });
    },
    saveState() {
        fetch(`/api/data/${DATA_KEY}?api-key=${API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameState: this.state }),
        })
            .then(response => response.json())
            .then(data => {
                console.log("Game saved successfully:", data);
                alert("Game saved!");
            })
            .catch(error => {
                console.error("Error saving game:", error);
                alert("Failed to save game. Please try again.");
            });
    },
    saveStateLocal() {
        localStorage.setItem("currentPlayer", this.state.currentPlayer);
        localStorage.setItem("board", JSON.stringify(this.state.board));
        alert("Game saved locally!");
    },
    loadStateLocal() {
        const currentPlayer = localStorage.getItem("currentPlayer");
        const board = localStorage.getItem("board");
        if (!board || !currentPlayer) {
            alert("No saved game found locally.");
            return;
        }
        console.log("Game loaded locally:", currentPlayer, board);
        this.state.currentPlayer = currentPlayer;
        this.state.board = JSON.parse(board);
        view.renderBoard();
        view.updateTurnMessage();
    },
    checkWinner(row, col) {
        return this.checkHorizontal(row) || this.checkVertical(col) || this.checkDiagonalRight(row, col) || this.checkDiagonalLeft(row, col);
    },
    checkHorizontal(row) {
        let count = 0;
        for (let col = 0; col < COLS; col++) {
            count = (this.state.board[row][col] === this.state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        return false;
    },
    checkVertical(col) {
        let count = 0;
        for (let row = 0; row < ROWS; row++) {
            count = (this.state.board[row][col] === this.state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        return false;
    },
    checkDiagonalRight(row, col) {
        let count = 0;
        for (let i = -3; i <= 3; i++) {
            const r = row + i;
            const c = col + i;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                count = (this.state.board[r][c] === this.state.currentPlayer) ? count + 1 : 0;
                if (count >= 4) return true;
            }
        }
        return false;
    },
    checkDiagonalLeft(row, col) {
        let count = 0;
        for (let i = -3; i <= 3; i++) {
            const r = row + i;
            const c = col - i;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                count = (this.state.board[r][c] === this.state.currentPlayer) ? count + 1 : 0;
                if (count >= 4) return true;
            }
        }
        return false;
    },


};

const App = () => [Board, { board: model.state.board }];

const Board = ({ board }) => {
    let fields = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            fields.push([Field, { type: board[row][col], id: `field-${row}-${col}`, row, col }]);
        }
    }
    return ["div", { class: "board" }, ...fields];
}

const Field = ({ type, id, row, col }) => {
    const field = ["div", { class: "field", "id": id, onClick: () => view.handleFieldClick(row, col) }];
    if (type === RED) {
        field.push(["div", { class: "piece red" }]);
    } else if (type === YELLOW) {
        field.push(["div", { class: "piece yellow" }]);
    }
    return field;
}

// View (UI)
const view = {
    boardEl: document.querySelector('.board'),
    turnMessageEl: document.querySelector('.turnMessage'),
    turnPieceEl: document.querySelector('.turnPiece .piece'),
    newGameBtn: document.querySelector('.newGame'),

    init() {
        this.newGameBtn.addEventListener("click", () => {
            model.clearBoard();
            this.renderBoard();
            this.updateTurnMessage();
        });
        document.querySelector(".load").addEventListener("click", () => model.loadState());
        document.querySelector(".save").addEventListener("click", () => model.saveState());
        document.querySelector(".loadLocal").addEventListener("click", () => model.loadStateLocal());
        document.querySelector(".saveLocal").addEventListener("click", () => model.saveStateLocal());
        document.querySelector(".undo").addEventListener("click", () => {
            model.undo();
            this.renderBoard();
            this.updateTurnMessage();
        });
        this.renderBoard();
    },
    renderBoard() {
        const app = document.querySelector(".app");
        render(parseSjdon([App], createElement), app);
        return app;
    },
    handleFieldClick(row, col) {
        for (let i = ROWS - 1; i >= 0; i--) {
            if (model.state.board[i][col] === '') {
                model.setState();
                model.updateCell(i, col);

                if (model.checkWinner(i, col)) {
                    alert(`${model.state.currentPlayer === RED ? 'Red' : 'Yellow'} wins!`);
                    model.clearBoard();
                } else {
                    model.togglePlayer();
                }

                this.renderBoard();
                this.updateTurnMessage();
                break;
            }
        }
    },
    updateTurnMessage() {
        this.turnMessageEl.textContent = `It's ${model.state.currentPlayer === RED ? 'Red' : 'Yellow'}'s turn!`;
        this.turnPieceEl.className = `piece ${model.state.currentPlayer === RED ? 'red' : 'yellow'}`;
    },
};

function setInList(list, index, value) {
    return list.map((el, i) => i === index ? value : el);
}

function setInObject(obj, key, value) {
    return { ...obj, [key]: value };
}

// Initialize App
function init() {
    model.init();
    view.init();
}

init();