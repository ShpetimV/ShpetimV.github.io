let state = {
    board: Array(6).fill('').map(() => Array(7).fill(''))
};

function showBoard() {
    const boardEl = document.querySelector('.board');
    boardEl.innerHTML = '';

    state.board.forEach(row => {
        row.forEach(cell => {
            const field = document.createElement("div");
            field.classList.add("field");

            if (cell === 'r') {
                const piece = document.createElement("div");
                piece.classList.add("piece", "red");
                field.appendChild(piece);
            } else if (cell === 'b') {
                const piece = document.createElement("div");
                piece.classList.add("piece", "blue");
                field.appendChild(piece);
            }

            boardEl.appendChild(field);
        })
    })
}

function updateRandomField() {
    const row = Math.floor(Math.random() * 6);
    const col = Math.floor(Math.random() * 7);
    const random = Math.random();

    if (random < 0.33) {
        state.board[row][col] = '';
    } else if (random < 0.66) {
        state.board[row][col] = 'r';
    } else {
        state.board[row][col] = 'b';
    }

    showBoard();
}

document.addEventListener("DOMContentLoaded", () => {
    showBoard(); // Initial rendering of the board
    setInterval(updateRandomField, 1000); // Update a random field every second
    console.log(state.board);
});