import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import type { IUser } from '@repo/types';
import { Loader2, AlertTriangle, CheckCircle, Search, User, Filter, Shield, MoreHorizontal, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Volunteer' | 'Civilian' | 'Dispatcher' | 'Admin'>('ALL');
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<IUser[]>('/users');
      return data;
    },
  });

  const updateRolesMutation = useMutation({
      mutationFn: async ({ userId, roles }: { userId: string, roles: string[] }) => {
          await axiosInstance.patch(`/users/${userId}/roles`, { roles });
      },
      onSuccess: () => {
          toast.success("User roles updated");
          queryClient.invalidateQueries({ queryKey: ['users'] });
          setSelectedUser(null);
      },
      onError: () => toast.error("Failed to update roles")
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-center text-red-700">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>Failed to load users: {(error as any).response?.data?.message || 'Unknown error'}</span>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`;
      const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.roles.some((r: any) => r.name === roleFilter);
      return matchesSearch && matchesRole;
  }) || [];

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500">Manage system access and roles</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 bg-white p-2 rounded-lg border shadow-sm">
            <User className="w-4 h-4" />
            <span className="font-semibold">{users?.length || 0}</span> Total Users
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-5 h-5 text-slate-400" />
              {['ALL', 'Civilian', 'Volunteer', 'Dispatcher', 'Admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role as any)}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                        roleFilter === role 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                      {role}
                  </button>
              ))}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-4">User Identity</th>
                <th className="p-4">Roles</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                  <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                          No users found matching your filters.
                      </td>
                  </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role: any) => (
                        <span
                          key={role.id}
                          className={cn(
                            "px-2 py-0.5 text-xs rounded-full font-medium border",
                            role.name === 'Admin' ? "bg-purple-50 text-purple-700 border-purple-200" :
                            role.name === 'Dispatcher' ? "bg-orange-50 text-orange-700 border-orange-200" :
                            role.name === 'Volunteer' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-50 text-slate-600 border-slate-200"
                          )}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm text-green-700 bg-green-50 w-fit px-2 py-1 rounded-md">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => setSelectedUser(user)}
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    {/* Edit User Modal */}
    {selectedUser && (
        <EditUserModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onSave={(roles) => updateRolesMutation.mutate({ userId: selectedUser.id, roles })}
            isSaving={updateRolesMutation.isPending}
        />
    )}
    </>
  );
};

const EditUserModal = ({ user, onClose, onSave, isSaving }: { 
    user: IUser, 
    onClose: () => void, 
    onSave: (roles: string[]) => void,
    isSaving: boolean 
}) => {
    // Determine initial roles
    const initialRoles = user.roles.map((r: any) => r.name);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);
    
    const availableRoles = ['Civilian', 'Volunteer', 'Dispatcher', 'Admin'];

    const toggleRole = (role: string) => {
        setSelectedRoles(prev => 
            prev.includes(role) 
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Manage Access</h3>
                        <p className="text-sm text-slate-500">Edit permissions for {user.firstName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-slate-700 block">Assigned Roles</label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableRoles.map(role => {
                                const isSelected = selectedRoles.includes(role);
                                return (
                                    <button
                                        key={role}
                                        onClick={() => toggleRole(role)}
                                        className={cn(
                                            "flex items-center p-3 rounded-xl border-2 transition-all",
                                            isSelected 
                                                ? "border-blue-500 bg-blue-50 text-blue-700" 
                                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                                            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                                        )}>
                                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="font-semibold text-sm">{role}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <div className="flex">
                            <Shield className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                Warning: Changing roles will immediately affect the user's access permissions and dashboard capabilities.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(selectedRoles)}
                        disabled={isSaving}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
