import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AreaTrabalho } from './components/AreaTrabalho';
import { Configuracoes } from './components/Configuracoes';
import { GerenciarMateriais } from './components/GerenciarMateriais';
import { GerenciarGrupos } from './components/GerenciarGrupos';
import { GerenciarConcessionarias } from './components/GerenciarConcessionarias';
import { GerenciarTiposPostes } from './components/GerenciarTiposPostes';
import { EditorGrupo } from './components/EditorGrupo';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { VerifyEmail } from './components/VerifyEmail';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Componente para rotas públicas (login, signup, etc)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se já está autenticado, redireciona para o dashboard
  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedApp() {
  const { currentView } = useApp();
  const { session } = useAuth();

  // Se não há sessão, não renderiza nada (o ProtectedRoute já deve ter redirecionado)
  if (!session) {
    return null;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'orcamento':
        return <AreaTrabalho />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'materiais':
        return <GerenciarMateriais />;
      case 'grupos':
        return <GerenciarGrupos />;
      case 'concessionarias':
        return <GerenciarConcessionarias />;
      case 'tipos-postes':
        return <GerenciarTiposPostes />;
      case 'editor-grupo':
        return <EditorGrupo />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <ErrorBoundary>
        {renderCurrentView()}
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />
              <Route
                path="/verify-email"
                element={<VerifyEmail />}
              />

              {/* Rotas protegidas - requerem autenticação e email confirmado */}
              <Route
                path="/"
                element={
                  <ProtectedRoute requireEmailVerification={true}>
                    <AuthenticatedApp />
                  </ProtectedRoute>
                }
              />

              {/* Rota catch-all - redireciona para login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;