// Constants
const ROWS = 6;
const COLS = 7;
const RED = 'r';
const YELLOW = 'y';
const SERVICE = "http://localhost:3000/api/data/?api-key=c4game";

// State (Model)
const state = {
    board: Array(ROWS).fill('').map(() => Array(COLS).fill('')),
    currentPlayer: RED,
};

// DOM Elements
const boardEl = document.querySelector('.board');
const turnMessageEl = document.querySelector('.turnMessage');
const turnPieceEl = document.querySelector('.turnPiece .piece');
const newGameBtn = document.querySelector('.newGame');

// Initialize App
function init() {
    newGameBtn.addEventListener("click", clearBoard);
    clearBoard();
}

// Show the Board
function renderBoard() {
    boardEl.innerHTML = ''; // Clear the board

    state.board.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const field = document.createElement("div");
            field.classList.add("field");

            if (cell === RED) {
                const piece = createPiece(RED);
                field.appendChild(piece);
            } else if (cell === YELLOW) {
                const piece = createPiece(YELLOW);
                field.appendChild(piece);
            }

            field.addEventListener("click", () => handleFieldClick(rowIndex, cellIndex));
            boardEl.appendChild(field);
        });
    });
}

// Create a Piece
function createPiece(color) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color === RED ? "red" : "yellow");
    return piece;
}

// Handle Field Click
function handleFieldClick(row, col) {
    for (let i = ROWS - 1; i >= 0; i--) {
        if (state.board[i][col] === '') {
            state.board[i][col] = state.currentPlayer;

            if (checkWinner(i, col)) {
                alert(`${state.currentPlayer === RED ? 'Red' : 'Yellow'} wins!`);
                clearBoard();
            } else {
                togglePlayer();
            }

            renderBoard();
            break;
        }
    }
}

// Toggle Current Player
function togglePlayer() {
    state.currentPlayer = state.currentPlayer === RED ? YELLOW : RED;

    // Update UI
    turnMessageEl.textContent = `It's ${state.currentPlayer === RED ? 'Red' : 'Yellow'}'s turn!`;
    turnPieceEl.className = `piece ${state.currentPlayer === RED ? 'red' : 'yellow'}`;
}

// Check Winner
function checkWinner(row, col) {
    return checkHorizontal(row) || checkVertical(col) || checkDiagonalRight(row, col) || checkDiagonalLeft(row, col);
}

function checkHorizontal(row) {
    let count = 0;
    for (let col = 0; col < COLS; col++) {
        count = (state.board[row][col] === state.currentPlayer) ? count + 1 : 0;
        if (count >= 4) return true;
    }
    return false;
}

function checkVertical(col) {
    let count = 0;
    for (let row = 0; row < ROWS; row++) {
        count = (state.board[row][col] === state.currentPlayer) ? count + 1 : 0;
        if (count >= 4) return true;
    }
    return false;
}

function checkDiagonalRight(row, col) {
    let count = 0;
    for (let i = -3; i <= 3; i++) {
        const r = row + i;
        const c = col + i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            count = (state.board[r][c] === state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
    }
    return false;
}

function checkDiagonalLeft(row, col) {
    let count = 0;
    for (let i = -3; i <= 3; i++) {
        const r = row + i;
        const c = col - i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            count = (state.board[r][c] === state.currentPlayer) ? count + 1 : 0;
            if (count >= 4) return true;
        }
    }
    return false;
}

// Clear the Board
function clearBoard() {
    state.board = Array(ROWS).fill('').map(() => Array(COLS).fill(''));
    state.currentPlayer = RED;
    renderBoard();

    // Reset UI
    turnMessageEl.textContent = "It's Red's turn!";
    turnPieceEl.className = "piece red";
}

function loadState() {
    if(!localStorage.getItem('savedGameId')) {
        alert('No saved game found!');
        return;
    }

    const savedId = localStorage.getItem('savedGameId');
    fetch(`http://localhost:3000/api/data/${savedId}?api-key=c4game`)
        .then(response => response.json())
        .then(data => {
            state.board = data.gameState.board;
            state.currentPlayer = data.gameState.currentPlayer;
            renderBoard();
        });
}

function saveState() {
    fetch(SERVICE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState: state })
    })
        .then(response => response.json())
        .then(data => {
            // data will have an {id: <generated-id>} property
            // Store this id so you can update it later using PUT
            localStorage.setItem('savedGameId', data.id);
        });
}

// Start the Game
init();