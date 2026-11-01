import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { AdminPage } from './pages/AdminPage'
import { MapaPage } from './pages/MapaPage'
import { ListaPage } from './pages/ListaPage'
import { NovaDenunciaPage } from './pages/NovaDenunciaPage'
import { MinhasDenunciasPage } from './pages/MinhasDenunciasPage'
import { LoginPage } from './pages/LoginPage'
import { Tutorial } from './components/ui/Tutorial'
import { CadastroPage } from './pages/CadastroPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Tutorial />
        <Routes>
          <Route path="/" element={<MapaPage />} />
          <Route path="/denuncias" element={<ListaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route
            path="/nova"
            element={
              <ProtectedRoute>
                <NovaDenunciaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas"
            element={
              <ProtectedRoute>
                <MinhasDenunciasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
