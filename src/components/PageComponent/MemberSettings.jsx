// src/pages/member/MemberSettings.jsx
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Skeleton from '../Skeletons';
import api from '../../lib/api';

export default function MemberSettings() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        email: '',
        contactNumber: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: ''
    });
    const [settingsAvailable, setSettingsAvailable] = useState(true);

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passwordVisibility, setPasswordVisibility] = useState({ current: false, new: false, confirm: false });
    const [notifications, setNotifications] = useState(null);

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                const [profileResponse, settingsResponse] = await Promise.all([
                    api.get('/portal/profile'),
                    api.get('/portal/settings')
                ]);
                const profile = profileResponse.data?.data;
                setProfileForm({
                    firstName: profile?.first_name || '',
                    lastName: profile?.last_name || '',
                    dob: profile?.dob ? String(profile.dob).slice(0, 10) : '',
                    gender: ['Male', 'Female', 'Other'].includes(profile?.gender) ? profile.gender : '',
                    email: profile?.email || '',
                    contactNumber: profile?.contact_number || '',
                    address: profile?.address || '',
                    emergencyContactName: profile?.emergency_contact_name || '',
                    emergencyContactPhone: profile?.emergency_contact_phone || ''
                });
                setSettingsAvailable(settingsResponse.data?.storageAvailable !== false);
                const settings = settingsResponse.data?.data || {};
                setNotifications({
                    emailReceipts: Boolean(settings.email_receipts),
                    smsAlerts: Boolean(settings.sms_alerts),
                    promotions: Boolean(settings.promotions),
                    attendanceLogs: Boolean(settings.attendance_logs)
                });
            } catch (err) {
                console.error('Failed to load member settings:', err);
                setError(err.response?.data?.message || 'Settings could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchMemberData();
    }, []);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (activeTab === 'security') {
            if (!passwords.current || !passwords.new || !passwords.confirm) {
                setError('Enter your current password and choose a new password.');
                return;
            }
            if (passwords.new !== passwords.confirm) {
                setError('New password and confirmation do not match.');
                return;
            }
        }
        if (activeTab === 'notifications' && !settingsAvailable) {
            setError('Notification preferences cannot be saved until their database table is installed.');
            return;
        }

        setIsSaving(true);
        try {
            if (activeTab === 'account') {
                await api.put('/portal/profile', profileForm);
                setSuccess('Account details saved.');
            } else if (activeTab === 'notifications') {
                await api.put('/portal/settings', {
                    emailReceipts: notifications.emailReceipts,
                    smsAlerts: notifications.smsAlerts,
                    promotions: notifications.promotions,
                    attendanceLogs: notifications.attendanceLogs
                });
                setSuccess('Notification preferences saved.');
            } else if (activeTab === 'security') {
                await api.put('/portal/password', {
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                });
                setPasswords({ current: '', new: '', confirm: '' });
                setSuccess('Password updated.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Settings could not be saved.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileFieldChange = (event) => {
        const { name, value } = event.target;
        const fieldValue = ['contactNumber', 'emergencyContactPhone'].includes(name)
            ? value.replace(/\D/g, '').slice(0, 11)
            : value;
        setProfileForm((current) => ({ ...current, [name]: fieldValue }));
    };


    const tabs = [
        { id: 'account', label: 'Account Details', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'security', label: 'Password & Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }
    ];

    if (loading) {
        return (
            <div role="status" aria-label="Loading account settings" aria-busy="true" className="mx-auto max-w-6xl space-y-6">
                <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[256px_minmax(0,1fr)]">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-96 w-full rounded-xl" />
                </div>
            </div>
        );
    }
    if (!notifications) return <div role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Settings could not be loaded.'}</div>;

    return (
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Description */}
                <div>
                    <h2 className="text-xl font-extrabold text-[#041a5f]">
                        Account Settings
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Manage your password, notification preferences, and privacy controls.
                    </p>
                </div>
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Sidebar Navigation */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-col gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                                        activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                                    }`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                                    </svg>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Content Panel */}
                    <div className="flex-1 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-8">
                        <form onSubmit={handleSaveSettings}>
                            
                            {/* TAB: Account Details */}
                            {activeTab === 'account' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="pb-4 border-b border-slate-100">
                                        <h3 className="text-base font-extrabold text-[#041a5f]">Account Details</h3>
                                        <p className="text-xs text-slate-400">Update your personal and contact information.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">First Name</label>
                                            <input type="text" name="firstName" autoComplete="given-name" value={profileForm.firstName} onChange={handleProfileFieldChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Last Name</label>
                                            <input type="text" name="lastName" autoComplete="family-name" value={profileForm.lastName} onChange={handleProfileFieldChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date of Birth</label>
                                            <input type="date" name="dob" value={profileForm.dob} onChange={handleProfileFieldChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gender</label>
                                            <select name="gender" value={profileForm.gender} onChange={handleProfileFieldChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="" disabled hidden>Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                                            <input 
                                                type="email" 
                                                name="email"
                                                required
                                                value={profileForm.email}
                                                autoComplete="email"
                                                inputMode="email"
                                                onChange={handleProfileFieldChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
                                            <input 
                                                type="tel"
                                                name="contactNumber"
                                                inputMode="numeric"
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                title="Enter an 11-digit mobile number."
                                                value={profileForm.contactNumber}
                                                autoComplete="tel"
                                                onChange={handleProfileFieldChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Home Address</label>
                                            <textarea name="address" rows="3" value={profileForm.address} onChange={handleProfileFieldChange} autoComplete="street-address" className="w-full resize-y bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="sm:col-span-2 grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Emergency Contact Name</label>
                                                <input type="text" name="emergencyContactName" value={profileForm.emergencyContactName} onChange={handleProfileFieldChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Emergency Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    name="emergencyContactPhone"
                                                    inputMode="numeric"
                                                    pattern="[0-9]{11}"
                                                    maxLength={11}
                                                    title="Enter an 11-digit mobile number."
                                                    value={profileForm.emergencyContactPhone}
                                                    autoComplete="tel"
                                                    onChange={handleProfileFieldChange}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Password & Security */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="pb-4 border-b border-slate-100">
                                        <h3 className="text-base font-extrabold text-[#041a5f]">Password & Security</h3>
                                        <p className="text-xs text-slate-400">Use a password of at least eight characters.</p>
                                    </div>

                                    <div className="max-w-md space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Password</label>
                                            <div className="relative">
                                                <input type={passwordVisibility.current ? 'text' : 'password'} value={passwords.current} required={Boolean(passwords.new)} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Current password" autoComplete="current-password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-11 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <button type="button" onClick={() => setPasswordVisibility({ ...passwordVisibility, current: !passwordVisibility.current })} aria-label={passwordVisibility.current ? 'Hide current password' : 'Show current password'} aria-pressed={passwordVisibility.current} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800">
                                                    {passwordVisibility.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
                                            <div className="relative">
                                                <input type={passwordVisibility.new ? 'text' : 'password'} value={passwords.new} required minLength={8} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} placeholder="New password" autoComplete="new-password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-11 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <button type="button" onClick={() => setPasswordVisibility({ ...passwordVisibility, new: !passwordVisibility.new })} aria-label={passwordVisibility.new ? 'Hide new password' : 'Show new password'} aria-pressed={passwordVisibility.new} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800">
                                                    {passwordVisibility.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm New Password</label>
                                            <div className="relative">
                                                <input type={passwordVisibility.confirm ? 'text' : 'password'} value={passwords.confirm} required={Boolean(passwords.new)} minLength={8} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm new password" autoComplete="new-password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-11 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <button type="button" onClick={() => setPasswordVisibility({ ...passwordVisibility, confirm: !passwordVisibility.confirm })} aria-label={passwordVisibility.confirm ? 'Hide password confirmation' : 'Show password confirmation'} aria-pressed={passwordVisibility.confirm} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800">
                                                    {passwordVisibility.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Notifications */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="pb-4 border-b border-slate-100">
                                        <h3 className="text-base font-extrabold text-[#041a5f]">Notification Preferences</h3>
                                        <p className="text-xs text-slate-400">Choose what updates you want to receive from us.</p>
                                    </div>

                                    {!settingsAvailable && (
                                        <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                            Preference storage is not installed. Apply backend/member-portal-schema.sql to enable saving these options.
                                        </p>
                                    )}
                                    <fieldset disabled={!settingsAvailable} className="space-y-4 disabled:opacity-50">
                                        {/* Toggle Item */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">Email Receipts</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Receive digital payment receipts after renewal.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={notifications.emailReceipts} onChange={() => setNotifications({...notifications, emailReceipts: !notifications.emailReceipts})} />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        {/* Toggle Item */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">SMS Alerts</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Get texted when your membership is expiring.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={notifications.smsAlerts} onChange={() => setNotifications({...notifications, smsAlerts: !notifications.smsAlerts})} />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">Promotional Updates</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Receive occasional gym offers and announcements.</p>
                                            </div>
                                            <input type="checkbox" checked={notifications.promotions} onChange={() => setNotifications({ ...notifications, promotions: !notifications.promotions })} aria-label="Promotional updates" />
                                        </div>

                                        {/* Toggle Item */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">Attendance Log Emails</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Monthly summary of your gym visits.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={notifications.attendanceLogs} onChange={() => setNotifications({...notifications, attendanceLogs: !notifications.attendanceLogs})} />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>
                                    </fieldset>
                                </div>
                            )}

                            {/* Sticky Bottom Save Button */}
                            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving || (activeTab === 'notifications' && !settingsAvailable)}
                                    className="bg-linear-to-r from-[#01358a] to-[#0078d7] hover:opacity-95 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition active:scale-[0.98] cursor-pointer flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{activeTab === 'account' ? 'Save Account Details' : activeTab === 'security' ? 'Update Password' : 'Save Preferences'}</span>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

            </div>

    );
}