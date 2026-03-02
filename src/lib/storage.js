import { supabase } from './supabase'

export const getTodayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`
}

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return data
}

export const getMealsForDay = async (userId, date) => {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true })
  if (error) return []
  return data
}

export const addMeal = async (userId, date, name, calories) => {
  const { data, error } = await supabase
    .from('meals')
    .insert({ user_id: userId, date, name, calories })
  return data
}

export const deleteMeal = async (mealId) => {
  await supabase.from('meals').delete().eq('id', mealId)
}

export const getWorkoutForDay = async (userId, date) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) return null
  return data
}

export const saveWorkout = async (userId, date, name, exercises, isRestDay) => {
  const { data, error } = await supabase
    .from('workouts')
    .upsert({ user_id: userId, date, name, exercises, is_rest_day: isRestDay }, { onConflict: 'user_id,date' })
  return data
}

export const getVeloxScore = async (userId) => {
  const { data, error } = await supabase
    .from('velox_scores')
    .select('score')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return 0
  return data?.score || 0
}

export const updateVeloxScore = async (userId, score) => {
  await supabase
    .from('velox_scores')
    .upsert({ user_id: userId, score, updated_at: new Date() }, { onConflict: 'user_id' })
}

export const getAllProfiles = async () => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
  if (error) return []

  const { data: scores } = await supabase
    .from('velox_scores')
    .select('user_id, score')

  return profiles.map(p => {
    const scoreRow = scores?.find(s => s.user_id === p.id)
    return { ...p, score: scoreRow?.score || 0 }
  })
}