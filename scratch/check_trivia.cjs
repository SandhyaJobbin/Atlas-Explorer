
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/anoop/OneDrive/Desktop/AMZ/app/public/data/states.json', 'utf8'));

data.forEach(s => {
  if (!s.trivia || s.trivia.length < 2) {
    console.log(`${s.code}: ${s.trivia ? s.trivia.length : 0} trivia`);
  }
});
