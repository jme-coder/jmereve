import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GameList } from './components/GameList';
import { GameEditor } from './components/GameEditor';
import { CardEditor } from './components/CardEditor';
import { CardPlayer } from './components/CardPlayer';
import { PdfExport } from './components/PdfExport';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/game/:gameId" element={<GameEditor />} />
          <Route path="/game/:gameId/card/new" element={<CardEditor />} />
          <Route path="/game/:gameId/card/:cardId" element={<CardEditor />} />
          <Route path="/game/:gameId/play" element={<CardPlayer />} />
          <Route path="/game/:gameId/export" element={<PdfExport />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
