import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [chapters, setChapters] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(16);

  const handleFetchMultipleChapters = async (fetchUrl) => {
    // Defensive: don't attempt to fetch when URL is falsy
    if (!fetchUrl) {
      console.warn('handleFetchMultipleChapters called without a fetchUrl');
      return;
    }

    setIsFetching(true);
    setCurrentChapterIndex(0);
    setNextPageUrl(null);

    try {
      const response = await fetch(`http://localhost:3001/scrape-multiple?url=${encodeURIComponent(fetchUrl)}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Received data:', data);

      // Validate chapters before spreading to avoid "not iterable" errors
      const newChapters = Array.isArray(data.chapters) ? data.chapters : [];

      if (newChapters.length > 0) {
        // Replace previous chapters with the newly fetched batch so old 10 disappear
        setChapters(newChapters);
      } else {
        // If no chapters returned, show a helpful message
        setChapters([{ title: 'No chapters found', content: 'The server returned no chapters.' }]);
      }

      setNextPageUrl(data && data.nextPageUrl ? data.nextPageUrl : null);
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      setChapters([{ title: 'Error', content: 'Failed to fetch chapters. Please check the console.' }]);
      setNextPageUrl(null);
    } finally {
      setIsFetching(false);
    }
  };

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'sepia' : 'light'));
  };

  const increaseFontSize = () => setFontSize(size => size + 1);
  const decreaseFontSize = () => setFontSize(size => size - 1);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div className="container-fluid App">
      <header className="my-3">
        <h1 className="text-center">The Auto-Reader</h1>
        <div className="input-group mt-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter web novel chapter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="input-group-append">
            <button className="btn btn-primary" onClick={() => handleFetchMultipleChapters(url)} disabled={isFetching}>
              {isFetching ? 'Fetching...' : 'Fetch 10 Chapters'}
            </button>
          </div>
        </div>
      </header>

      <main className="reader-main" style={{ fontSize: `${fontSize}px` }}>
        {chapters && chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div key={index} className="chapter">
              <h2>{chapter.title}</h2>
              <p className="reader-content">{chapter.content}</p>
            </div>
          ))
        ) : (
          <p>Enter a URL above and click "Fetch 10 Chapters" to begin.</p>
        )}
      </main>

      <footer className="fixed-bottom bg-light p-3">
        <div className="d-flex justify-content-center align-items-center flex-wrap">
          <button className="btn btn-secondary mx-1 mb-2" onClick={decreaseFontSize}>A-</button>
          <button className="btn btn-secondary mx-1 mb-2" onClick={increaseFontSize}>A+</button>
          <button className="btn btn-info mx-1 mb-2" onClick={toggleTheme}>
            Theme: {theme}
          </button>
          <button className="btn btn-primary mx-1 mb-2" onClick={() => handleFetchMultipleChapters(nextPageUrl)} disabled={!nextPageUrl || isFetching}>
            {isFetching ? 'Fetching...' : 'Fetch Next 10 Chapters'}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;