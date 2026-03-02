import { useState, useEffect } from 'react'
import { getAllProfiles } from '../lib/storage'
import './Leaderboard.css'

function Leaderboard({ user }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    const profiles = await getAllProfiles()
    const sorted = profiles.sort((a, b) => b.score - a.score)
    setPlayers(sorted)
    setLoading(false)
  }

  if (loading) return <div className="page leaderboard"><p className="loading">Se încarcă...</p></div>

  return (
    <div className="page leaderboard">
      <h2>Leaderboard 🏆</h2>
      <p className="leaderboard-subtitle">Cine progresează mai mult?</p>

      <div className="leaderboard-list">
        {players.length === 0 && <p className="empty">Nu există jucători încă.</p>}
        {players.map((player, index) => {
          const isMe = player.id === user.id
          return (
            <div key={player.id} className={`leaderboard-card ${isMe ? 'me' : ''}`}>
              <span className="leaderboard-position">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </span>
              <div className="leaderboard-info">
                <span className="leaderboard-username">
                  {player.username} {isMe ? '(tu)' : ''}
                </span>
                <span className="leaderboard-label">Velox Score</span>
              </div>
              <div className="leaderboard-score">
                <span className="leaderboard-score-count">{player.score}</span>
                <span className="leaderboard-score-label">pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Leaderboard