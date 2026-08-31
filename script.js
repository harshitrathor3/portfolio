const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 120));

  const tabButtons = document.querySelectorAll('.job-tabs button');
  const panels = document.querySelectorAll('.job-panel');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.querySelector(`.job-panel[data-panel="${btn.dataset.job}"]`).classList.add('active');
    });
  });

  // Othello Game
  class OthelloGame {
    constructor() {
      this.board = this.initBoard();
      this.currentPlayer = 1; // 1 = white (human), -1 = blue (AI)
      this.difficulty = 'medium';
      this.gameOver = false;
      this.isProcessing = false; // Prevent moves during AI turn
      this.init();
    }

    initBoard() {
      const board = Array(8).fill().map(() => Array(8).fill(0));
      board[3][3] = 1;
      board[3][4] = -1;
      board[4][3] = -1;
      board[4][4] = 1;
      return board;
    }

    deepCopyBoard(board) {
      return board.map(row => [...row]);
    }

    init() {
      document.getElementById('resetBtn')?.addEventListener('click', () => this.reset());
      document.getElementById('difficultySelect')?.addEventListener('change', (e) => {
        this.difficulty = e.target.value;
      });
      this.render();
    }

    reset() {
      this.board = this.initBoard();
      this.currentPlayer = 1;
      this.gameOver = false;
      this.isProcessing = false;
      this.render();
    }

    isValid(row, col, player, board = null) {
      const b = board || this.board;
      if (b[row][col] !== 0) return false;
      const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        let hasOpponent = false;
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === -player) {
          hasOpponent = true;
          r += dr;
          c += dc;
        }
        if (hasOpponent && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === player) {
          return true;
        }
      }
      return false;
    }

    getValidMoves(player, board = null) {
      const b = board || this.board;
      const moves = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (this.isValid(i, j, player, b)) moves.push([i, j]);
        }
      }
      return moves;
    }

    flip(row, col, player, board = null) {
      const b = board || this.board;
      const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        const toFlip = [];
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === -player) {
          toFlip.push([r, c]);
          r += dr;
          c += dc;
        }
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === player) {
          toFlip.forEach(([tr, tc]) => { b[tr][tc] = player; });
        }
      }
    }

    play(row, col, player, board = null) {
      const b = board || this.board;
      if (this.isValid(row, col, player, b)) {
        b[row][col] = player;
        this.flip(row, col, player, b);
        return true;
      }
      return false;
    }

    makeAIMove() {
      if (this.gameOver || this.currentPlayer !== -1) return;
      
      const moves = this.getValidMoves(-1);
      if (moves.length === 0) {
        const humanMoves = this.getValidMoves(1);
        if (humanMoves.length === 0) {
          this.gameOver = true;
          this.render();
          this.updateStatus();
          this.isProcessing = false;
        } else {
          this.currentPlayer = 1;
          this.isProcessing = false;
          this.render();
          this.updateStatus();
        }
        return;
      }

      let bestMove = moves[0];
      if (this.difficulty === 'easy') {
        bestMove = moves[Math.floor(Math.random() * moves.length)];
      } else if (this.difficulty === 'medium') {
        bestMove = this.getMediumMove(moves);
      } else {
        bestMove = this.getHardMove(moves);
      }

      this.play(bestMove[0], bestMove[1], -1);
      
      const humanMoves = this.getValidMoves(1);
      if (humanMoves.length === 0) {
        const aiMoves = this.getValidMoves(-1);
        if (aiMoves.length === 0) {
          this.gameOver = true;
          this.render();
          this.updateStatus();
          this.isProcessing = false;
        } else {
          this.currentPlayer = -1;
          this.render();
          this.updateStatus();
          setTimeout(() => this.makeAIMove(), 600);
        }
      } else {
        this.currentPlayer = 1;
        this.isProcessing = false;
        this.render();
        this.updateStatus();
      }
    }

    getMediumMove(moves) {
      let bestMove = moves[0];
      let bestScore = -100;
      for (const [r, c] of moves) {
        const corners = (r === 0 || r === 7) && (c === 0 || c === 7) ? 10 : 0;
        const edges = (r === 0 || r === 7 || c === 0 || c === 7) ? 2 : 0;
        const score = corners + edges + Math.random();
        if (score > bestScore) {
          bestScore = score;
          bestMove = [r, c];
        }
      }
      return bestMove;
    }

    getHardMove(moves) {
      let bestMove = moves[0];
      let bestScore = -1000;
      for (const [r, c] of moves) {
        const boardCopy = this.deepCopyBoard(this.board);
        this.play(r, c, -1, boardCopy);
        const score = this.minimax(3, 1, -1000, 1000, boardCopy);
        if (score > bestScore) {
          bestScore = score;
          bestMove = [r, c];
        }
      }
      return bestMove;
    }

    minimax(depth, player, alpha, beta, board) {
      if (depth === 0) return this.evaluateBoard(board);
      const moves = this.getValidMoves(player, board);
      if (moves.length === 0) {
        const opponentMoves = this.getValidMoves(-player, board);
        if (opponentMoves.length === 0) return this.evaluateBoard(board);
        return this.minimax(depth - 1, -player, alpha, beta, board);
      }

      if (player === -1) {
        let maxEval = -1000;
        for (const [r, c] of moves) {
          const boardCopy = this.deepCopyBoard(board);
          this.play(r, c, -1, boardCopy);
          const eval_ = this.minimax(depth - 1, 1, alpha, beta, boardCopy);
          maxEval = Math.max(maxEval, eval_);
          alpha = Math.max(alpha, eval_);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = 1000;
        for (const [r, c] of moves) {
          const boardCopy = this.deepCopyBoard(board);
          this.play(r, c, 1, boardCopy);
          const eval_ = this.minimax(depth - 1, -1, alpha, beta, boardCopy);
          minEval = Math.min(minEval, eval_);
          beta = Math.min(beta, eval_);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    evaluateBoard(board) {
      let white = 0, blue = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j] === 1) white++;
          else if (board[i][j] === -1) blue++;
        }
      }
      return blue - white;
    }

    evaluate() {
      return this.evaluateBoard(this.board);
    }

    updateStatus() {
      const statusEl = document.getElementById('gameStatus');
      if (!statusEl) return;
      
      if (this.gameOver) {
        let white = 0, blue = 0;
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (this.board[i][j] === 1) white++;
            else if (this.board[i][j] === -1) blue++;
          }
        }
        let resultText = '';
        if (white > blue) resultText = `Game Over! You won ${white}-${blue}`;
        else if (blue > white) resultText = `Game Over! AI won ${blue}-${white}`;
        else resultText = `Game Over! It's a tie ${white}-${blue}`;
        
        statusEl.innerHTML = `<span class="status-dot"></span>${resultText}`;
        statusEl.classList.remove('ai-turn');
      } else if (this.currentPlayer === 1) {
        statusEl.innerHTML = '<span class="status-dot"></span>Your turn';
        statusEl.classList.remove('ai-turn');
      } else {
        statusEl.innerHTML = '<span class="status-dot"></span>AI is thinking...';
        statusEl.classList.add('ai-turn');
      }
    }

    render() {
      const boardEl = document.getElementById('gameBoard');
      if (!boardEl) return;
      boardEl.innerHTML = '';
      
      const validMoves = this.currentPlayer === 1 ? this.getValidMoves(1) : [];
      const validMovesSet = new Set(validMoves.map(m => m.join(',')));
      
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const cell = document.createElement('div');
          cell.className = 'game-cell';
          const isValid = validMovesSet.has(`${i},${j}`);
          
          if (this.board[i][j] === 1) {
            cell.classList.add('white');
          } else if (this.board[i][j] === -1) {
            cell.classList.add('blue');
          } else if (isValid) {
            cell.classList.add('valid');
          }
          
          if (isValid && !this.isProcessing && this.currentPlayer === 1) {
            const row = i, col = j;
            cell.addEventListener('click', () => this.handleCellClick(row, col));
          }
          
          boardEl.appendChild(cell);
        }
      }
      this.updateScore();
      this.updateStatus();
    }

    handleCellClick(row, col) {
      if (this.isProcessing || this.gameOver || this.currentPlayer !== 1) return;
      
      const boardCopy = this.deepCopyBoard(this.board);
      if (this.play(row, col, 1)) {
        this.currentPlayer = -1;
        this.isProcessing = true;
        this.render();
        this.updateStatus();
        setTimeout(() => this.makeAIMove(), 800);
      }
    }

    updateScore() {
      let white = 0, blue = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (this.board[i][j] === 1) white++;
          else if (this.board[i][j] === -1) blue++;
        }
      }
      const whiteScoreEl = document.getElementById('whiteScore');
      const blueScoreEl = document.getElementById('blueScore');
      if (whiteScoreEl) whiteScoreEl.textContent = white;
      if (blueScoreEl) blueScoreEl.textContent = blue;
    }
  }

  // Initialize game when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('gameBoard')) {
        new OthelloGame();
      }
    });
  } else {
    if (document.getElementById('gameBoard')) {
      new OthelloGame();
    }
  }