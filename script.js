// Game state
const gameState = {
    board: Array(9).fill(null),
    currentPlayer: "player",
    winner: null,
    winningLine: null,
    gameOver: false,
    difficulty: "medium",
    playerSymbol: "X",
    aiSymbol: "O",
    isThinking: false,
  }
  
  // DOM elements
  const symbolSelector = document.getElementById("symbol-selector")
  const gameBoard = document.getElementById("game-board")
  const gameControls = document.getElementById("game-controls")
  const boardGrid = document.querySelector(".board-grid")
  const thinkingOverlay = document.getElementById("thinking-overlay")
  const turnDot = document.getElementById("turn-dot")
  const turnText = document.getElementById("turn-text")
  const easyBtn = document.getElementById("easy-btn")
  const mediumBtn = document.getElementById("medium-btn")
  const hardBtn = document.getElementById("hard-btn")
  const restartBtn = document.getElementById("restart-btn")
  const winnerModal = document.getElementById("winner-modal")
  const winnerIcon = document.getElementById("winner-icon")
  const winnerTitle = document.getElementById("winner-title")
  const winnerMessage = document.getElementById("winner-message")
  const playAgainBtn = document.getElementById("play-again-btn")
  const confettiContainer = document.getElementById("confetti-container")
  
  // Audio context for sound effects
  let audioContext = null
  
  // Initialize the game
  function initGame() {
    // Initialize audio context
    initAudioContext()
  
    // Set up event listeners
    setupEventListeners()
  
    // Initialize particles background
    initParticles()
  
    // Create the game board cells
    createGameBoard()
  }
  
  // Initialize audio context
  function initAudioContext() {
    // AudioContext must be initialized after user interaction in many browsers
    const initContext = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
  
    // Initialize on first user interaction
    window.addEventListener("click", initContext, { once: true })
    window.addEventListener("touchstart", initContext, { once: true })
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Symbol selection
    const symbolButtons = document.querySelectorAll(".symbol-button")
    symbolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const symbol = button.getAttribute("data-symbol")
        handleSymbolSelect(symbol)
      })
    })
  
    // Difficulty buttons
    easyBtn.addEventListener("click", () => handleDifficultyChange("easy"))
    mediumBtn.addEventListener("click", () => handleDifficultyChange("medium"))
    hardBtn.addEventListener("click", () => handleDifficultyChange("hard"))
  
    // Restart button
    restartBtn.addEventListener("click", handleRestart)
  
    // Play again button
    playAgainBtn.addEventListener("click", handleRestart)
  }
  
  // Create the game board cells
  function createGameBoard() {
    boardGrid.innerHTML = ""
  
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div")
      cell.className = "cell"
      cell.setAttribute("data-index", i)
  
      // Add animation delay based on index
      cell.style.animation = `cellAppear 0.3s ease forwards ${i * 0.05}s`
  
      // Add click event
      cell.addEventListener("click", () => handleCellClick(i))
  
      // Add hover effect
      cell.addEventListener("mouseenter", () => {
        if (!gameState.board[i] && gameState.currentPlayer === "player" && !gameState.isThinking) {
          const ghostSymbol = createSymbolElement(gameState.playerSymbol)
          ghostSymbol.classList.add("ghost-symbol")
          cell.appendChild(ghostSymbol)
        }
      })
  
      cell.addEventListener("mouseleave", () => {
        const ghostSymbol = cell.querySelector(".ghost-symbol")
        if (ghostSymbol) {
          cell.removeChild(ghostSymbol)
        }
      })
  
      boardGrid.appendChild(cell)
    }
  }
  
  // Handle symbol selection
  function handleSymbolSelect(symbol) {
    gameState.playerSymbol = symbol
    gameState.aiSymbol = symbol === "X" ? "O" : "X"
  
    // Hide symbol selector and show game board and controls
    symbolSelector.classList.add("hidden")
    gameBoard.classList.remove("hidden")
    gameControls.classList.remove("hidden")
  
    // Play start sound
    playSound("start")
  
    // Update turn indicator
    updateTurnIndicator()
  }
  
  // Handle cell click
  function handleCellClick(index) {
    // Ignore clicks if game is over or cell is already filled
    if (
      gameState.gameOver ||
      gameState.board[index] !== null ||
      gameState.currentPlayer !== "player" ||
      gameState.isThinking
    ) {
      playSound("error")
      return
    }
  
    playSound("click")
  
    // Update board with player's move
    gameState.board[index] = gameState.playerSymbol
    updateCell(index)
  
    // Check for winner or draw
    const result = checkWinner()
  
    if (result.winner) {
      gameState.winner = result.winner
      gameState.winningLine = result.line
      gameState.gameOver = true
  
      highlightWinningCells()
  
      if (result.winner === gameState.playerSymbol) {
        playSound("win")
        setTimeout(() => {
          showWinnerModal("player")
          createConfetti()
        }, 1000)
      } else {
        playSound("lose")
        setTimeout(() => showWinnerModal("ai"), 1000)
      }
      return
    }
  
    if (result.isDraw) {
      gameState.gameOver = true
      playSound("draw")
      setTimeout(() => showWinnerModal("draw"), 1000)
      return
    }
  
    // Switch to AI's turn
    gameState.currentPlayer = "ai"
    updateTurnIndicator()
  
    // AI's turn
    handleAITurn()
  }
  
  // Handle AI turn
  function handleAITurn() {
    gameState.isThinking = true
    thinkingOverlay.classList.remove("hidden")
  
    // Add delay based on difficulty to simulate "thinking"
    const thinkingTime = gameState.difficulty === "easy" ? 500 : gameState.difficulty === "medium" ? 800 : 1200
  
    setTimeout(() => {
      const aiMoveIndex = getAIMove()
  
      if (aiMoveIndex !== null) {
        gameState.board[aiMoveIndex] = gameState.aiSymbol
        updateCell(aiMoveIndex)
        playSound("aiMove")
  
        // Check for winner or draw after AI move
        const result = checkWinner()
  
        if (result.winner) {
          gameState.winner = result.winner
          gameState.winningLine = result.line
          gameState.gameOver = true
  
          highlightWinningCells()
  
          if (result.winner === gameState.playerSymbol) {
            playSound("win")
            setTimeout(() => {
              showWinnerModal("player")
              createConfetti()
            }, 1000)
          } else {
            playSound("lose")
            setTimeout(() => showWinnerModal("ai"), 1000)
          }
        } else if (result.isDraw) {
          gameState.gameOver = true
          playSound("draw")
          setTimeout(() => showWinnerModal("draw"), 1000)
        } else {
          gameState.currentPlayer = "player"
          updateTurnIndicator()
        }
      }
  
      gameState.isThinking = false
      thinkingOverlay.classList.add("hidden")
    }, thinkingTime)
  }
  
  // Update cell appearance
  function updateCell(index) {
    const cell = document.querySelector(`.cell[data-index="${index}"]`)
  
    // Remove any ghost symbols
    const ghostSymbol = cell.querySelector(".ghost-symbol")
    if (ghostSymbol) {
      cell.removeChild(ghostSymbol)
    }
  
    // Add the actual symbol
    const symbol = createSymbolElement(gameState.board[index])
    cell.appendChild(symbol)
    cell.classList.add("filled")
  
    // Add player or AI class
    if (gameState.board[index] === gameState.playerSymbol) {
      cell.classList.add("player-cell")
    } else {
      cell.classList.add("ai-cell")
    }
  
    // Animate the symbol appearing
    setTimeout(() => {
      symbol.classList.add("cell-symbol")
    }, 10)
  }
  
  // Create symbol element
  function createSymbolElement(symbol) {
    const symbolElement = document.createElement("div")
    symbolElement.className = "cell-symbol"
  
    let svgContent = ""
  
    switch (symbol) {
      case "X":
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `
        break
      case "O":
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        `
        break
      case "ZAP":
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        `
        break
      case "FIRE":
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        `
        break
      case "STAR":
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        `
        break
    }
  
    symbolElement.innerHTML = svgContent
    return symbolElement
  }
  
  // Highlight winning cells
  function highlightWinningCells() {
    if (!gameState.winningLine) return
  
    gameState.winningLine.forEach((index) => {
      const cell = document.querySelector(`.cell[data-index="${index}"]`)
      cell.classList.add("winning-cell")
  
      // Add pulsing border
      const highlight = document.createElement("div")
      highlight.className = "winning-highlight"
      cell.appendChild(highlight)
    })
  }
  
  // Update turn indicator
  function updateTurnIndicator() {
    if (gameState.currentPlayer === "player") {
      turnDot.classList.add("player-turn")
      turnDot.classList.remove("ai-turn")
      turnText.textContent = "Your Turn"
    } else {
      turnDot.classList.remove("player-turn")
      turnDot.classList.add("ai-turn")
      turnText.textContent = "AI's Turn"
    }
  }
  
  // Handle difficulty change
  function handleDifficultyChange(difficulty) {
    playSound("click")
  
    gameState.difficulty = difficulty
  
    // Update active button
    easyBtn.classList.remove("active")
    mediumBtn.classList.remove("active")
    hardBtn.classList.remove("active")
  
    if (difficulty === "easy") {
      easyBtn.classList.add("active")
    } else if (difficulty === "medium") {
      mediumBtn.classList.add("active")
    } else {
      hardBtn.classList.add("active")
    }
  }
  
  // Handle restart
  function handleRestart() {
    playSound("click")
  
    // Reset game state
    gameState.board = Array(9).fill(null)
    gameState.currentPlayer = "player"
    gameState.winner = null
    gameState.winningLine = null
    gameState.gameOver = false
  
    // Clear the board
    const cells = document.querySelectorAll(".cell")
    cells.forEach((cell) => {
      cell.innerHTML = ""
      cell.classList.remove("filled", "player-cell", "ai-cell", "winning-cell")
    })
  
    // Hide winner modal
    winnerModal.classList.add("hidden")
  
    // Update turn indicator
    updateTurnIndicator()
  }
  
  // Show winner modal
  function showWinnerModal(winner) {
    // Set icon
    winnerIcon.innerHTML = ""
  
    if (winner === "player") {
      winnerIcon.classList.remove("ai-win", "draw")
      winnerTitle.textContent = "You Win!"
      winnerMessage.textContent = "Congratulations! You've beaten the AI."
  
      const trophyIcon = document.createElement("div")
      trophyIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
      `
      winnerIcon.appendChild(trophyIcon)
    } else if (winner === "ai") {
      winnerIcon.classList.add("ai-win")
      winnerIcon.classList.remove("draw")
      winnerTitle.textContent = "AI Wins!"
      winnerMessage.textContent = "Better luck next time!"
  
      // Add the AI symbol
      const symbolElement = createSymbolElement(gameState.aiSymbol)
      winnerIcon.appendChild(symbolElement)
    } else {
      winnerIcon.classList.add("draw")
      winnerIcon.classList.remove("ai-win")
      winnerTitle.textContent = "It's a Draw!"
      winnerMessage.textContent = "No one was able to get three in a row."
  
      const drawIcon = document.createElement("div")
      drawIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      `
      winnerIcon.appendChild(drawIcon)
    }
  
    // Show modal
    winnerModal.classList.remove("hidden")
  }
  
  // Create confetti effect
  function createConfetti() {
    const colors = ["#FF5252", "#FFD740", "#64FFDA", "#448AFF", "#E040FB", "#69F0AE"]
  
    // Clear any existing confetti
    confettiContainer.innerHTML = ""
  
    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div")
      confetti.className = "confetti"
      confetti.style.left = `${Math.random() * 100}%`
      confetti.style.top = `${-20 - Math.random() * 100}%`
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`
      confetti.style.animationDuration = `${2.5 + Math.random() * 2.5}s`
  
      confettiContainer.appendChild(confetti)
    }
  
    // Remove confetti after animation
    setTimeout(() => {
      confettiContainer.innerHTML = ""
    }, 5000)
  }
  
  // Check for winner
  function checkWinner() {
    // Winning combinations
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]
  
    // Check for winner
    for (const line of lines) {
      const [a, b, c] = line
      if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
        return { winner: gameState.board[a], line }
      }
    }
  
    // Check for draw
    const isDraw = gameState.board.every((cell) => cell !== null)
    if (isDraw) {
      return { winner: null, isDraw: true, line: null }
    }
  
    // No winner yet
    return { winner: null, isDraw: false, line: null }
  }
  
  // Get AI move based on difficulty
  function getAIMove() {
    // Find empty cells
    const emptyCells = gameState.board
      .map((cell, index) => (cell === null ? index : null))
      .filter((index) => index !== null)
  
    if (emptyCells.length === 0) return null
  
    // Easy: Random move
    if (gameState.difficulty === "easy") {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)]
    }
  
    // Medium and Hard: Try to win, block player, or make strategic move
  
    // Check if AI can win in the next move
    for (const cell of emptyCells) {
      const boardCopy = [...gameState.board]
      boardCopy[cell] = gameState.aiSymbol
  
      // Check if this move would win
      for (const line of [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ]) {
        const [a, b, c] = line
        if (boardCopy[a] && boardCopy[a] === boardCopy[b] && boardCopy[a] === boardCopy[c]) {
          return cell
        }
      }
    }
  
    // Check if player can win in the next move and block
    for (const cell of emptyCells) {
      const boardCopy = [...gameState.board]
      boardCopy[cell] = gameState.playerSymbol
  
      // Check if this move would block player's win
      for (const line of [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ]) {
        const [a, b, c] = line
        if (boardCopy[a] && boardCopy[a] === boardCopy[b] && boardCopy[a] === boardCopy[c]) {
          return cell
        }
      }
    }
  
    // Hard: Additional strategy
    if (gameState.difficulty === "hard") {
      // Take center if available
      if (gameState.board[4] === null) {
        return 4
      }
  
      // Take corners if available
      const corners = [0, 2, 6, 8].filter((corner) => gameState.board[corner] === null)
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)]
      }
    }
  
    // Take any available edge
    const edges = [1, 3, 5, 7].filter((edge) => gameState.board[edge] === null)
    if (edges.length > 0) {
      return edges[Math.floor(Math.random() * edges.length)]
    }
  
    // Fallback to random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }
  
  // Play sound effect
  function playSound(type) {
    if (!audioContext) return
  
    // Create a new oscillator for each sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
  
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
  
    // Configure sound based on type
    switch (type) {
      case "click":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        break
  
      case "win":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
  
        // Add a second tone for a chord effect
        setTimeout(() => {
          if (!audioContext) return
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          osc2.connect(gain2)
          gain2.connect(audioContext.destination)
          osc2.type = "sine"
          osc2.frequency.setValueAtTime(700, audioContext.currentTime)
          osc2.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.2)
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          osc2.start()
          osc2.stop(audioContext.currentTime + 0.4)
        }, 100)
        break
  
      case "lose":
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
        break
  
      case "draw":
        oscillator.type = "triangle"
        oscillator.frequency.setValueAtTime(350, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.3)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
        break
  
      case "error":
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        break
  
      case "aiMove":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        break
  
      case "start":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
  
        // Add a second tone for a chord effect
        setTimeout(() => {
          if (!audioContext) return
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          osc2.connect(gain2)
          gain2.connect(audioContext.destination)
          osc2.type = "sine"
          osc2.frequency.setValueAtTime(600, audioContext.currentTime)
          osc2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2)
          gain2.gain.setValueAtTime(0.2, audioContext.currentTime)
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          osc2.start()
          osc2.stop(audioContext.currentTime + 0.3)
        }, 100)
        break
    }
  }
  
  // Initialize particles background
  function initParticles() {
    const canvas = document.getElementById("particles-canvas")
    const ctx = canvas.getContext("2d")
  
    // Set canvas dimensions
    function setCanvasDimensions() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
  
    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)
  
    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
        this.color = `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(
          Math.random() * 100 + 155,
        )}, ${Math.floor(Math.random() * 255)}, ${Math.random() * 0.5 + 0.2})`
      }
  
      update() {
        this.x += this.speedX
        this.y += this.speedY
  
        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
  
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height
      }
  
      draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  
    // Create particles
    const particles = []
    const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000))
  
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
  
    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
  
      for (const particle of particles) {
        particle.update()
        particle.draw()
      }
  
      requestAnimationFrame(animate)
    }
  
    animate()
  }
  
  // Initialize the game when the DOM is loaded
  document.addEventListener("DOMContentLoaded", initGame)
  
  