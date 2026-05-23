import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { PrivateRoute } from '@/components/auth/PrivateRoute'
import { PwaInstallPopup } from '@/components/layout/PwaInstallPopup'
import { usePushNotifications } from '@/hooks/usePushNotifications'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import AuthCallback from '@/pages/AuthCallback'
import Torneios from '@/pages/Torneios'
import TorneioDetalhe from '@/pages/TorneioDetalhe'
import TorneioInscricao from '@/pages/TorneioInscricao'
import TorneiosCriar from '@/pages/TorneiosCriar'
import TorneioAdmin from '@/pages/TorneioAdmin'
import Rankings from '@/pages/Rankings'
import Bladers from '@/pages/Bladers'
import Perfil from '@/pages/Perfil'
import PerfilEditar from '@/pages/PerfilEditar'
import Comunidade from '@/pages/Comunidade'
import Admin from '@/pages/Admin'
import AdminUsuarios from '@/pages/AdminUsuarios'
import AdminRankings from '@/pages/AdminRankings'
import Colecao from '@/pages/Colecao'
import Combos from '@/pages/Combos'
import Decks from '@/pages/Decks'

function PushSetup() {
  usePushNotifications()
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PwaInstallPopup />
        <PushSetup />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/torneios" element={<Torneios />} />
          <Route path="/torneios/:id" element={<TorneioDetalhe />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/bladers" element={<Bladers />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/comunidade" element={<Comunidade />} />

          {/* Auth-required */}
          <Route path="/torneios/:id/inscricao" element={<PrivateRoute><TorneioInscricao /></PrivateRoute>} />
          <Route path="/perfil/editar" element={<PrivateRoute><PerfilEditar /></PrivateRoute>} />

          {/* Admin-only (component handles redirect if not admin) */}
          <Route path="/torneios/criar" element={<PrivateRoute><TorneiosCriar /></PrivateRoute>} />
          <Route path="/torneios/:id/admin" element={<PrivateRoute><TorneioAdmin /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/admin/usuarios" element={<PrivateRoute><AdminUsuarios /></PrivateRoute>} />
          <Route path="/admin/rankings" element={<PrivateRoute><AdminRankings /></PrivateRoute>} />

          {/* BeybladeCombos integration */}
          <Route path="/colecao" element={<Colecao />} />
          <Route path="/combos" element={<Combos />} />
          <Route path="/decks" element={<PrivateRoute><Decks /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
