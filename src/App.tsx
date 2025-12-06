import React from 'react';
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
import GerenciarUsuarios from './components/GerenciarUsuarios';
import GerenciarRoles from './components/GerenciarRoles';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Can } from './hooks/usePermissions';

function AppContent() {
  const { session, loading } = useAuth();

  // Mostra um indicador de carregamento enquanto verifica a autenticação
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

  // Se não houver sessão, mostra a tela de login
  if (!session) {
    return <Login />;
  }

  // Se há sessão, renderiza o app principal com ErrorBoundary interno
  return (
    <ErrorBoundary>
      <AuthenticatedApp />
    </ErrorBoundary>
  );
}

function AuthenticatedApp() {
  const { currentView, setCurrentView } = useApp();

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
      case 'usuarios':
        return (
          <Can 
            permissions={['users.read', 'users.manage']}
            fallback={
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">Acesso negado</p>
                <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta página</p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            }
          >
            <GerenciarUsuarios />
          </Can>
        );
      case 'roles':
        return (
          <Can 
            permissions={['roles.read', 'roles.manage']}
            fallback={
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">Acesso negado</p>
                <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta página</p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            }
          >
            <GerenciarRoles />
          </Can>
        );
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
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;