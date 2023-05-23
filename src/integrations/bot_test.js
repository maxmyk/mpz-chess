const axios = require('axios');

const lichessApi = '';

async function getBestMove(position) {
  return axios.get('https://lichess.org/api/cloud-eval', {
    params: {
      fen: position,
      multiPv: 1,
    },
    headers: {
      'Authorization': 'Bearer ' + lichessApi,
    },
  })
  .then((response) => {
    const bestMove = response.data.pvs[0].moves.slice(0, 4);
    return bestMove;
  })
  .catch((error) => {
    console.error('An error occurred:', error);
    throw error;
  });
}

const position = 'r1bq1b1r/ppp2kpp/2n5/3np3/2B5/5Q2/PPPP1PPP/RNB1K2R b KQ - 1 7';

getBestMove(position)
  .then((bestMove) => {
    console.log('Best move:', bestMove);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
