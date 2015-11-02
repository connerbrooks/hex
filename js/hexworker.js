// Hex board game web worker
var gameBoard;
var boardSize;
var isAI;

/*
create board of given size
*/
function createBoardRep(size) {
    var x = new Array(size);
    for (var i = 0; i < size; i++) {
      x[i] = new Array(size);
    }
    for (var i = 0; i < size; i++)
      for (var j = 0; j < size; j++)
        x[i][j] = 0;
    return x;
}

/*
log game board
*/
function logBoard()
{
  for (var i = 0; i < boardSize; i++) {
    var row = '';
    for (var j = 0; j < boardSize; j++) {
      row += gameBoard[i][j] + ' ';
    }
    console.log(row);
  }
}


function AIPlay()
{
    // horrible ai
    var row = Math.floor((Math.random() * (boardSize - 1)));
    var col = Math.floor((Math.random() * (boardSize - 1)));

    // send AI move
    postMessage({cmd: 'aiplay', x: row, y: col});
}


/*
get messages from game
*/
onmessage = function (e) {
    var data = e.data;

    switch (data.cmd) {
    case 'start':
      isAI = data.isAI;
      boardSize = data.boardSize;
      gameBoard = createBoardRep(boardSize);
      console.log('created board of size ' + boardSize);
      break;
    case 'play':
      gameBoard[data.y][data.x] = {player: (data.player ? 2 : 1) };
      console.log('player: ' + (data.player ? 2 : 1) + ' x: ' + data.x + ' y: ' + data.y);
      logBoard();
      if (isAI)
        AIPlay();
      break;
    case 'aiplay':
      AIPlay();
      break;
    case 'ai_toggle':
      isAI = data.isAI;
      break;
    case 'restart':
      gameBoard = createBoardRep(boardSize);
      console.log('game restarted, board cleared');
      break;
    case 'stop':
      break;
    }

}
