import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MapView from './pages/MapView'
import './App.css'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
