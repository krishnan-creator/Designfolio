const fs = require('fs');

const puzzleData = JSON.parse(fs.readFileSync('scratch/puzzle_data.json', 'utf8'));

// Let's check Piece 0 and Piece 1
console.log('Piece 0 path:', puzzleData[0].path);
console.log('Piece 1 path:', puzzleData[1].path);
