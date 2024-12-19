import { render, parseSjdon, createElement } from "./lib/suiweb.min.js";

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

    /**
     * Initialize the model's state by clearing the board and setting the default current player.
     */
    init() {
        this.clearBoard();
    },

    /**
     * Check if the game is a tie (i.e., the board is full and no winner).
     * @returns {boolean} True if the game is a tie, otherwise false.
     */
    checkTie() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.state.board[row][col] === '') {
                    return false;
                }
            }
        }
        return true;
    },

    /**
     * Undo the last move by reverting the state to the previous one in the state sequence.
     */
    undo() {
        if(this.stateSeq.length > 0) {
            this.state = this.stateSeq.pop();
        }
    },

    /**
     * Save the current state to the state sequence, allowing for undo operations.
     */
    setState() {
        this.stateSeq.push(JSON.parse(JSON.stringify(this.state)));
    },

    /**
     * Clear the entire board and reset the current player to RED.
     */
    clearBoard() {
        this.state.board = Array(ROWS).fill('').map(() => Array(COLS).fill(''));
        this.state.currentPlayer = RED;
        this.stateSeq = [];
    },

    /**
     * Toggle the current player between RED and YELLOW.
     * @returns {void}
     */
    togglePlayer() {
        this.state = setInObject(this.state, 'currentPlayer', this.state.currentPlayer === RED ? YELLOW : RED);
    },

    /**
     * Update the board cell at the given row and column to the current player's piece.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     */
    updateCell(row, col) {
        const newRow = setInList(this.state.board[row], col, this.state.currentPlayer);
        const newBoard = setInList(this.state.board, row, newRow);
        this.state = setInObject(this.state, 'board', newBoard);
    },

    /**
     * Load the current game state from the server via a fetch API call.
     * If successful, updates the model and re-renders the board.
     */
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

    /**
     * Save the current game state to the server.
     */
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

    /**
     * Save the current game state locally (in the browser's localStorage).
     */
    saveStateLocal() {
        localStorage.setItem("currentPlayer", this.state.currentPlayer);
        localStorage.setItem("board", JSON.stringify(this.state.board));
        alert("Game saved locally!");
    },

    /**
     * Load the game state from localStorage.
     */
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

    /**
     * Check if the current player's move at (row, col) resulted in a win.
     * @param {number} row - The row index where the piece was placed.
     * @param {number} col - The column index where the piece was placed.
     * @returns {boolean} True if the current player has won, false otherwise.
     */
    checkWinner(row, col) {
        return this.checkHorizontal(row) || this.checkVertical(col) || this.checkDiagonalRight(row, col) || this.checkDiagonalLeft(row, col);
    },

    /**
     * Check for a horizontal four-in-a-row at the given row.
     * @param {number} row - The row index to check.
     * @returns {boolean} True if there's a horizontal four-in-a-row, otherwise false.
     */
    checkHorizontal(row) {
        let count = 0;
        for (let col = 0; col < COLS; col++) {
            count = (this.state.board[row][col] === this.state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        return false;
    },

    /**
     * Check for a vertical four-in-a-row at the given column.
     * @param {number} col - The column index to check.
     * @returns {boolean} True if there's a vertical four-in-a-row, otherwise false.
     */
    checkVertical(col) {
        let count = 0;
        for (let row = 0; row < ROWS; row++) {
            count = (this.state.board[row][col] === this.state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        return false;
    },

    /**
     * Check for a diagonal (top-left to bottom-right) four-in-a-row that includes (row, col).
     * @param {number} row - The row index of the last move.
     * @param {number} col - The column index of the last move.
     * @returns {boolean} True if there's such a diagonal four-in-a-row, otherwise false.
     */
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

    /**
     * Check for a diagonal (top-right to bottom-left) four-in-a-row that includes (row, col).
     * @param {number} row - The row index of the last move.
     * @param {number} col - The column index of the last move.
     * @returns {boolean} True if there's such a diagonal four-in-a-row, otherwise false.
     */
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
    /**
     * Initialize the view: set up event listeners and render the initial board.
     */
    init() {
        this.newGameBtn.addEventListener("click", () => {
            model.clearBoard();
            this.renderBoard();
            this.updateTurnMessage();
        });
        document.querySelector(".loadLocal").addEventListener("click", () => model.loadStateLocal());
        document.querySelector(".saveLocal").addEventListener("click", () => model.saveStateLocal());
        document.querySelector(".undo").addEventListener("click", () => {
            model.undo();
            this.renderBoard();
            this.updateTurnMessage();
        });
        this.renderBoard();
    },

    /**
     * Re-render the board using the updated model state.
     * @returns {HTMLElement} The container element after rendering.
     */
    renderBoard() {
        const app = document.querySelector(".app");
        render(parseSjdon([App], createElement), app);
        return app;
    },

    /**
     * Handle a click on a board field. Finds the next available cell in the clicked column,
     * updates the model state, checks for a win, toggles the player, and re-renders.
     * @param {number} row - The row index of the clicked cell (not necessarily where the piece falls).
     * @param {number} col - The column index of the clicked cell.
     */
    handleFieldClick(row, col) {
        for (let i = ROWS - 1; i >= 0; i--) {
            if (model.state.board[i][col] === '') {
                model.setState();
                model.updateCell(i, col);

                if (model.checkWinner(i, col)) {
                    alert(`${model.state.currentPlayer === RED ? 'Red' : 'Yellow'} wins!`);
                    model.clearBoard();
                } else if(model.checkTie()) {
                    alert("It's a tie!");
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

    /**
     * Update the message and piece indicator to show whose turn it is.
     */
    updateTurnMessage() {
        this.turnMessageEl.textContent = `It's ${model.state.currentPlayer === RED ? 'Red' : 'Yellow'}'s turn!`;
        this.turnPieceEl.className = `piece ${model.state.currentPlayer === RED ? 'red' : 'yellow'}`;
    },
};

/**
 * Set a value in a list at a given index, returning a new updated list without mutating the original.
 * @param {Array} list - The original array.
 * @param {number} index - The index at which to set the value.
 * @param {*} value - The value to set.
 * @returns {Array} A new array with the updated value.
 */
function setInList(list, index, value) {
    return list.map((el, i) => i === index ? value : el);
}

/**
 * Set a key-value pair in an object, returning a new updated object without mutating the original.
 * @param {Object} obj - The original object.
 * @param {string} key - The property name to set.
 * @param {*} value - The value to assign.
 * @returns {Object} A new object with the updated key-value pair.
 */
function setInObject(obj, key, value) {
    return { ...obj, [key]: value };
}

// Initialize App
function init() {
    model.init();
    view.init();
}

init();