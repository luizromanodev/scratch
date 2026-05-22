/**
 * FinFlow — Data Service Layer
 * 
 * Abstracts data persistence. Uses Supabase when configured,
 * falls back to localStorage for offline/local use.
 * 
 * This hybrid approach lets existing users keep working locally
 * while beta users get cloud sync and multi-device support.
 */
import { supabase, isSupabaseEnabled } from './supabase'

// ── Auth Service ──

/**
 * Sign up a new user with email + password via Supabase Auth.
 * Returns { user, error }
 */
export async function signUp(email, password, displayName) {
  if (!isSupabaseEnabled()) {
    return { user: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })
  if (error) return { user: null, error: error.message }
  
  // Create profile record
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      display_name: displayName,
      email,
      created_at: new Date().toISOString(),
    })
  }
  
  return { user: data.user, error: null }
}

/**
 * Sign in existing user with email + password
 */
export async function signIn(email, password) {
  if (!isSupabaseEnabled()) {
    return { user: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { user: null, error: error.message }
  return { user: data.user, error: null }
}

/**
 * Sign out
 */
export async function signOut() {
  if (!isSupabaseEnabled()) return
  await supabase.auth.signOut()
}

/**
 * Get current Supabase session
 */
export async function getSession() {
  if (!isSupabaseEnabled()) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseEnabled()) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}

// ── Data Service ──

/**
 * Load user financial data from Supabase or localStorage
 */
export async function loadUserData(userId) {
  if (!isSupabaseEnabled() || !userId) return null
  
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // No data yet — will be created on first save
      if (error.code === 'PGRST116') return null
      console.error('Error loading data from Supabase:', error)
      return null
    }
    
    return data?.data || null
  } catch (e) {
    console.error('Supabase loadUserData error:', e)
    return null
  }
}

/**
 * Save user financial data to Supabase
 */
export async function saveUserData(userId, financeData) {
  if (!isSupabaseEnabled() || !userId) return false
  
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        data: financeData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
    
    if (error) {
      console.error('Error saving data to Supabase:', error)
      return false
    }
    
    return true
  } catch (e) {
    console.error('Supabase saveUserData error:', e)
    return false
  }
}

/**
 * Load user profile from Supabase
 */
export async function loadProfile(userId) {
  if (!isSupabaseEnabled() || !userId) return null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) return null
    return data
  } catch {
    return null
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId, updates) {
  if (!isSupabaseEnabled() || !userId) return false
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    
    return !error
  } catch {
    return false
  }
}

/**
 * Delete all user data (danger zone)
 */
export async function deleteUserData(userId) {
  if (!isSupabaseEnabled() || !userId) return false
  
  try {
    await supabase.from('user_data').delete().eq('user_id', userId)
    return true
  } catch {
    return false
  }
}
