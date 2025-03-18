const startBtn = document.getElementById('start-btn');
const checkBtn = document.getElementById('check-btn');
const difficultyInput = document.getElementById('difficulty');
const gameContainer = document.getElementById('game-container');

let draggedPiece = null; // Pieza que se está arrastrando
let offsetX = 0, offsetY = 0; // Diferencia entre la posición del mouse y la esquina superior de la pieza

startBtn.addEventListener('click', startGame);
checkBtn.addEventListener('click', checkPuzzle);

function startGame() {
  // Remover cualquier listener anterior de arrastre (si existiera)
  gameContainer.innerHTML = '';
  
  // Obtener la dificultad ingresada y limitarla entre 3 y 10
  let gridSize = parseInt(difficultyInput.value);
  gridSize = Math.min(Math.max(gridSize, 3), 10);
  
  // Definir la variable CSS --grid-size para el cálculo responsivo
  gameContainer.style.setProperty('--grid-size', gridSize);
  
  // Calcular el tamaño de cada pieza basado en el contenedor
  const containerSize = gameContainer.offsetWidth;
  const pieceSize = containerSize / gridSize;
  gameContainer.style.setProperty('--piece-size', pieceSize + 'px');

  // Seleccionar aleatoriamente una de las 10 imágenes disponibles en la carpeta "ilus"
  const imageNumber = Math.floor(Math.random() * 10) + 1;
  const imagePath = `ilus/rompecabezas${imageNumber}.jpg`;

  // Crear un array con el orden correcto de los índices
  const totalPieces = gridSize * gridSize;
  const correctOrder = Array.from({ length: totalPieces }, (_, i) => i);
  // Obtener un orden aleatorio
  const shuffledOrder = shuffleArray([...correctOrder]);

  // Generar las piezas del rompecabezas
  for (let i = 0; i < totalPieces; i++) {
    const piece = document.createElement('div');
    piece.classList.add('piece');
    // Guardamos el índice correcto y el índice actual en atributos de datos
    piece.dataset.correct = i; // índice que le corresponde para el armado correcto
    piece.dataset.current = shuffledOrder[i]; // posición actual en la grilla
    
    // Posición visual inicial de la pieza según data-current (orden aleatorio)
    const currentIndex = parseInt(piece.dataset.current);
    const currentRow = Math.floor(currentIndex / gridSize);
    const currentCol = currentIndex % gridSize;
    piece.style.left = currentCol * pieceSize + 'px';
    piece.style.top = currentRow * pieceSize + 'px';
    
    // La porción de la imagen que le corresponde se define según el índice correcto
    const correctRow = Math.floor(i / gridSize);
    const correctCol = i % gridSize;
    piece.style.backgroundImage = `url('${imagePath}')`;
    piece.style.backgroundSize = `${containerSize}px ${containerSize}px`;
    piece.style.backgroundPosition = `-${correctCol * pieceSize}px -${correctRow * pieceSize}px`;
    
    // Agregar eventos para arrastrar la pieza
    piece.addEventListener('mousedown', dragStart);
    
    gameContainer.appendChild(piece);
  }
}

function dragStart(e) {
  e.preventDefault();
  // Guardar la pieza que se va a mover y calcular el offset inicial
  draggedPiece = e.currentTarget;
  const rect = draggedPiece.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  // Llevar la pieza al frente
  draggedPiece.style.zIndex = 1000;
  
  document.addEventListener('mousemove', dragging);
  document.addEventListener('mouseup', dragEnd);
}

function dragging(e) {
  if (!draggedPiece) return;
  // Calcular la nueva posición relativa al contenedor
  const containerRect = gameContainer.getBoundingClientRect();
  let newX = e.clientX - containerRect.left - offsetX;
  let newY = e.clientY - containerRect.top - offsetY;
  draggedPiece.style.left = newX + 'px';
  draggedPiece.style.top = newY + 'px';
}

function dragEnd(e) {
  if (!draggedPiece) return;
  document.removeEventListener('mousemove', dragging);
  document.removeEventListener('mouseup', dragEnd);
  
  const containerRect = gameContainer.getBoundingClientRect();
  const pieceRect = draggedPiece.getBoundingClientRect();
  // Calcular el centro de la pieza relativo al contenedor
  const centerX = (pieceRect.left + pieceRect.right) / 2 - containerRect.left;
  const centerY = (pieceRect.top + pieceRect.bottom) / 2 - containerRect.top;
  
  // Recuperar gridSize y pieceSize
  const gridSize = parseInt(getComputedStyle(gameContainer).getPropertyValue('--grid-size'));
  const containerSize = gameContainer.offsetWidth;
  const pieceSize = containerSize / gridSize;
  
  // Calcular la columna y fila destino
  let col = Math.floor(centerX / pieceSize);
  let row = Math.floor(centerY / pieceSize);
  // Asegurarse de que estén en rango
  col = Math.min(Math.max(col, 0), gridSize - 1);
  row = Math.min(Math.max(row, 0), gridSize - 1);
  const targetIndex = row * gridSize + col;
  
  // Buscar la pieza que actualmente está en la celda destino
  let targetPiece = null;
  document.querySelectorAll('.piece').forEach(piece => {
    if (parseInt(piece.dataset.current) === targetIndex) {
      targetPiece = piece;
    }
  });
  
  // Si se encontró una pieza distinta en la celda destino, se intercambian sus posiciones (data-current)
  if (targetPiece && targetPiece !== draggedPiece) {
    swapPieces(draggedPiece, targetPiece, pieceSize, gridSize);
  } else {
    // Si se soltó en su celda, se vuelve a la posición asignada
    updatePiecePosition(draggedPiece, pieceSize, gridSize);
  }
  
  // Restaurar z-index
  draggedPiece.style.zIndex = '';
  draggedPiece = null;
}

function swapPieces(pieceA, pieceB, pieceSize, gridSize) {
  // Intercambiar data-current entre las dos piezas
  const temp = pieceA.dataset.current;
  pieceA.dataset.current = pieceB.dataset.current;
  pieceB.dataset.current = temp;
  
  // Actualizar posiciones visuales según el nuevo data-current
  updatePiecePosition(pieceA, pieceSize, gridSize);
  updatePiecePosition(pieceB, pieceSize, gridSize);
}

function updatePiecePosition(piece, pieceSize, gridSize) {
  const currentIndex = parseInt(piece.dataset.current);
  const currentRow = Math.floor(currentIndex / gridSize);
  const currentCol = currentIndex % gridSize;
  piece.style.left = currentCol * pieceSize + 'px';
  piece.style.top = currentRow * pieceSize + 'px';
}

function checkPuzzle() {
  const pieces = document.querySelectorAll('.piece');
  let solved = true;
  pieces.forEach(piece => {
    if (piece.dataset.current !== piece.dataset.correct) {
      solved = false;
    }
  });
  
  if (solved) {
    alert("¡Felicidades! El rompecabezas está resuelto.");
  } else {
    alert("El rompecabezas no está en el orden correcto. ¡Sigue intentando!");
  }
}

// Función para mezclar un array (algoritmo de Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
