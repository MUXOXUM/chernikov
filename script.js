class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notification-container');
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type]}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        this.container.appendChild(notification);

        // Запускаем анимацию появления
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease';
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
                notification.style.opacity = '1';
            }, 10);
        }, 10);

        // Автоматическое скрытие
        setTimeout(() => {
            this.hide(notification);
        }, duration);

        return notification;
    }

    hide(notification) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 10);
    }

    // Вспомогательные методы для разных типов уведомлений
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

class BaldaGame {
    constructor() {
        this.gameState = null;
        this.gameId = null;
        this.playerNumber = null;
        this.selectedCell = null;
        this.selectedLetter = null;
        this.notification = new NotificationSystem();
        this.waitingInterval = null;
        
        this.initializeEventListeners();
        this.setupStorageListener();
        
        // Проверка URL на наличие кода игры при загрузке
        const urlParams = new URLSearchParams(window.location.search);
        const gameCode = urlParams.get('game');
        
        if (gameCode) {
            document.getElementById('game-code-input').value = gameCode;
            this.notification.info(`Найдена игра с кодом: ${gameCode}. Нажмите "Присоединиться"`);
        }
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
            status: 'waiting',
            usedWords: []
        };

        this.saveGameState();
        this.showWaitingScreen();
        this.notification.success('Игра создана! Ожидаем второго игрока...');
    }

    joinGame() {
        const gameCode = document.getElementById('game-code-input').value.trim().toUpperCase();
        
        if (!gameCode || gameCode.length !== 6) {
            this.notification.error('Пожалуйста, введите корректный код игры (6 символов)');
            return;
        }

        const savedState = localStorage.getItem(`balda_${gameCode}`);
        if (!savedState) {
            this.notification.error('Игра не найдена! Проверьте код игры.');
            return;
        }

        this.gameId = gameCode;
        this.gameState = JSON.parse(savedState);
        
        if (this.gameState.players.length >= 2) {
            this.notification.error('В этой игре уже есть два игрока!');
            return;
        }

        this.playerNumber = 2;
        this.gameState.players.push(2);
        this.gameState.status = 'playing';
        
        this.saveGameState();
        this.showGameScreen();
        this.notification.success('Вы успешно присоединились к игре!');
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
                    this.notification.success('Второй игрок присоединился! Игра начинается!');
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
            this.notification.warning('Сейчас не ваш ход!');
            return;
        }
        
        if (this.gameState.board[row][col] !== '') {
            this.notification.warning('Эта клетка уже занята!');
            return;
        }
        
        this.gameState.selectedCell = { row, col };
        this.saveGameState();
        this.renderBoard();
        this.notification.info('Клетка выбрана. Теперь выберите букву.');
    }

    selectLetter(letter) {
        if (!this.gameState.selectedCell) {
            this.notification.warning('Сначала выберите клетку!');
            return;
        }
        
        if (this.gameState.currentPlayer !== this.playerNumber) {
            this.notification.warning('Сейчас не ваш ход!');
            return;
        }
        
        this.gameState.selectedLetter = letter;
        this.saveGameState();
        this.renderLetterSelection();
        this.showWordModal();
        this.notification.info(`Выбрана буква "${letter}". Введите слово.`);
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
        this.notification.info('Выбор слова отменен');
    }

    submitWord() {
        const word = document.getElementById('word-input').value.trim().toUpperCase();
        
        if (!word) {
            this.notification.error('Пожалуйста, введите слово!');
            return;
        }
        
        if (word.length < 2) {
            this.notification.error('Слово должно содержать хотя бы 2 буквы!');
            return;
        }
        
        // Проверяем, не использовалось ли слово ранее
        if (this.gameState.usedWords.includes(word)) {
            this.notification.error('Это слово уже использовалось в игре!');
            return;
        }
        
        // Проверяем, можно ли составить слово из букв на поле
        if (!this.validateWord(word)) {
            this.notification.error('Невозможно составить это слово из доступных букв!');
            return;
        }
        
        const { row, col } = this.gameState.selectedCell;
        this.gameState.board[row][col] = this.gameState.selectedLetter;
        
        // Начисляем очки (длина слова)
        this.gameState.scores[this.playerNumber] += word.length;
        this.gameState.usedWords.push(word);
        
        // Передаем ход
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.gameState.selectedCell = null;
        this.gameState.selectedLetter = null;
        
        this.saveGameState();
        this.hideWordModal();
        this.renderGame();
        
        this.notification.success(`Слово "${word}" принято! +${word.length} очков`);
    }

    validateWord(word) {
        // Простая проверка - слово должно содержать выбранную букву
        // В реальной игре здесь должна быть сложная логика проверки пути по полю
        return word.includes(this.gameState.selectedLetter);
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
                        const wasMyTurn = this.gameState.currentPlayer === this.playerNumber;
                        this.gameState = newState;
                        this.renderGame();
                        
                        if (wasMyTurn && this.gameState.currentPlayer !== this.playerNumber) {
                            this.notification.info('Ход перешел к другому игроку');
                        } else if (!wasMyTurn && this.gameState.currentPlayer === this.playerNumber) {
                            this.notification.success('Ваш ход!');
                        }
                    }
                }
            }
        });
    }

    copyInviteLink() {
        const linkInput = document.getElementById('invite-link-input');
        linkInput.select();
        document.execCommand('copy');
        this.notification.success('Ссылка скопирована в буфер обмена!');
    }

    cancelWaiting() {
        if (this.waitingInterval) {
            clearInterval(this.waitingInterval);
        }
        localStorage.removeItem(`balda_${this.gameId}`);
        this.showScreen('start-screen');
        this.notification.info('Создание игры отменено');
    }

    restartGame() {
        if (this.gameState.currentPlayer !== this.playerNumber) {
            this.notification.warning('Только текущий игрок может начать новую игру!');
            return;
        }

        this.gameState.board = this.initializeBoard();
        this.gameState.scores = {1: 0, 2: 0};
        this.gameState.currentPlayer = 1;
        this.gameState.selectedCell = null;
        this.gameState.selectedLetter = null;
        this.gameState.usedWords = [];
        
        this.saveGameState();
        this.renderGame();
        this.notification.success('Новая игра начата!');
    }

    leaveGame() {
        if (confirm('Вы уверены, что хотите выйти из игры?')) {
            localStorage.removeItem(`balda_${this.gameId}`);
            this.showScreen('start-screen');
            this.notification.info('Вы вышли из игры');
        }
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.baldaGame = new BaldaGame();
});

// Обработка изменения видимости страницы для улучшения синхронизации
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.baldaGame && window.baldaGame.gameId) {
        // При возвращении на вкладку проверяем обновления
        const savedState = localStorage.getItem(`balda_${window.baldaGame.gameId}`);
        if (savedState && window.baldaGame.gameState) {
            const newState = JSON.parse(savedState);
            if (JSON.stringify(window.baldaGame.gameState) !== JSON.stringify(newState)) {
                window.baldaGame.gameState = newState;
                window.baldaGame.renderGame();
                window.baldaGame.notification.info('Состояние игры обновлено');
            }
        }
    }
});