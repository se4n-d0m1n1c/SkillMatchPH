import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import './App.css'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {user ? <Dashboard /> : <AuthPage />}
    </div>
  )
}

export default App
