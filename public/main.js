// Constants
const ROWS = 6;
const COLS = 7;
const RED = 'r';
const YELLOW = 'y';
const SERVICE = "http://localhost:3000/api/data/?api-key=c4game";
const API_KEY = "c4game";
const DATA_KEY = "gameState";

// Model
const model = {
    state: {
        board: Array(ROWS).fill('').map(() => Array(COLS).fill('')),
        currentPlayer: RED,
    },
    init() {
        this.clearBoard(); // Initialize the board
    },
    clearBoard() {
        this.state.board = Array(ROWS).fill('').map(() => Array(COLS).fill(''));
        this.state.currentPlayer = RED;
    },
    togglePlayer() {
        this.state.currentPlayer = this.state.currentPlayer === RED ? YELLOW : RED;
    },
    updateCell(row, col) {
        this.state.board[row][col] = this.state.currentPlayer;
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
        this.renderBoard();
    },
    renderBoard() {
        this.boardEl.innerHTML = ''; // Clear all fields from the existing board element

        // Generate fields for the board
        model.state.board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const fieldSJDON = ["div", {
                    className: "field",
                    dataset: { row: rowIndex, col: colIndex },
                    onclick: () => this.handleFieldClick(rowIndex, colIndex)
                }];

                // Add a piece if the cell is occupied
                if (cell === RED) {
                    fieldSJDON.push(["div", { className: "piece red" }]);
                } else if (cell === YELLOW) {
                    fieldSJDON.push(["div", { className: "piece yellow" }]);
                }

                // Render this field into the existing board element
                renderSJDON(fieldSJDON, this.boardEl);
            });
        });
    },
    handleFieldClick(row, col) {
        for (let i = ROWS - 1; i >= 0; i--) {
            if (model.state.board[i][col] === '') {
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

function renderSJDON(sjdonelm, root) {
    let element = document.createElement(sjdonelm[0]);

    for (let i = 1; i < sjdonelm.length; i++) {
        if (Array.isArray(sjdonelm[i])) {
            renderSJDON(sjdonelm[i], element);
        } else if (typeof sjdonelm[i] === "object") {
            for (const [key, value] of Object.entries(sjdonelm[i])) {
                if (key === "dataset") {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else if (key.startsWith("on")) {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    element[key] = value;
                }
            }
        } else if (typeof sjdonelm[i] === "string") {
            element.textContent = sjdonelm[i];
        }
    }
    root.append(element);
}

// Initialize App
function init() {
    model.init();
    view.init();
}

init();