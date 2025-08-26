const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3001;

app.use(cors());

async function scrapeChapter(url) {
  console.log('Scraping URL:', url);
  if (!url) {
    throw new Error('URL is required for scraping.');
  }

  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);

    const chapterTitle = $('h2').first().text();
    let chapterContent = '';
    $('#chapter-content p').each((i, elem) => {
      chapterContent += $(elem).text() + '\n\n';
    });

    if (!chapterContent) {
        $('body p').each((i, elem) => {
            chapterContent += $(elem).text() + '\n\n';
        });
    }

    let nextChapterUrl = $('#next_chap').attr('href');
    if (nextChapterUrl && !nextChapterUrl.startsWith('http')) {
      const urlObject = new URL(url);
      nextChapterUrl = `${urlObject.protocol}//${urlObject.hostname}${nextChapterUrl}`;
    }

    return {
      title: chapterTitle,
      content: chapterContent,
      nextUrl: nextChapterUrl,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    throw new Error(`Failed to scrape ${url}.`);
  }
}

app.get('/scrape', async (req, res) => {
  try {
    const result = await scrapeChapter(req.query.url);
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/scrape-multiple', async (req, res) => {
  let { url } = req.query;
  const chapters = [];
  try {
    for (let i = 0; i < 10; i++) {
      if (!url) {
        console.log('No more chapters to fetch.');
        break;
      }
      console.log(`Fetching chapter ${i + 1}...`);
      const chapterData = await scrapeChapter(url);
      chapters.push({
        title: chapterData.title,
        content: chapterData.content,
      });
      url = chapterData.nextUrl;
    }
    res.json(chapters);
  } catch (error) {
    console.error('Error during multiple chapter scrape:', error.message);
    res.status(500).send('An error occurred while fetching multiple chapters.');
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});