import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else onLogin(data.user)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button type="submit">{isSignUp ? 'Sign Up' : 'Login'}</button>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{cursor: 'pointer', color: 'blue'}}>
        {isSignUp ? 'Already have an account? Login' : "New here? Sign up"}
      </p>
    </form>
  )
}

