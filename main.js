let state = {
    board: Array(6).fill('').map(() => Array(7).fill(''))
};

let currentPlayer = 'r';

function showBoard() {
    const boardEl = document.querySelector('.board');
    boardEl.innerHTML = '';

    state.board.forEach((row,rowIndex) => {
        row.forEach((cell,cellIndex) => {
            const field = document.createElement("div");
            field.classList.add("field");

            if (cell === 'r') {
                const piece = document.createElement("div");
                piece.classList.add("piece", "red");
                field.appendChild(piece);
            } else if (cell === 'y') {
                const piece = document.createElement("div");
                piece.classList.add("piece", "yellow");
                field.appendChild(piece);
            }

            field.addEventListener("click", () => {
                updateField(rowIndex,cellIndex);
            })

            boardEl.appendChild(field);
        })
    })
}

function updateField(row,col) {

    console.log(state.board.length);
    for(let i = state.board.length - 1; i >= 0; i--) {
        if(state.board[i][col] === '') {
            state.board[i][col] = currentPlayer;
            currentPlayer = currentPlayer === 'r' ? 'y' : 'r';
            document.querySelector('.turnMessage').textContent = `It's ${currentPlayer === 'r' ? 'Red' : 'Yellow'}'s turn!`;
            showBoard();
            break;
        }
    }

}

function clearBoard() {
    state.board = Array(6).fill('').map(() => Array(7).fill(''));
    showBoard();
    document.querySelector('.turnMessage').textContent = "It's Red's turn!";
}

document.querySelector('.newGame').addEventListener("click", clearBoard);

clearBoard();
