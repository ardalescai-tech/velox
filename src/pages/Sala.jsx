import { useState, useEffect } from 'react'
import { getWorkoutForDay, saveWorkout, getTodayKey } from '../lib/storage'
import './Sala.css'

function Sala({ user }) {
  const [workout, setWorkout] = useState(null)
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState([])
  const [isRestDay, setIsRestDay] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    const workoutData = await getWorkoutForDay(user.id, getTodayKey())
    if (workoutData) {
      setWorkout(workoutData)
      setWorkoutName(workoutData.name || '')
      setExercises(workoutData.exercises || [])
      setIsRestDay(workoutData.is_rest_day || false)
    }
    setLoading(false)
  }

  const handleSave = async (updatedExercises, updatedRestDay) => {
    await saveWorkout(user.id, getTodayKey(), workoutName, updatedExercises, updatedRestDay)
  }

  const addExercise = async () => {
    if (!newExercise.name.trim()) return
    const exercise = {
      id: Date.now(),
      name: newExercise.name.trim(),
      sets: parseInt(newExercise.sets) || 3,
      reps: parseInt(newExercise.reps) || 10,
      weight: parseFloat(newExercise.weight) || 0
    }
    const updated = [...exercises, exercise]
    setExercises(updated)
    setNewExercise({ name: '', sets: '', reps: '', weight: '' })
    await handleSave(updated, isRestDay)
  }

  const deleteExercise = async (id) => {
    const updated = exercises.filter(e => e.id !== id)
    setExercises(updated)
    await handleSave(updated, isRestDay)
  }

  const toggleRestDay = async () => {
    const newVal = !isRestDay
    setIsRestDay(newVal)
    await handleSave(exercises, newVal)
  }

  const saveWorkoutName = async () => {
    await handleSave(exercises, isRestDay)
  }

  const askAI = async (exercise) => {
    setAiLoading(true)
    setAiResponse('')
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Ești un antrenor personal AI.\n\nExercițiul: ${exercise.name}\nSets: ${exercise.sets}\nRepetări: ${exercise.reps}\nGreutate: ${exercise.weight} kg\n\nRăspunde în română în maximum 4 rânduri:\n1. Evaluează dacă greutatea și volumul sunt potrivite pentru progres\n2. Recomandă greutatea optimă și numărul de repetări\n3. Un sfat de tehnică sau siguranță`
          }]
        })
      })
      const data = await response.json()
      setAiResponse(data.content?.[0]?.text || 'Nu am putut analiza.')
    } catch (err) {
      setAiResponse('Eroare. Încearcă din nou.')
    }
    setAiLoading(false)
  }

  if (loading) return <div className="page sala"><p className="loading">Se încarcă...</p></div>

  return (
    <div className="page sala">
      <h2>Sală 🏋️</h2>

      <div className="workout-header-card">
        <input
          className="workout-name-input"
          placeholder="Numele antrenamentului (ex: Push Day)"
          value={workoutName}
          onChange={e => setWorkoutName(e.target.value)}
          onBlur={saveWorkoutName}
        />
        <button className={`rest-day-btn ${isRestDay ? 'active' : ''}`} onClick={toggleRestDay}>
          {isRestDay ? '😴 Rest Day' : 'Set Rest Day'}
        </button>
      </div>

      {!isRestDay && (
        <>
          <div className="exercises-list">
            {exercises.length === 0 && <p className="empty">Nu ai adăugat exerciții azi.</p>}
            {exercises.map(exercise => (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-top">
                  <span className="exercise-name">{exercise.name}</span>
                  <button className="exercise-delete" onClick={() => deleteExercise(exercise.id)}>✕</button>
                </div>
                <div className="exercise-details">
                  <span className="exercise-stat">{exercise.sets} seturi</span>
                  <span className="exercise-dot">·</span>
                  <span className="exercise-stat">{exercise.reps} rep</span>
                  <span className="exercise-dot">·</span>
                  <span className="exercise-stat">{exercise.weight} kg</span>
                </div>
                <button className="ai-exercise-btn" onClick={() => askAI(exercise)} disabled={aiLoading}>
                  🤖 Sfat AI
                </button>
              </div>
            ))}
          </div>

          <div className="add-exercise-card">
            <h3>Adaugă exercițiu</h3>
            <input
              className="exercise-input"
              placeholder="Nume exercițiu (ex: Bench Press)"
              value={newExercise.name}
              onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
            />
            <div className="exercise-inputs-row">
              <input className="exercise-small" placeholder="Seturi" type="number" value={newExercise.sets} onChange={e => setNewExercise({ ...newExercise, sets: e.target.value })} />
              <input className="exercise-small" placeholder="Rep" type="number" value={newExercise.reps} onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })} />
              <input className="exercise-small" placeholder="Kg" type="number" value={newExercise.weight} onChange={e => setNewExercise({ ...newExercise, weight: e.target.value })} />
            </div>
            <button className="add-exercise-btn" onClick={addExercise}>+ Adaugă</button>
          </div>

          {aiLoading && <div className="ai-loading">⏳ AI-ul analizează...</div>}
          {aiResponse && <div className="ai-response"><p>{aiResponse}</p></div>}
        </>
      )}

      {isRestDay && (
        <div className="rest-day-card">
          <span>😴</span>
          <p>Zi de odihnă. Corpul tău se recuperează și crește!</p>
        </div>
      )}
    </div>
  )
}

export default Sala