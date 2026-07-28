import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskClientId, setTaskClientId] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchClients()
      fetchTasks()
    }
  }, [user])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setClients(data)
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, clients(name)')
      .order('due_date', { ascending: true })
    if (!error) setTasks(data)
  }

  const addClient = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('clients').insert({
      ca_id: user.id,
      name,
      business_name: businessName,
      phone,
    })
    if (!error) {
      setName(''); setBusinessName(''); setPhone('')
      fetchClients()
    } else {
      alert(error.message)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!taskClientId) { alert('Pick a client'); return }
    const { error } = await supabase.from('tasks').insert({
      ca_id: user.id,
      client_id: taskClientId,
      title: taskTitle,
      due_date: taskDue,
      status: 'pending',
    })
    if (!error) {
      setTaskTitle(''); setTaskDue(''); setTaskClientId('')
      fetchTasks()
    } else {
      alert(error.message)
    }
  }

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)
    if (!error) fetchTasks()
  }

  const isDueThisWeek = (dueDate) => {
    const today = new Date()
    const weekLater = new Date()
    weekLater.setDate(today.getDate() + 7)
    const due = new Date(dueDate)
    return due >= today && due <= weekLater
  }

  if (loading) return <p>Loading...</p>
  if (!user) return <Auth onLogin={setUser} />

  const dueThisWeek = tasks.filter(t => t.status === 'pending' && isDueThisWeek(t.due_date))

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Ferno</h1>
      <p>Logged in as {user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>

      <h2>⚠️ Due This Week</h2>
      <ul>
        {dueThisWeek.length === 0 && <li>Nothing due this week</li>}
        {dueThisWeek.map((t) => (
          <li key={t.id}>
            {t.title} — {t.clients?.name} — {t.due_date}
          </li>
        ))}
      </ul>

      <h2>Add Client</h2>
      <form onSubmit={addClient}>
        <input placeholder="Client Name" value={name}
          onChange={(e) => setName(e.target.value)} required /><br/>
        <input placeholder="Business Name" value={businessName}
          onChange={(e) => setBusinessName(e.target.value)} /><br/>
        <input placeholder="Phone" value={phone}
          onChange={(e) => setPhone(e.target.value)} /><br/>
        <button type="submit">Add Client</button>
      </form>

      <h2>Clients</h2>
      <ul>
        {clients.map((c) => (
          <li key={c.id}>{c.name} — {c.business_name} ({c.phone})</li>
        ))}
      </ul>

      <h2>Add Task</h2>
      <form onSubmit={addTask}>
        <select value={taskClientId} onChange={(e) => setTaskClientId(e.target.value)} required>
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select><br/>
        <input placeholder="Task Title (e.g. GST Return)" value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)} required /><br/>
        <input type="date" value={taskDue}
          onChange={(e) => setTaskDue(e.target.value)} required /><br/>
        <button type="submit">Add Task</button>
      </form>

      <h2>All Tasks</h2>
      <ul>
        {tasks.map((t) => (
          <li key={t.id} style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
            {t.title} — {t.clients?.name} — {t.due_date}
            <button onClick={() => toggleTaskStatus(t)} style={{ marginLeft: '0.5rem' }}>
              {t.status === 'pending' ? 'Mark Done' : 'Mark Pending'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
