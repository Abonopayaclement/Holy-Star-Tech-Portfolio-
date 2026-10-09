import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateProfile,
  getOrganization,
  updateOrganization,
  getBranchDetails,
  updateBranchDetails,
  createBranch,
  createService,
  updateService,
  getCategoriesForStaff,
  createCategory,
  toggleCategoryActive,
  deleteCategory,
  getOrgStaff,
  createOrgStaff,
  changePassword,
  AppointmentCategory,
} from '../api/branch';
import {
  Building2,
  Building,
  MapPin,
  Clock,
  Target,
  Plus,
  Save,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Check,
  Tag,
  ToggleLeft,
  Trash2,
  Users,
  UserCheck,
  Shield,
  Key,
  Mail,
  Phone,
  Briefcase,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActiveBranch } from '../context/ActiveBranchContext';

type SettingsTab = 'branches' | 'staff' | 'organization';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeBranchId, setActiveBranchId } = useActiveBranch();

  const [activeTab, setActiveTab] = useState<SettingsTab>('branches');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setNotification(msg);
    setErrorMessage(null);
    setTimeout(() => setNotification(null), 5000);
  };

  const showBannerError = (msg: string) => {
    setErrorMessage(msg);
    setNotification(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // 1. Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const orgId = user?.organizationId || profile?.organizationId || profile?.organization?.id;

  // 2. Fetch full organization details (scoped to this org)
  const {
    data: organization,
    isLoading: orgLoading,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganization(orgId!),
    enabled: !!orgId,
  });

  // Extract branches belonging exclusively to this organization
  const branches: any[] = organization?.branches || profile?.organization?.branches || [];

  // Selected branch state
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    if (branches.length > 0) {
      if (!selectedBranchId || !branches.some((b) => b.id === selectedBranchId)) {
        const nextId =
          activeBranchId && branches.some((b) => b.id === activeBranchId)
            ? activeBranchId
            : branches[0].id;
        setSelectedBranchId(nextId);
      }
    } else {
      setSelectedBranchId('');
    }
  }, [branches, activeBranchId, selectedBranchId]);

  // 3. Fetch detailed branch data for the selected branch
  const {
    data: branch,
    isLoading: branchLoading,
    refetch: refetchBranch,
  } = useQuery({
    queryKey: ['branch', selectedBranchId],
    queryFn: () => getBranchDetails(selectedBranchId),
    enabled: !!selectedBranchId,
  });

  // 4. Fetch appointment categories for the selected branch
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', selectedBranchId],
    queryFn: () => getCategoriesForStaff({ branchId: selectedBranchId }),
    enabled: !!selectedBranchId,
  });

  // 5. Fetch organization staff
  const {
    data: staffList,
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: ['org-staff', orgId],
    queryFn: () => getOrgStaff(orgId!),
    enabled: !!orgId,
  });

  // Branch Editing Form Data
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    location: '',
    operatingHours: '08:00 - 17:00',
    geofenceRadius: 100,
  });

  useEffect(() => {
    if (branch) {
      setBranchFormData({
        name: branch.name || '',
        location: branch.location || '',
        operatingHours: branch.operatingHours || '08:00 - 17:00',
        geofenceRadius: branch.geofenceRadius || 100,
      });
    }
  }, [branch]);

  // Modals & Sub-forms
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    location: '',
    operatingHours: '08:00 - 17:00',
    geofenceRadius: 100,
  });

  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 15,
    price: 0,
    allowRemoteJoin: true,
  });

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState<number>(15);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    serviceId: '',
  });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STAFF',
    branchId: '',
    phoneNumber: '',
  });

  // Organization Info Form
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    type: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    if (organization) {
      setOrgFormData({
        name: organization.name || '',
        type: organization.type || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        description: organization.description || '',
      });
    }
  }, [organization]);

  // Admin Account Form
  const [adminProfileData, setAdminProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (profile) {
      setAdminProfileData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // --- MUTATIONS ---

  // 1. Create Branch
  const createBranchMutation = useMutation({
    mutationFn: (data: any) => createBranch(orgId!, data),
    onSuccess: (newBranch: any) => {
      refetchOrg();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['public-orgs-discovery'] });
      if (newBranch?.id) {
        setSelectedBranchId(newBranch.id);
        setActiveBranchId(newBranch.id);
      }
      setShowAddBranchModal(false);
      setNewBranchData({
        name: '',
        location: '',
        operatingHours: '08:00 - 17:00',
        geofenceRadius: 100,
      });
      showBanner('Branch created successfully! You can now configure services and desk queues.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to create branch. Please check the details.');
    },
  });

  // 2. Update Branch
  const updateBranchMutation = useMutation({
    mutationFn: (data: any) => updateBranchDetails(selectedBranchId, data),
    onSuccess: () => {
      refetchBranch();
      refetchOrg();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showBanner('Branch parameters saved successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to update branch parameters.');
    },
  });

  // 3. Create Service
  const createServiceMutation = useMutation({
    mutationFn: (data: any) => createService(selectedBranchId, data),
    onSuccess: () => {
      refetchBranch();
      setShowAddService(false);
      setNewService({ name: '', description: '', duration: 15, price: 0, allowRemoteJoin: true });
      showBanner('New service and queue line added successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to create service.');
    },
  });

  // 4. Update Service Duration
  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, duration }: { serviceId: string; duration: number }) =>
      updateService(serviceId, { duration }),
    onSuccess: () => {
      refetchBranch();
      setEditingServiceId(null);
      showBanner('Service duration updated successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to update service duration.');
    },
  });

  // 5. Create Appointment Category
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) =>
      createCategory({
        name: data.name,
        description: data.description || undefined,
        branchId: selectedBranchId || undefined,
        serviceId: data.serviceId || undefined,
      }),
    onSuccess: () => {
      refetchCategories();
      setShowAddCategory(false);
      setNewCategory({ name: '', description: '', serviceId: '' });
      showBanner('Appointment category created successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to create category.');
    },
  });

  // 6. Toggle Category
  const toggleCategoryMutation = useMutation({
    mutationFn: (id: string) => toggleCategoryActive(id),
    onSuccess: () => {
      refetchCategories();
      showBanner('Category status updated.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to toggle category.');
    },
  });

  // 7. Delete Category
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      refetchCategories();
      showBanner('Category archived successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to archive category.');
    },
  });

  // 8. Create Staff Member
  const createStaffMutation = useMutation({
    mutationFn: (data: any) => createOrgStaff(orgId!, data),
    onSuccess: () => {
      refetchStaff();
      setShowAddStaffModal(false);
      setNewStaffData({
        fullName: '',
        email: '',
        password: '',
        role: 'STAFF',
        branchId: '',
        phoneNumber: '',
      });
      showBanner('Staff member registered and assigned successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to create staff member.');
    },
  });

  // 9. Update Organization Profile
  const updateOrgMutation = useMutation({
    mutationFn: (data: any) => updateOrganization(orgId!, data),
    onSuccess: () => {
      refetchOrg();
      showBanner('Organization profile updated successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to update organization profile.');
    },
  });

  // 10. Update Admin Profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showBanner('Admin profile updated successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to update admin profile.');
    },
  });

  // 11. Change Password
  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => changePassword(data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showBanner('Administrator password updated successfully.');
    },
    onError: (err: any) => {
      showBannerError(err.response?.data?.error || 'Failed to change password.');
    },
  });

  // Handlers
  const handleBranchSwitch = (newId: string) => {
    setSelectedBranchId(newId);
    setActiveBranchId(newId);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    updateBranchMutation.mutate(branchFormData);
  };

  const handleCreateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name.trim() || !newBranchData.location.trim()) {
      showBannerError('Branch name and physical location are required.');
      return;
    }
    createBranchMutation.mutate(newBranchData);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;
    createServiceMutation.mutate(newService);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    createCategoryMutation.mutate(newCategory);
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffData.fullName.trim() || !newStaffData.email.trim() || !newStaffData.password) {
      showBannerError('Full name, email, and initial password are required.');
      return;
    }
    if (newStaffData.password.length < 6) {
      showBannerError('Password must be at least 6 characters.');
      return;
    }
    createStaffMutation.mutate(newStaffData);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate(orgFormData);
  };

  const handleAdminProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(adminProfileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showBannerError('Current and new password are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showBannerError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showBannerError('New password and confirm password do not match.');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Settings & Administration
            </h1>
            {organization?.name && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {organization.name}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Configure branch locations, service desks, appointment categories, staff personnel, and organization details
          </p>
        </div>

        {/* Global tab selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'branches'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Branches & Desks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'staff'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personnel & Staff</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('organization')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'organization'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Organization & Profile</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-3 text-sm font-bold shadow-xs animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center space-x-3 text-sm font-bold shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BRANCHES & SERVICE DESKS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'branches' && (
        <div className="space-y-8">
          {branches.length === 0 ? (
            /* Pristine Clean Empty State for New Organizations */
            <div className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
                <Building2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                No Branches Configured Yet
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed">
                Your organization is registered and approved! To begin serving customers, adding queue lines, and scheduling appointments, create your first branch location.
              </p>
              <button
                type="button"
                onClick={() => setShowAddBranchModal(true)}
                className="mt-6 inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all transform active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Branch</span>
              </button>
            </div>
          ) : (
            <>
              {/* Branch Selector Toolbar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Active Branch Location
                    </span>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => handleBranchSwitch(e.target.value)}
                      className="bg-transparent font-black text-slate-900 text-base border-0 focus:ring-0 p-0 cursor-pointer max-w-[260px] truncate"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.location})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shrink-0 self-start sm:self-auto shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Branch</span>
                </button>
              </div>

              {/* Branch Operating Parameters Form */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-black text-slate-800">
                    <Building className="h-5 w-5 text-indigo-600" />
                    <span>Branch Operating Parameters</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      branch?.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {branch?.isActive ? 'Branch Active' : 'Branch Paused'}
                  </span>
                </div>

                <form onSubmit={handleBranchSubmit} className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={branchFormData.name}
                        onChange={(e) =>
                          setBranchFormData({ ...branchFormData, name: e.target.value })
                        }
                        placeholder="e.g. Accra Central Main Branch"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Physical Location / Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={branchFormData.location}
                          onChange={(e) =>
                            setBranchFormData({ ...branchFormData, location: e.target.value })
                          }
                          placeholder="e.g. Airport Residential Area, Accra"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Operating Hours
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={branchFormData.operatingHours}
                          onChange={(e) =>
                            setBranchFormData({ ...branchFormData, operatingHours: e.target.value })
                          }
                          placeholder="08:00 - 17:00"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Geofence Radius (Meters)
                      </label>
                      <div className="relative">
                        <Target className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={branchFormData.geofenceRadius}
                          onChange={(e) =>
                            setBranchFormData({
                              ...branchFormData,
                              geofenceRadius: Number(e.target.value),
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Allow customers to check in via QR code within this physical proximity
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updateBranchMutation.isPending}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updateBranchMutation.isPending ? 'Saving...' : 'Save Branch Details'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Branch Service Catalog & Queue Lines */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <span>Branch Service Catalog & Desks</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Configure service counter lines and target service times for this branch
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddService(!showAddService)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200/60 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service</span>
                  </button>
                </div>

                {showAddService && (
                  <form
                    onSubmit={handleServiceSubmit}
                    className="p-6 bg-indigo-50/40 border-b border-indigo-100 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Customer Support & Inquiry Desk"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Est. Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={newService.duration}
                          onChange={(e) =>
                            setNewService({ ...newService, duration: Number(e.target.value) })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Brief overview of what customer issues are handled here"
                        value={newService.description}
                        onChange={(e) =>
                          setNewService({ ...newService, description: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddService(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createServiceMutation.isPending}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
                      >
                        {createServiceMutation.isPending ? 'Creating...' : 'Create Service Line'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Services List */}
                <div className="p-6 space-y-3">
                  {!branch?.services || branch.services.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500 bg-slate-50/50">
                      No services configured for this branch yet. Click "Add Service" above to add queue counters.
                    </div>
                  ) : (
                    branch.services.map((svc: any) => (
                      <div
                        key={svc.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-slate-900 text-sm">{svc.name}</h4>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              Active Counter
                            </span>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          {editingServiceId === svc.id ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={editDuration}
                                onChange={(e) => setEditDuration(Number(e.target.value))}
                                className="w-16 px-2 py-1 text-xs font-bold border border-indigo-300 rounded-lg text-center"
                              />
                              <span className="text-xs text-slate-500 font-bold">min</span>
                              <button
                                type="button"
                                disabled={updateServiceMutation.isPending}
                                onClick={() =>
                                  updateServiceMutation.mutate({
                                    serviceId: svc.id,
                                    duration: editDuration,
                                  })
                                }
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                title="Save duration"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingServiceId(null)}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingServiceId(svc.id);
                                setEditDuration(svc.duration || 15);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                              title="Edit duration"
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{svc.duration || 15} min</span>
                              <Edit3 className="w-3 h-3 text-slate-400 ml-1" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Branch Appointment Categories */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-indigo-600" />
                      <span>Remote Appointment Categories</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Customer booking categories and topics configured for this branch
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200/60 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                {showAddCategory && (
                  <form
                    onSubmit={handleCategorySubmit}
                    className="p-6 bg-indigo-50/40 border-b border-indigo-100 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Category Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Account Dispute & Escalation"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Associated Service Desk
                        </label>
                        <select
                          value={newCategory.serviceId}
                          onChange={(e) =>
                            setNewCategory({ ...newCategory, serviceId: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="">Branch-Wide (All Service Desks)</option>
                          {branch?.services?.map((svc: any) => (
                            <option key={svc.id} value={svc.id}>
                              {svc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Guidance Description for Customer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Assistance unlocking accounts or updating documents"
                        value={newCategory.description}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, description: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createCategoryMutation.isPending}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
                      >
                        {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Categories List */}
                <div className="p-6 space-y-3">
                  {categoriesLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading categories...</div>
                  ) : !categories || categories.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500 bg-slate-50/50">
                      No remote appointment categories configured yet. Click "Add Category" above to configure your branch's categories.
                    </div>
                  ) : (
                    categories.map((cat: AppointmentCategory) => (
                      <div
                        key={cat.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                          cat.isActive
                            ? 'border-slate-200/80 bg-slate-50/60'
                            : 'border-slate-200/50 bg-slate-100/50 opacity-60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-slate-900 text-sm">{cat.name}</h4>
                            {cat.service ? (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                {cat.service.name}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                Branch-Wide
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-xs text-slate-500">{cat.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            disabled={toggleCategoryMutation.isPending}
                            onClick={() => toggleCategoryMutation.mutate(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-xs ${
                              cat.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {cat.isActive ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={deleteCategoryMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Archive "${cat.name}" category?`)) {
                                deleteCategoryMutation.mutate(cat.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Archive Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF & PERSONNEL                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Organization Personnel & Staff</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Register operators and branch managers, assign branch desks, and manage team credentials
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Staff Members List */}
            <div className="p-6">
              {staffLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading personnel...</div>
              ) : !staffList || staffList.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center bg-slate-50/50">
                  <UserCheck className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-800 text-sm">No Staff Registered Yet</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm">
                    Click "Add Staff Member" above to onboard desk operators and branch managers to your organization.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffList.map((member: any) => (
                    <div
                      key={member.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-sm truncate">
                            {member.fullName}
                          </h4>
                          <p className="text-xs text-slate-500 truncate flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                            {member.email}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                            member.role === 'BRANCH_MANAGER'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {member.role === 'BRANCH_MANAGER' ? 'Branch Manager' : 'Staff Operator'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center space-x-1.5 truncate">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold truncate">
                            {member.staffBranch ? member.staffBranch.name : 'All / Unassigned'}
                          </span>
                        </div>
                        {member.phoneNumber && (
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px] shrink-0">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{member.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ORGANIZATION PROFILE & ADMIN SECURITY                             */}
      {/* ========================================================================= */}
      {activeTab === 'organization' && (
        <div className="space-y-8">
          {/* Organization Profile */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-black text-slate-800">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <span>Organization Identity & Contact</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Organization
              </span>
            </div>

            <form onSubmit={handleOrgSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Industry / Organization Type
                  </label>
                  <input
                    type="text"
                    value={orgFormData.type}
                    onChange={(e) => setOrgFormData({ ...orgFormData, type: e.target.value })}
                    placeholder="e.g. Healthcare, Banking, Municipal Services"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Support / Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={orgFormData.contactEmail}
                      onChange={(e) =>
                        setOrgFormData({ ...orgFormData, contactEmail: e.target.value })
                      }
                      placeholder="support@org.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={orgFormData.contactPhone}
                      onChange={(e) =>
                        setOrgFormData({ ...orgFormData, contactPhone: e.target.value })
                      }
                      placeholder="+233 20 000 0000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Headquarters / Physical Address
                  </label>
                  <input
                    type="text"
                    value={orgFormData.address}
                    onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                    placeholder="e.g. 14 Independence Avenue, Ridge, Accra"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateOrgMutation.isPending}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{updateOrgMutation.isPending ? 'Saving...' : 'Save Organization Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Admin Profile & Password Change */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Profile Details */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2 font-black text-slate-800">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <span>Administrator Account Details</span>
                </div>

                <form onSubmit={handleAdminProfileSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={adminProfileData.fullName}
                      onChange={(e) =>
                        setAdminProfileData({ ...adminProfileData, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={adminProfileData.email}
                      onChange={(e) =>
                        setAdminProfileData({ ...adminProfileData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={adminProfileData.phoneNumber}
                      onChange={(e) =>
                        setAdminProfileData({ ...adminProfileData, phoneNumber: e.target.value })
                      }
                      placeholder="+233 50 000 0000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updateProfileMutation.isPending ? 'Updating...' : 'Update Details'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2 font-black text-slate-800">
                  <Key className="h-5 w-5 text-indigo-600" />
                  <span>Change Admin Password</span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                    >
                      <Key className="w-4 h-4" />
                      <span>{changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BRANCH                                                         */}
      {/* ========================================================================= */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Add New Branch Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBranchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Accra Central Main Branch"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Physical Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. High Street, Opposite Commercial Bank"
                    value={newBranchData.location}
                    onChange={(e) =>
                      setNewBranchData({ ...newBranchData, location: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    placeholder="08:00 - 17:00"
                    value={newBranchData.operatingHours}
                    onChange={(e) =>
                      setNewBranchData({ ...newBranchData, operatingHours: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Geofence Radius (M)
                  </label>
                  <input
                    type="number"
                    value={newBranchData.geofenceRadius}
                    onChange={(e) =>
                      setNewBranchData({
                        ...newBranchData,
                        geofenceRadius: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {createBranchMutation.isPending ? 'Creating Branch...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD STAFF MEMBER                                                   */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Mensah"
                  value={newStaffData.fullName}
                  onChange={(e) => setNewStaffData({ ...newStaffData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="samuel.mensah@company.com"
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newStaffData.password}
                    onChange={(e) =>
                      setNewStaffData({ ...newStaffData, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={newStaffData.phoneNumber}
                    onChange={(e) =>
                      setNewStaffData({ ...newStaffData, phoneNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Role in Organization
                  </label>
                  <select
                    value={newStaffData.role}
                    onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="STAFF">Staff Operator</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Assigned Branch
                  </label>
                  <select
                    value={newStaffData.branchId}
                    onChange={(e) =>
                      setNewStaffData({ ...newStaffData, branchId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Organization-Wide / Floating</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaffMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {createStaffMutation.isPending ? 'Registering...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
