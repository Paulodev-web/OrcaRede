'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useApp } from '../conteexts/AppContext';
import { useSecurityCheck } from '../hooks/useSecurityCheck';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { currentView } = useApp();
  
  // Verifica segurança periodicamente (a cada 60 segundos)
  useSecurityCheck(60000);

  // Determina a view baseado na rota atual
  const getViewFromPath = () => {
    if (pathname?.startsWith('/dashboard')) return 'dashboard';
    if (pathname?.startsWith('/orcamento')) return 'orcamento';
    if (pathname?.startsWith('/configuracoes')) return 'configuracoes';
    if (pathname?.startsWith('/materiais')) return 'materiais';
    if (pathname?.startsWith('/grupos')) return 'grupos';
    if (pathname?.startsWith('/concessionarias')) return 'concessionarias';
    if (pathname?.startsWith('/tipos-postes')) return 'tipos-postes';
    return currentView || 'dashboard';
  };

  const view = getViewFromPath();

  const getPageTitle = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'orcamento': return 'Área de Trabalho do Orçamento';
      case 'configuracoes': return 'Painel de Configurações';
      case 'materiais': return 'Gerenciar Materiais';
      case 'grupos': return 'Gerenciar Grupos de Itens';
      case 'concessionarias': return 'Gerenciar Concessionárias';
      case 'tipos-postes': return 'Gerenciar Tipos de Poste';
      case 'editor-grupo': return 'Editor de Grupo de Itens';
      default: return 'OrçaRede';
    }
  };

  const getPageDescription = () => {
    switch (view) {
      case 'dashboard': return 'Visão geral dos seus orçamentos e projetos';
      case 'orcamento': return 'Crie e edite orçamentos de projetos elétricos';
      case 'configuracoes': return 'Configure as opções do sistema';
      case 'materiais': return 'Gerencie o catálogo de materiais disponíveis';
      case 'grupos': return 'Organize materiais em grupos reutilizáveis';
      case 'concessionarias': return 'Cadastre e gerencie concessionárias de energia';
      case 'tipos-postes': return 'Configure os tipos de postes disponíveis';
      case 'editor-grupo': return 'Edite os detalhes do grupo selecionado';
      default: return '';
    }
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header da página */}
          <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="lg:ml-16"> {/* Margem para compensar botão mobile apenas */}
                <h1 className="text-2xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                {getPageDescription() && (
                  <p className="mt-1 text-sm text-gray-500">
                    {getPageDescription()}
                  </p>
                )}
              </div>
            </div>
          </header>
          
          {/* Conteúdo da página - Com scroll interno */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
            <div className="lg:ml-16 h-full"> {/* Margem para compensar botão mobile apenas */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}