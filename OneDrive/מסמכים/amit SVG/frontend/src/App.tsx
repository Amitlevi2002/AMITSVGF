import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DesignDetails from './pages/DesignDetails';
import './App.css';

function App() {
  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/design/:id" element={<DesignDetails />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

