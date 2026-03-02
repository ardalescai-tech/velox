import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Nutritie from './pages/Nutritie'
import Sala from './pages/Sala'
import Leaderboard from './pages/Leaderboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigateTo = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  if (loading) return <div className="loading-screen">Se încarcă...</div>
  if (!user) return <Auth />

  return (
    <div className="app">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-logo">
          <span>⚡</span>
          <span className="sidebar-logo-text">Velox</span>
        </div>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>⚡</span>
          <span className="sidebar-logo-text">Velox</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
            <span>📊</span> Dashboard
          </button>
          <button className={`nav-item ${activePage === 'nutritie' ? 'active' : ''}`} onClick={() => navigateTo('nutritie')}>
            <span>🍎</span> Nutriție
          </button>
          <button className={`nav-item ${activePage === 'sala' ? 'active' : ''}`} onClick={() => navigateTo('sala')}>
            <span>🏋️</span> Sală
          </button>
          <button className={`nav-item ${activePage === 'leaderboard' ? 'active' : ''}`} onClick={() => navigateTo('leaderboard')}>
            <span>🏆</span> Leaderboard
          </button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Deconectare
        </button>
      </aside>

      <main className="main-content">
        {activePage === 'dashboard' && <Dashboard user={user} />}
        {activePage === 'nutritie' && <Nutritie user={user} />}
        {activePage === 'sala' && <Sala user={user} />}
        {activePage === 'leaderboard' && <Leaderboard user={user} />}
      </main>
    </div>
  )
}

export default App