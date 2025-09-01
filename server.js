require('dotenv').config();
const express = require('express');
const cors = require('cors');
const GitHub = require('github-api');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));


const port = 3001;

const GITHUB_OWNER = 'j3rajerz';
const GITHUB_REPO = 'maghaze-said';
const DB_PATH = 'repair_shop.db';

const gh = new GitHub({
  token: process.env.GITHUB_TOKEN
});

const repo = gh.getRepo(GITHUB_OWNER, GITHUB_REPO);

app.get('/api/db', (req, res) => {
  repo.getContents('main', DB_PATH, true, (err, data) => {
    if (err) {
      if (err.response.status === 404) {
        res.status(404).send('Database file not found.');
      } else {
        res.status(500).send(err);
      }
    } else {
      res.send(data);
    }
  });
});

app.post('/api/db', (req, res) => {
    const content = req.body.content;
    const message = req.body.message;
    const sha = req.body.sha;

    repo.writeFile('main', DB_PATH, content, message, { sha: sha, encode: false }, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(data);
        }
    });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
