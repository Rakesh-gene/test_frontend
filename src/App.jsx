import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './features/auth/LoginPage.jsx'
import RegistrationPage from './features/registration/RegistrationPage.jsx'
import UserManagementPage from './features/users/UserManagementPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/users" element={<UserManagementPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
