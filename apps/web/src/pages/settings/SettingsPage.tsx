import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Loader2, Save, User, Bell, Shield, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const SettingsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        preferences: {
            notifications: {
                email: true,
                sms: false,
                push: true
            }
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                preferences: {
                    notifications: {
                        email: user.preferences?.notifications?.email ?? true,
                        sms: user.preferences?.notifications?.sms ?? false,
                        push: user.preferences?.notifications?.push ?? true
                    }
                }
            });
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await axiosInstance.patch('/users/me', data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['me'], data); // Update auth user cache usually handled by context, but nice to sync
            // Force reload or re-fetch me would be better handled by AuthContext but manual user update here
            toast.success('Settings saved successfully');
        },
        onError: () => {
            toast.error('Failed to save settings');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
                    <p className="text-slate-500">Manage your profile details and preferences.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                        <User className="w-5 h-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name</label>
                            <input 
                                type="text" 
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input 
                                type="text" 
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    value={user?.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-slate-500">Email cannot be changed directly for security reasons.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                        <Bell className="w-5 h-5 text-amber-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Notification Preferences</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Email Notifications</h3>
                                <p className="text-xs text-slate-500">Receive incident updates and digests via email.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.preferences.notifications.email}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        preferences: {
                                            ...formData.preferences,
                                            notifications: { ...formData.preferences.notifications, email: e.target.checked }
                                        }
                                    })}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">SMS Alerts</h3>
                                <p className="text-xs text-slate-500">Get critical alerts via text message (Standard rates apply).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.preferences.notifications.sms}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        preferences: {
                                            ...formData.preferences,
                                            notifications: { ...formData.preferences.notifications, sms: e.target.checked }
                                        }
                                    })}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                        <Shield className="w-5 h-5 text-purple-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Account Security</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <p className="text-sm font-medium text-slate-700 mb-1">Role</p>
                             <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                {user?.roles?.[0]?.name || 'User'}
                             </div>
                        </div>
                        <div>
                             <p className="text-sm font-medium text-slate-700 mb-1">User ID</p>
                             <p className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200">{user?.id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};
