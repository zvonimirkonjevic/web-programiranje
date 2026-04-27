const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/data', express.static('data'));
app.set('view engine', 'ejs');

app.get('/slike', (_req, res) => {
    const dataPath = __dirname + '/data/images.json';
    const images = JSON.parse(require('fs').readFileSync(dataPath, 'utf8'));
    res.render('slike', { images });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});