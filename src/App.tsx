import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { AdminPage } from './pages/AdminPage'
import { MapaPage } from './pages/MapaPage'
import { ListaPage } from './pages/ListaPage'
import { PainelPage } from './pages/PainelPage'
import { PoliticaPrivacidadePage } from './pages/PoliticaPrivacidadePage'
import { TermosPage } from './pages/TermosPage'
import { NovaDenunciaPage } from './pages/NovaDenunciaPage'
import { MinhasDenunciasPage } from './pages/MinhasDenunciasPage'
import { LoginPage } from './pages/LoginPage'
import { AlertasLinhas } from './components/ui/AlertasLinhas'
import { AceiteDocumentos } from './components/legal/AceiteDocumentos'
import { Tutorial } from './components/ui/Tutorial'
import { CadastroPage } from './pages/CadastroPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Tutorial />
        <AceiteDocumentos />
        <AlertasLinhas />
        <Routes>
          <Route path="/" element={<MapaPage />} />
          <Route path="/denuncias" element={<ListaPage />} />
          <Route path="/painel" element={<PainelPage />} />
          <Route path="/privacidade" element={<PoliticaPrivacidadePage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/nova" element={<NovaDenunciaPage />} />
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
