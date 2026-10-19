import { Navigate, Route, Routes } from 'react-router-dom'
import RegistrationPage from './features/registration/RegistrationPage.jsx'
import LoginPage from './features/login/LoginPage.jsx'
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
