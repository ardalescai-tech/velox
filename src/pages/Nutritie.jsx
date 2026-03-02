import { useState, useEffect, useRef } from 'react'
import { getMealsForDay, addMeal, deleteMeal, getTodayKey, getProfile } from '../lib/storage'
import './Nutritie.css'

function Nutritie({ user }) {
  const [meals, setMeals] = useState([])
  const [profile, setProfile] = useState(null)
  const [newMealName, setNewMealName] = useState('')
  const [newMealCalories, setNewMealCalories] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    const today = getTodayKey()
    const [mealsData, profileData] = await Promise.all([
      getMealsForDay(user.id, today),
      getProfile(user.id)
    ])
    setMeals(mealsData)
    setProfile(profileData)
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

  const handleAddMeal = async () => {
    if (!newMealName.trim() || !newMealCalories) return
    await addMeal(user.id, getTodayKey(), newMealName.trim(), parseInt(newMealCalories))
    setNewMealName('')
    setNewMealCalories('')
    loadData()
  }

  const handleDeleteMeal = async (id) => {
    await deleteMeal(id)
    loadData()
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const analyzeImage = async () => {
    if (!image) return
    setAiLoading(true)
    setAiResponse('')

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      const mediaType = image.type

      const caloriiNecesare = calculateTDEE(profile)
      const caloriiConsumante = meals.reduce((sum, m) => sum + m.calories, 0)

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 }
                },
                {
                  type: 'text',
                  text: `Ești un nutriționist AI. Analizează această masă și estimează caloriile.
                  
Contextul utilizatorului:
- Calorii necesare azi: ${caloriiNecesare} kcal
- Calorii consumate până acum: ${caloriiConsumante} kcal
- Calorii rămase: ${caloriiNecesare - caloriiConsumante} kcal
- Obiectiv: ${profile?.objective === 'slabit' ? 'slăbire' : profile?.objective === 'masa' ? 'masă musculară' : 'menținere'}

Răspunde în română în maximum 4 rânduri:
1. Ce mâncare identifici și câte calorii estimezi
2. Dacă se potrivește cu obiectivul lui
3. O recomandare scurtă`
                }
              ]
            }]
          })
        })

        const data = await response.json()
        const text = data.content?.[0]?.text || 'Nu am putut analiza imaginea.'
        setAiResponse(text)
      } catch (err) {
        setAiResponse('Eroare la analiză. Încearcă din nou.')
      }
      setAiLoading(false)
    }
    reader.readAsDataURL(image)
  }

  const askAI = async (question) => {
    setAiLoading(true)
    setAiResponse('')

    const caloriiNecesare = calculateTDEE(profile)
    const caloriiConsumante = meals.reduce((sum, m) => sum + m.calories, 0)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Ești un nutriționist AI personal. 
            
Contextul utilizatorului:
- Înălțime: ${profile?.height} cm
- Greutate actuală: ${profile?.weight_current} kg
- Greutate țintă: ${profile?.weight_goal} kg
- Obiectiv: ${profile?.objective === 'slabit' ? 'slăbire' : profile?.objective === 'masa' ? 'masă musculară' : 'menținere'}
- Calorii necesare azi: ${caloriiNecesare} kcal
- Calorii consumate: ${caloriiConsumante} kcal
- Mese de azi: ${meals.map(m => `${m.name} (${m.calories} kcal)`).join(', ') || 'niciuna'}

Întrebarea: ${question}

Răspunde în română, concis și direct, maximum 5 rânduri.`
          }]
        })
      })

      const data = await response.json()
      setAiResponse(data.content?.[0]?.text || 'Nu am putut răspunde.')
    } catch (err) {
      setAiResponse('Eroare. Încearcă din nou.')
    }
    setAiLoading(false)
  }

  const caloriiNecesare = calculateTDEE(profile)
  const caloriiConsumante = meals.reduce((sum, m) => sum + m.calories, 0)

  if (loading) return <div className="page nutritie"><p className="loading">Se încarcă...</p></div>

  return (
    <div className="page nutritie">
      <h2>Nutriție 🍎</h2>

      <div className="calories-summary">
        <div className="calories-numbers">
          <span className="calories-consumed">{caloriiConsumante}</span>
          <span className="calories-separator">/</span>
          <span className="calories-needed">{caloriiNecesare} kcal</span>
        </div>
        <div className="calories-track">
          <div className="calories-fill" style={{
            width: `${Math.min((caloriiConsumante / caloriiNecesare) * 100, 100)}%`,
            background: caloriiConsumante > caloriiNecesare ? '#e53e3e' : '#4caf50'
          }} />
        </div>
        <span className="calories-remaining">
          {caloriiNecesare - caloriiConsumante > 0
            ? `${caloriiNecesare - caloriiConsumante} kcal rămase`
            : `${Math.abs(caloriiNecesare - caloriiConsumante)} kcal depășite`}
        </span>
      </div>

      <div className="meals-section">
        <h3>Mesele de azi</h3>
        <div className="meals-list">
          {meals.length === 0 && <p className="empty">Nu ai adăugat nicio masă azi.</p>}
          {meals.map(meal => (
            <div key={meal.id} className="meal-card">
              <div className="meal-info">
                <span className="meal-name">{meal.name}</span>
                <span className="meal-calories">{meal.calories} kcal</span>
              </div>
              <button className="meal-delete" onClick={() => handleDeleteMeal(meal.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="add-meal-row">
          <input
            className="meal-input"
            placeholder="Nume masă..."
            value={newMealName}
            onChange={e => setNewMealName(e.target.value)}
          />
          <input
            className="meal-input calories-input"
            placeholder="kcal"
            type="number"
            value={newMealCalories}
            onChange={e => setNewMealCalories(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMeal()}
          />
          <button className="add-meal-btn" onClick={handleAddMeal}>+</button>
        </div>
      </div>

      <div className="ai-section">
        <h3>AI Nutriționist 🤖</h3>

        <div className="ai-image-section">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <button className="ai-upload-btn" onClick={() => fileInputRef.current.click()}>
            📸 Fotografiază masa
          </button>
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="masa" className="image-preview" />
              <button className="ai-analyze-btn" onClick={analyzeImage} disabled={aiLoading}>
                {aiLoading ? 'Analizez...' : '🔍 Analizează caloriile'}
              </button>
            </div>
          )}
        </div>

        <div className="ai-quick-questions">
          <p className="ai-questions-label">Întrebări rapide:</p>
          <div className="ai-questions-grid">
            <button className="ai-question-btn" onClick={() => askAI('Ce ar trebui să mănânc la următoarea masă?')}>
              Ce să mănânc acum?
            </button>
            <button className="ai-question-btn" onClick={() => askAI('Cum mă descurc cu caloriile azi? Sunt pe drumul cel bun?')}>
              Sunt pe drumul bun?
            </button>
            <button className="ai-question-btn" onClick={() => askAI('Dă-mi un sfat pentru obiectivul meu de azi.')}>
              Sfat pentru azi
            </button>
          </div>
        </div>

        {aiLoading && <div className="ai-loading">⏳ AI-ul analizează...</div>}
        {aiResponse && (
          <div className="ai-response">
            <p>{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Nutritie