import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { Layout } from './components/shared/Layout'
import { Lobby } from './components/Lobby/Lobby'
import { GameRoom } from './components/Game/GameRoom'
import { Auth } from './components/Auth/Auth'
import { Profile } from './components/Profile/Profile'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
              <Layout>
                <Routes>
                  <Route path="/" element={<Lobby />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/game/:gameId" element={<GameRoom />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Layout>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                    border: '1px solid var(--toast-border)',
                  },
                }}
              />
            </div>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App