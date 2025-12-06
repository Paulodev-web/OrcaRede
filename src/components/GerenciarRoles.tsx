import React, { useEffect, useState } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Key,
  Lock,
  Unlock,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { IAMService } from '../services/iamService';
import type { Role, Permission, RoleWithPermissions, CreateRoleInput, UpdateRoleInput } from '../types';
import { Can } from '../hooks/usePermissions';

interface GerenciarRolesProps {}

const GerenciarRoles: React.FC<GerenciarRolesProps> = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByResource, setPermissionsByResource] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);

  // Carrega dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permissionsData, groupedPerms] = await Promise.all([
        IAMService.getRoles(),
        IAMService.getPermissions(),
        IAMService.getPermissionsGroupedByResource(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionsByResource(groupedPerms);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar roles e permissões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const handleEditRole = async (role: Role) => {
    try {
      const roleWithPerms = await IAMService.getRoleById(role.id);
      if (roleWithPerms) {
        setSelectedRole(roleWithPerms);
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Erro ao carregar role:', err);
      alert('Erro ao carregar role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja deletar este role?')) return;

    try {
      await IAMService.deleteRole(roleId);
      await loadData();
    } catch (err) {
      console.error('Erro ao deletar role:', err);
      alert('Erro ao deletar role. Roles do sistema não podem ser deletados.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Roles</h2>
            <p className="text-sm text-gray-600">
              {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''} encontrado
              {filteredRoles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Can permission="roles.create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Role</span>
          </button>
        </Can>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Busca */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Roles */}
      <div className="space-y-4">
        {filteredRoles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900">Nenhum role encontrado</p>
            <p className="text-sm text-gray-500">Tente ajustar a busca ou criar um novo role</p>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isExpanded={expandedRoles.has(role.id)}
              onToggleExpand={() => toggleRoleExpanded(role.id)}
              onEdit={() => handleEditRole(role)}
              onDelete={() => handleDeleteRole(role.id)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoleModal
          permissions={permissions}
          permissionsByResource={permissionsByResource}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showEditModal && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          permissions={permissions}
          permissionsByResource={permissionsByResource}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRole(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Componente de Card de Role
interface RoleCardProps {
  role: Role;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, isExpanded, onToggleExpand, onEdit, onDelete }) => {
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && rolePermissions.length === 0) {
      loadPermissions();
    }
  }, [isExpanded]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await IAMService.getRolePermissions(role.id);
      setRolePermissions(perms);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
    } finally {
      setLoading(false);
    }
  };

  const permissionsByResource = rolePermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-3 rounded-lg ${role.is_system ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {role.is_system ? (
                <Lock className={`h-6 w-6 ${role.is_system ? 'text-purple-600' : 'text-blue-600'}`} />
              ) : (
                <Unlock className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{role.display_name}</h3>
                {role.is_system && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Sistema
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{role.description || 'Sem descrição'}</p>
              <p className="text-xs text-gray-400 mt-1">Identificador: {role.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleExpand}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            <Can permission="roles.update">
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar role"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </Can>

            <Can permission="roles.delete">
              {!role.is_system && (
                <button
                  onClick={onDelete}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir role"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </Can>
          </div>
        </div>

        {/* Permissões expandidas */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : rolePermissions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma permissão atribuída</p>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Permissões ({rolePermissions.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource} className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                        {resource}
                      </h5>
                      <div className="space-y-1">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center space-x-2 text-xs text-gray-600"
                          >
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{perm.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal de Criar Role
interface CreateRoleModalProps {
  permissions: Permission[];
  permissionsByResource: Record<string, Permission[]>;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  permissions,
  permissionsByResource,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: '',
    display_name: '',
    description: '',
    permission_ids: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await IAMService.createRole(formData);
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao criar role:', err);
      setError(err.message || 'Erro ao criar role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids?.includes(permId)
        ? prev.permission_ids.filter((id) => id !== permId)
        : [...(prev.permission_ids || []), permId],
    }));
  };

  const toggleResource = (resource: string) => {
    setExpandedResources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resource)) {
        newSet.delete(resource);
      } else {
        newSet.add(resource);
      }
      return newSet;
    });
  };

  const selectAllInResource = (resource: string) => {
    const resourcePerms = permissionsByResource[resource];
    const allSelected = resourcePerms.every((p) => formData.permission_ids?.includes(p.id));

    if (allSelected) {
      // Desselecionar todos
      setFormData((prev) => ({
        ...prev,
        permission_ids: prev.permission_ids?.filter(
          (id) => !resourcePerms.some((p) => p.id === id)
        ),
      }));
    } else {
      // Selecionar todos
      const newPerms = resourcePerms.map((p) => p.id);
      setFormData((prev) => ({
        ...prev,
        permission_ids: [...new Set([...(prev.permission_ids || []), ...newPerms])],
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Criar Novo Role</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Identificador *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: gerente_vendas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use snake_case (apenas letras minúsculas, números e underscore)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Exibição *
              </label>
              <input
                type="text"
                required
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="ex: Gerente de Vendas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva as responsabilidades deste role..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissões</label>
            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
              {Object.entries(permissionsByResource).map(([resource, perms]) => {
                const allSelected = perms.every((p) => formData.permission_ids?.includes(p.id));
                const someSelected = perms.some((p) => formData.permission_ids?.includes(p.id));
                const isExpanded = expandedResources.has(resource);

                return (
                  <div key={resource} className="border-b border-gray-200 last:border-0">
                    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div
                        className="flex items-center space-x-2 flex-1"
                        onClick={() => toggleResource(resource)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-semibold text-gray-700 uppercase">
                          {resource}
                        </span>
                        <span className="text-xs text-gray-500">({perms.length})</span>
                        {someSelected && (
                          <span className="text-xs text-purple-600">
                            ({perms.filter((p) => formData.permission_ids?.includes(p.id)).length}{' '}
                            selecionadas)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInResource(resource);
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          allSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {allSelected ? 'Desmarcar Todas' : 'Marcar Todas'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="p-3 space-y-2 bg-white">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permission_ids?.includes(perm.id) || false}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {perm.display_name}
                              </div>
                              {perm.description && (
                                <div className="text-xs text-gray-500">{perm.description}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-0.5">{perm.name}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Editar Role (similar ao Create, mas com dados preenchidos)
interface EditRoleModalProps {
  role: RoleWithPermissions;
  permissions: Permission[];
  permissionsByResource: Record<string, Permission[]>;
  onClose: () => void;
  onSuccess: () => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  role,
  permissions,
  permissionsByResource,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UpdateRoleInput>({
    display_name: role.display_name,
    description: role.description,
    permission_ids: role.permissions.map((p) => p.id),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await IAMService.updateRole(role.id, formData);
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao atualizar role:', err);
      setError(err.message || 'Erro ao atualizar role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids?.includes(permId)
        ? prev.permission_ids.filter((id) => id !== permId)
        : [...(prev.permission_ids || []), permId],
    }));
  };

  const toggleResource = (resource: string) => {
    setExpandedResources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resource)) {
        newSet.delete(resource);
      } else {
        newSet.add(resource);
      }
      return newSet;
    });
  };

  const selectAllInResource = (resource: string) => {
    const resourcePerms = permissionsByResource[resource];
    const allSelected = resourcePerms.every((p) => formData.permission_ids?.includes(p.id));

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permission_ids: prev.permission_ids?.filter(
          (id) => !resourcePerms.some((p) => p.id === id)
        ),
      }));
    } else {
      const newPerms = resourcePerms.map((p) => p.id);
      setFormData((prev) => ({
        ...prev,
        permission_ids: [...new Set([...(prev.permission_ids || []), ...newPerms])],
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Editar Role</h3>
          <p className="text-sm text-gray-600 mt-1">
            {role.name}
            {role.is_system && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                Role do Sistema
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Exibição *
              </label>
              <input
                type="text"
                required
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissões</label>
            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
              {Object.entries(permissionsByResource).map(([resource, perms]) => {
                const allSelected = perms.every((p) => formData.permission_ids?.includes(p.id));
                const someSelected = perms.some((p) => formData.permission_ids?.includes(p.id));
                const isExpanded = expandedResources.has(resource);

                return (
                  <div key={resource} className="border-b border-gray-200 last:border-0">
                    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div
                        className="flex items-center space-x-2 flex-1"
                        onClick={() => toggleResource(resource)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-semibold text-gray-700 uppercase">
                          {resource}
                        </span>
                        <span className="text-xs text-gray-500">({perms.length})</span>
                        {someSelected && (
                          <span className="text-xs text-purple-600">
                            ({perms.filter((p) => formData.permission_ids?.includes(p.id)).length}{' '}
                            selecionadas)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInResource(resource);
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          allSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {allSelected ? 'Desmarcar Todas' : 'Marcar Todas'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="p-3 space-y-2 bg-white">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permission_ids?.includes(perm.id) || false}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {perm.display_name}
                              </div>
                              {perm.description && (
                                <div className="text-xs text-gray-500">{perm.description}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-0.5">{perm.name}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GerenciarRoles;

