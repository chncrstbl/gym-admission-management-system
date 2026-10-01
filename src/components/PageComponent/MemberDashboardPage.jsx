// src/pages/member/MemberDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../Skeletons';
import BaseModal from '../Modals/BaseModal';
import api from '../../lib/api';

const formatDateTime = (value) => {
    if (!value) return 'Date unavailable';

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function MemberDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/portal/dashboard');
                if (response.data?.success) {
                    setDashboard(response.data.data);
                } else {
                    setError('Dashboard data could not be loaded.');
                }
            } catch (err) {
                console.error('Dashboard fetch failed:', err);
                setError(err.response?.data?.message || 'Dashboard data could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div role="status" aria-label="Loading member dashboard" aria-busy="true" className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
                    <Skeleton className="h-72 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const member = dashboard?.member;
    const todayCheckIn = dashboard?.todayCheckIn;
    const recentVisits = dashboard?.recentVisits || [];
    const announcements = dashboard?.announcements || [];
    const attendanceAvailable = dashboard?.attendanceAvailable !== false;
    const fullName = member?.first_name
        ? `${member.first_name} ${member.last_name || ''}`.trim()
        : 'Member';
    const status = member?.status || 'Unavailable';
    const membershipType = member?.role
        ? `${member.role.charAt(0).toUpperCase() + member.role.slice(1)} Plan`
        : 'Membership plan unavailable';

    const expirationDate = member?.end_date ? new Date(member.end_date) : null;
    const daysRemaining = expirationDate && !Number.isNaN(expirationDate.getTime())
        ? Math.max(0, Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24)))
        : null;
    const summarizeAnnouncement = (content) => {
        const text = content || 'No announcement details available.';
        return text.length > 150 ? `${text.slice(0, 150).trim()}...` : text;
    };

    return (
        <div className="member-page flex-1 bg-[#f4f7fb] text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {error && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}
                
                {/* Top Welcome Banner */}
                <div className="bg-linear-to-r from-[#041a5f] via-[#01358a] to-[#0078d7] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Member Dashboard</span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                            Welcome back, {fullName}
                        </h1>
                        <p className="text-blue-100 text-xs sm:text-sm mt-1">
                            Track your facility access, plan expiration, and workout check-ins.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/member/profile')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                            View Digital Pass
                        </button>
                        <button
                            onClick={() => navigate('/member/membership')}
                            className="bg-white text-[#01358a] hover:bg-blue-50 text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                        >
                            Manage Membership
                        </button>
                    </div>
                </div>

                {/* Key Status Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Membership Status */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Plan Status</span>
                            <span className={`w-2 h-2 rounded-full ${status.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        </div>
                        <div className="text-lg font-extrabold text-[#041a5f] capitalize">{status}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{membershipType}</div>
                    </div>

                    {/* 2. Expiration Countdown */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Plan Validity</span>
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-lg font-extrabold text-blue-600">{daysRemaining ?? '--'} Days Left</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                            {expirationDate && !Number.isNaN(expirationDate.getTime())
                                ? `Until ${expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : 'Expiration date unavailable'}
                        </div>
                    </div>

                    {/* 3. Today's Check-In */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Check-In</span>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-lg font-extrabold text-emerald-600">
                            {!attendanceAvailable ? 'Unavailable' : todayCheckIn ? (todayCheckIn.status || 'Checked In') : 'Not Checked In'}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                            {!attendanceAvailable
                                ? 'Attendance data is not configured'
                                : todayCheckIn
                                ? `${formatDateTime(todayCheckIn.check_in_time)} (${todayCheckIn.terminal || 'Gym'})`
                                : 'No check-in recorded today'}
                        </div>
                    </div>

                    {/* 4. Total Monthly Attendance */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">This Month</span>
                            <svg className="w-4 h-4 text-[#01358a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="text-lg font-extrabold text-[#041a5f]">{attendanceAvailable ? `${dashboard?.monthlySessions ?? 0} Sessions` : 'Unavailable'}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">This calendar month</div>
                    </div>
                </div>

                {/* Main Content Grid: Recent Visits & Gym Announcements */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recent Check-In Visits (2 cols) */}
                    <div className="order-2 lg:order-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div>
                                <h2 className="text-base font-extrabold text-[#041a5f]">Recent Visits History</h2>
                                <p className="text-xs text-slate-400">Your latest QR scanner facility check-ins</p>
                            </div>
                            <button
                                onClick={() => navigate('/member/visits')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                View All
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {recentVisits.length > 0 ? recentVisits.map((visit) => (
                                <div key={visit.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">{formatDateTime(visit.check_in_time)}</div>
                                            <div className="text-[11px] text-slate-400">{visit.method || 'Check-in'} • {visit.terminal || 'Gym'}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {visit.status || 'Recorded'}
                                    </span>
                                </div>
                            )) : (
                                <p className="py-4 text-sm text-slate-500">
                                    {attendanceAvailable ? 'No visits recorded yet.' : 'Attendance storage is not configured. Apply backend/member-portal-schema.sql.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Announcements & Gym Notice Card (1 col) */}
                    <div className="order-1 lg:order-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <h2 className="text-base font-extrabold text-[#041a5f]">Announcements</h2>
                            </div>

                            <div className="space-y-3.5">
                                {announcements.length > 0 ? announcements.map((announcement) => (
                                    <article key={announcement.id} className="border-b border-slate-100 py-4 last:border-b-0">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                            {announcement.category || 'Announcement'}
                                        </span>
                                        <h3 className="text-xs font-bold text-slate-800 mt-0.5">{announcement.title}</h3>
                                        <p className="text-[11px] leading-relaxed text-slate-500 mt-1">{summarizeAnnouncement(announcement.content)}</p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAnnouncement(announcement)}
                                            className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                                        >
                                            Read announcement
                                        </button>
                                    </article>
                                )) : (
                                    <p className="text-sm text-slate-500">No announcements available.</p>
                                )}
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            <BaseModal
                isOpen={Boolean(selectedAnnouncement)}
                onClose={() => setSelectedAnnouncement(null)}
                title={selectedAnnouncement?.title || 'Announcement'}
                maxWidth="max-w-xl"
            >
                {selectedAnnouncement && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                {selectedAnnouncement.category || 'Announcement'}
                            </span>
                            {selectedAnnouncement.created_at && (
                                <time className="text-xs text-slate-400">
                                    {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                                </time>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {selectedAnnouncement.content}
                        </p>
                    </div>
                )}
            </BaseModal>
        </div>
    );
}