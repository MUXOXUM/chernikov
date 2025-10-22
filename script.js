class BaldaGame {
    constructor() {
        this.gameState = null;
        this.gameId = null;
        this.playerNumber = null;
        this.selectedCell = null;
        this.selectedLetter = null;
        
        this.initializeEventListeners();
        this.setupStorageListener();
    }

    initializeEventListeners() {
        // Кнопки начала
        document.getElementById('create-game-btn').addEventListener('click', () => this.createGame());
        document.getElementById('join-game-btn').addEventListener('click', () => this.joinGame());
        document.getElementById('game-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });

        // Кнопки ожидания
        document.getElementById('copy-link-btn').addEventListener('click', () => this.copyInviteLink());
        document.getElementById('cancel-waiting-btn').addEventListener('click', () => this.cancelWaiting());

        // Игровые кнопки
        document.getElementById('restart-game-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('leave-game-btn').addEventListener('click', () => this.leaveGame());

        // Модальное окно
        document.getElementById('submit-word-btn').addEventListener('click', () => this.submitWord());
        document.getElementById('cancel-word-btn').addEventListener('click', () => this.hideWordModal());
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWord();
        });
    }

    generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    createGame() {
        this.gameId = this.generateGameId();
        this.playerNumber = 1;
        
        this.gameState = {
            players: [1],
            currentPlayer: 1,
            board: this.initializeBoard(),
            scores: {1: 0, 2: 0},
            selectedCell: null,
            selectedLetter: null,
            status: 'waiting'
        };

        this.saveGameState();
        this.showWaitingScreen();
    }

    joinGame() {
        const gameCode = document.getElementById('game-code-input').value.trim().toUpperCase();
        
        if (!gameCode || gameCode.length !== 6) {
            alert('Пожалуйста, введите корректный код игры (6 символов)');
            return;
        }

        const savedState = localStorage.getItem(`balda_${gameCode}`);
        if (!savedState) {
            alert('Игра не найдена! Проверьте код игры.');
            return;
        }

        this.gameId = gameCode;
        this.gameState = JSON.parse(savedState);
        
        if (this.gameState.players.length >= 2) {
            alert('В этой игре уже есть два игрока!');
            return;
        }

        this.playerNumber = 2;
        this.gameState.players.push(2);
        this.gameState.status = 'playing';
        
        this.saveGameState();
        this.showGameScreen();
    }

    initializeBoard() {
        const board = [];
        for (let i = 0; i < 5; i++) {
            board[i] = [];
            for (let j = 0; j < 5; j++) {
                board[i][j] = '';
            }
        }
        
        // Стартовое слово "БАЛДА" в центре
        const startWord = 'БАЛДА';
        const startRow = 2;
        const startCol = 0;
        
        for (let i = 0; i < startWord.length; i++) {
            board[startRow][startCol + i] = startWord[i];
        }
        
        return board;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showWaitingScreen() {
        this.showScreen('waiting-screen');
        document.getElementById('game-code-display').textContent = this.gameId;
        
        const inviteLink = `${window.location.origin}${window.location.pathname}?game=${this.gameId}`;
        document.getElementById('invite-link-input').value = inviteLink;
        
        // Проверяем, присоединился ли второй игрок
        this.waitingInterval = setInterval(() => {
            const savedState = localStorage.getItem(`balda_${this.gameId}`);
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state.players.length === 2 && state.status === 'playing') {
                    clearInterval(this.waitingInterval);
                    this.gameState = state;
                    this.showGameScreen();
                }
            }
        }, 1000);
    }

    showGameScreen() {
        this.showScreen('game-screen');
        this.renderGame();
        document.getElementById('game-code-small').textContent = `Код: ${this.gameId}`;
    }

    renderGame() {
        this.renderBoard();
        this.renderPlayers();
        this.renderLetterSelection();
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.gameState.board[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Центральная строка с начальным словом выделяется
                if (i === 2 && j >= 0 && j <= 4) {
                    cell.classList.add('center');
                }
                
                if (this.gameState.selectedCell && 
                    this.gameState.selectedCell.row === i && 
                    this.gameState.selectedCell.col === j) {
                    cell.classList.add('selected');
                }
                
                cell.addEventListener('click', () => this.selectCell(i, j));
                boardElement.appendChild(cell);
            }
        }
    }

    renderPlayers() {
        const player1 = document.getElementById('player1');
        const player2 = document.getElementById('player2');
        
        player1.classList.toggle('active', this.gameState.currentPlayer === 1);
        player2.classList.toggle('active', this.gameState.currentPlayer === 2);
        
        player1.querySelector('.score').textContent = this.gameState.scores[1];
        player2.querySelector('.score').textContent = this.gameState.scores[2];
        
        document.getElementById('current-turn').textContent = 
            `Ход: Игрок ${this.gameState.currentPlayer}`;
    }

    renderLetterSelection() {
        const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
        const container = document.getElementById('letter-selection');
        container.innerHTML = '';
        
        for (let letter of letters) {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letter;
            
            if (this.gameState.selectedLetter === letter) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => this.selectLetter(letter));
            container.appendChild(btn);
        }
    }

    selectCell(row, col) {
        if (this.gameState.currentPlayer !== this.playerNumber) {
            alert('Сейчас не ваш ход!');
            return;
        }
        
        if (this.gameState.board[row][col] !== '') {
            alert('Эта клетка уже занята!');
            return;
        }
        
        this.gameState.selectedCell = { row, col };
        this.saveGameState();
        this.renderBoard();
    }

    selectLetter(letter) {
        if (!this.gameState.selectedCell) {
            alert('Сначала выберите клетку!');
            return;
        }
        
        if (this.gameState.currentPlayer !== this.playerNumber) {
            alert('Сейчас не ваш ход!');
            return;
        }
        
        this.gameState.selectedLetter = letter;
        this.saveGameState();
        this.renderLetterSelection();
        this.showWordModal();
    }

    showWordModal() {
        document.getElementById('word-modal').style.display = 'block';
        document.getElementById('word-input').value = '';
        document.getElementById('word-input').focus();
    }

    hideWordModal() {
        document.getElementById('word-modal').style.display = 'none';
        this.gameState.selectedLetter = null;
        this.saveGameState();
        this.renderLetterSelection();
    }

    submitWord() {
        const word = document.getElementById('word-input').value.trim().toUpperCase();
        
        if (!word) {
            alert('Пожалуйста, введите слово!');
            return;
        }
        
        if (word.length < 2) {
            alert('Слово должно содержать хотя бы 2 буквы!');
            return;
        }
        
        // Здесь должна быть проверка слова по словарю
        // Пока просто принимаем любое слово
        
        const { row, col } = this.gameState.selectedCell;
        this.gameState.board[row][col] = this.gameState.selectedLetter;
        
        // Начисляем очки (длина слова)
        this.gameState.scores[this.playerNumber] += word.length;
        
        // Передаем ход
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.gameState.selectedCell = null;
        this.gameState.selectedLetter = null;
        
        this.saveGameState();
        this.hideWordModal();
        this.renderGame();
        
        alert(`Слово "${word}" принято! +${word.length} очков`);
    }

    saveGameState() {
        localStorage.setItem(`balda_${this.gameId}`, JSON.stringify(this.gameState));
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === `balda_${this.gameId}` && e.newValue) {
                const newState = JSON.parse(e.newValue);
                
                if (this.gameState && newState) {
                    // Обновляем состояние только если это не наш собственный ход
                    if (JSON.stringify(this.gameState) !== JSON.stringify(newState)) {
                        this.gameState = newState;
                        this.renderGame();
                    }
                }
            }
        });
    }

    copyInviteLink() {
        const linkInput = document.getElementById('invite-link-input');
        linkInput.select();
        document.execCommand('copy');
        alert('Ссылка скопирована в буфер обмена!');
    }

    cancelWaiting() {
        if (this.waitingInterval) {
            clearInterval(this.waitingInterval);
        }
        localStorage.removeItem(`balda_${this.gameId}`);
        this.showScreen('start-screen');
    }

    restartGame() {
        this.gameState.board = this.initializeBoard();
        this.gameState.scores = {1: 0, 2: 0};
        this.gameState.currentPlayer = 1;
        this.gameState.selectedCell = null;
        this.gameState.selectedLetter = null;
        
        this.saveGameState();
        this.renderGame();
    }

    leaveGame() {
        if (confirm('Вы уверены, что хотите выйти из игры?')) {
            localStorage.removeItem(`balda_${this.gameId}`);
            this.showScreen('start-screen');
        }
    }
}

// Проверка URL на наличие кода игры при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('game');
    
    if (gameCode) {
        document.getElementById('game-code-input').value = gameCode;
    }
    
    // Инициализация игры
    window.baldaGame = new BaldaGame();
});