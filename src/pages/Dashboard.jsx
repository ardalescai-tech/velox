import { useState, useEffect } from 'react'
import { getProfile, getMealsForDay, getWorkoutForDay, getVeloxScore, getTodayKey } from '../lib/storage'
import './Dashboard.css'

function Dashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [meals, setMeals] = useState([])
  const [workout, setWorkout] = useState(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    const today = getTodayKey()
    const [profileData, mealsData, workoutData, scoreData] = await Promise.all([
      getProfile(user.id),
      getMealsForDay(user.id, today),
      getWorkoutForDay(user.id, today),
      getVeloxScore(user.id)
    ])
    setProfile(profileData)
    setMeals(mealsData)
    setWorkout(workoutData)
    setScore(scoreData)
    setLoading(false)
  }

  const calculateTDEE = (profile) => {
    if (!profile?.height || !profile?.weight_current) return 2000
    const bmr = 10 * profile.weight_current + 6.25 * profile.height - 5 * 20 + 5
    const tdee = Math.round(bmr * 1.55)
    if (profile.objective === 'slabit') return tdee - 500
    if (profile.objective === 'masa') return tdee + 300
    return tdee
  }

  const caloriiNecesare = calculateTDEE(profile)
  const caloriiConsumante = meals.reduce((sum, m) => sum + m.calories, 0)
  const caloriiRamase = caloriiNecesare - caloriiConsumante
  const procentCalorii = Math.min(Math.round((caloriiConsumante / caloriiNecesare) * 100), 100)

  if (loading) return <div className="page dashboard"><p className="loading">Se încarcă...</p></div>

  return (
    <div className="page dashboard">
      <div className="velox-header">
        <div>
          <h2>Bună, {profile?.username}! 💪</h2>
          <p className="velox-date">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="velox-score-badge">
          <span className="velox-score-number">{score}</span>
          <span className="velox-score-label">Velox Score</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card calories">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <span className="stat-value">{caloriiConsumante}</span>
            <span className="stat-label">/ {caloriiNecesare} kcal</span>
          </div>
          <div className="stat-progress-track">
            <div className="stat-progress-fill" style={{
              width: `${procentCalorii}%`,
              background: procentCalorii > 100 ? '#e53e3e' : procentCalorii > 80 ? '#f97316' : '#4caf50'
            }} />
          </div>
          <span className="stat-sublabel">
            {caloriiRamase > 0 ? `${caloriiRamase} kcal rămase` : `${Math.abs(caloriiRamase)} kcal depășite`}
          </span>
        </div>

        <div className="stat-card workout">
          <div className="stat-icon">🏋️</div>
          <div className="stat-info">
            <span className="stat-value">{workout ? (workout.is_rest_day ? 'Rest' : workout.name || 'Antrenament') : 'Niciun'}</span>
            <span className="stat-label">{workout ? (workout.is_rest_day ? 'Day' : `${workout.exercises?.length || 0} exerciții`) : 'antrenament'}</span>
          </div>
        </div>

        <div className="stat-card meals-count">
          <div className="stat-icon">🍽️</div>
          <div className="stat-info">
            <span className="stat-value">{meals.length}</span>
            <span className="stat-label">mese azi</span>
          </div>
        </div>

        <div className="stat-card weight">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <span className="stat-value">{profile?.weight_current || '-'}</span>
            <span className="stat-label">kg curent</span>
          </div>
          <span className="stat-sublabel">Țintă: {profile?.weight_goal || '-'} kg</span>
        </div>
      </div>

      <div className="objective-card">
        <span className="objective-icon">
          {profile?.objective === 'slabit' ? '📉' : profile?.objective === 'masa' ? '📈' : '⚖️'}
        </span>
        <div>
          <span className="objective-title">Obiectivul tău</span>
          <span className="objective-value">
            {profile?.objective === 'slabit' ? 'Slăbire' : profile?.objective === 'masa' ? 'Masă musculară' : 'Menținere'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard