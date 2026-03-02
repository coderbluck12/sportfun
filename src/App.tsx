import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import HighlightsPage from './pages/HighlightsPage'
import LivePage from './pages/LivePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'
import StandingsPage from './pages/StandingsPage'
import './App.css'

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/highlights" element={<HighlightsPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/match/:id" element={<MatchPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
