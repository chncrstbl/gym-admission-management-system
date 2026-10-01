import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import StatsCard from "../../components/Cards/StatsCard";
import Skeleton from "../../components/Skeletons"; 
import RecentActivityModal from '../../components/Modals/RecentActivityModal';
import BaseModal from '../../components/Modals/BaseModal';
import { 
    Users, UserCheck, AlertTriangle, UserPlus, 
    TrendingUp, AlertCircle, Activity, Clock, ArrowLeft, ArrowRight,
    Dumbbell, CheckCircle, Wrench, Send
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

const Overview = () => {
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', category: 'Facility Notice', content: '' });
    const [isPublishing, setIsPublishing] = useState(false);
    const [announcementError, setAnnouncementError] = useState('');

    useEffect(() => {
        api.get('/announcements')
            .then((response) => setAnnouncements(response.data?.data || []))
            .catch(() => setAnnouncementError('Announcements could not be loaded.'));
    }, []);

    const handlePublishAnnouncement = async (event) => {
        event.preventDefault();
        setAnnouncementError('');
        setIsPublishing(true);
        try {
            const response = await api.post('/announcements', announcementForm);
            setAnnouncements((current) => [response.data.data, ...current]);
            setAnnouncementForm({ title: '', category: 'Facility Notice', content: '' });
        } catch (err) {
            setAnnouncementError(err.response?.data?.message || 'Announcement could not be published.');
        } finally {
            setIsPublishing(false);
        }
    };

    const { data: memberStats, isLoading: loadingMembers } = useQuery({
        queryKey: ['memberStats'],
        queryFn: async () => (await api.get('/member-stats')).data,
        refetchOnWindowFocus: false
    });

    const { data: financeStats, isLoading: loadingFinance } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => (await api.get('/stats')).data,
        refetchOnWindowFocus: false
    });

    const { data: analytics, isLoading: loadingAnalytics } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => (await api.get('/analytics')).data,
        refetchOnWindowFocus: false
    });

    const { data: activity, isLoading: loadingActivity } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => (await api.get('/activity')).data,
        refetchOnWindowFocus: false
    });

    const { data: equipment, isLoading: loadingEquipment } = useQuery({
        queryKey: ['equipment'],
        queryFn: async () => (await api.get('/equipment')).data,
        refetchOnWindowFocus: false
    });

    if (loadingMembers || loadingFinance || loadingAnalytics || loadingActivity || loadingEquipment) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <Skeleton className="h-6 w-48 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={`eq-${i}`} className="h-32 rounded-2xl" />)}
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-6 w-48 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={`mem-${i}`} className="h-32 rounded-2xl" />)}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-96 rounded-2xl" />
                        <Skeleton className="h-80 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    const getFinanceStat = (title) => (financeStats || []).find(s => s.title === title) || { value: 0, subValue: "0%", isPositive: true };
    const revenueStat = getFinanceStat("Total Revenue");
    const outstandingStat = getFinanceStat("Outstanding Invoices");
    const activeSubStat = getFinanceStat("Active Members");
    
    const formatPeso = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const diffInSeconds = Math.floor((new Date() - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    };
    const summarizeAnnouncement = (content) => {
        const text = content || 'No announcement details available.';
        return text.length > 150 ? `${text.slice(0, 150).trim()}...` : text;
    };
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
    
    const safeMemberStats = memberStats || { total: 0, active: 0, expiring: 0, newToday: 0 };
    const safeAnalytics = analytics || { roles: [], trends: [] };
    const safeActivity = activity || [];
    
    const safeEquipment = equipment || [];
    const equipmentStats = {
        total: safeEquipment.length,
        excellent: safeEquipment.filter(e => e.equipment_condition === 'Excellent').length,
        attention: safeEquipment.filter(e => ['Poor', 'Damaged'].includes(e.equipment_condition)).length,
        value: safeEquipment.reduce((sum, item) => sum + (parseFloat(item.asset_value) || 0), 0)
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COLUMN --- */}
                <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
                    
                    {/* Financial Performance */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4">Financial Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard title="Total Revenue (YTD)" value={formatPeso(revenueStat.value)} sub={`${revenueStat.isPositive ? '' : ''}${revenueStat.subValue}`} icon={TrendingUp} theme={revenueStat.isPositive ? "green" : "red"} />
                            <StatsCard title="Outstanding Invoices" value={formatPeso(outstandingStat.value)} sub={outstandingStat.subValue} icon={AlertCircle} theme="red" />
                            <StatsCard title="Active Subscriptions" value={activeSubStat.value} sub={activeSubStat.subValue} icon={Activity} theme="blue" />
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Membership Summary</h3>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-6">New Members (Last 6 Months)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={safeAnalytics.trends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="members" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    

                    {/* Membership Summary */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatsCard title="Total Members" value={safeMemberStats.total} sub="All time" icon={Users} theme="blue" />
                            <StatsCard title="Active Members" value={safeMemberStats.active} sub="Currently active" icon={UserCheck} theme="green" />
                            <StatsCard title="Expiring Soon" value={safeMemberStats.expiring} sub="Next 7 Days" icon={AlertTriangle} theme="red" />
                            <StatsCard title="New Today" value={safeMemberStats.newToday} sub="Joined today" icon={UserPlus} theme="purple" />
                        </div>
                    </div>

                    {/* Equipments Summary */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4">Equipments Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatsCard title="Total Equipment" value={equipmentStats.total} sub="Total Items" icon={Dumbbell} theme="blue" />
                            <StatsCard title="Top Condition" value={equipmentStats.excellent} sub="Excellent" icon={CheckCircle} theme="green" />
                            <StatsCard title="Needs Attention" value={equipmentStats.attention} sub="Poor/Damaged" icon={Wrench} theme="orange" />
                            <StatsCard title="Total Asset Value" value={formatPeso(equipmentStats.value)} sub="Inventory Value" icon={AlertCircle} theme="purple" />
                        </div>
                    </div>

                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="order-1 space-y-6 lg:order-2 lg:col-span-1">

                    {/* Member Announcements */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-gray-800">Member Announcements</h3>
                                <p className="text-xs text-gray-500">Publish updates to the member dashboard.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAnnouncementsModalOpen(true)}
                                className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        <form onSubmit={handlePublishAnnouncement} className="space-y-3 p-5">
                            <input
                                type="text"
                                required
                                maxLength={255}
                                placeholder="Announcement title"
                                value={announcementForm.title}
                                onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <select
                                value={announcementForm.category}
                                onChange={(event) => setAnnouncementForm({ ...announcementForm, category: event.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option>Facility Notice</option>
                                <option>Schedule</option>
                                <option>Membership</option>
                                <option>General</option>
                            </select>
                            <textarea
                                required
                                rows="3"
                                placeholder="Write an update for members..."
                                value={announcementForm.content}
                                onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })}
                                className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            {announcementError && <p role="alert" className="text-xs text-red-600">{announcementError}</p>}
                            <button type="submit" disabled={isPublishing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                <Send size={15} />
                                {isPublishing ? 'Publishing...' : 'Publish Announcement'}
                            </button>
                        </form>
                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                            {announcements.slice(0, 3).map((announcement) => (
                                <div key={announcement.id} className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{announcement.category || 'Announcement'}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="mt-1 text-sm font-semibold text-gray-800">{announcement.title}</h4>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAnnouncement(announcement)}
                                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                    >
                                        Read full announcement
                                    </button>
                                </div>
                            ))}
                            {announcements.length === 0 && <p className="p-5 text-sm text-gray-400">No announcements yet.</p>}
                        </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-400px">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <h3 className="font-bold text-gray-800">Recent Activity</h3>
                            <button 
                                onClick={() => setIsActivityModalOpen(true)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                            {safeActivity.length > 0 ? (
                                safeActivity.map((log) => {
                                    const logText = log.description || log.name || 'User Activity';
                                    const fallbackName = logText.split(' ').slice(0, 2).join(' ');

                                    return (
                                        <div key={log.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
                                            <img 
                                                src={log.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random&color=fff`} 
                                                alt="User" 
                                                className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" 
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 font-medium truncate">{logText}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} /> {formatTime(log.time)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
                            )}
                        </div>
                    </div>

                    {/* Membership Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-6">Membership Distribution</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={safeAnalytics.roles} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {safeAnalytics.roles.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Legend verticalAlign="bottom" height={36} iconType="square" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>

            <RecentActivityModal 
                isOpen={isActivityModalOpen} 
                onClose={() => setIsActivityModalOpen(false)} 
            />

            <BaseModal
                isOpen={isAnnouncementsModalOpen && !selectedAnnouncement}
                onClose={() => setIsAnnouncementsModalOpen(false)}
                title="All Announcements"
                maxWidth="max-w-2xl"
            >
                <div className="max-h-[70vh] overflow-y-auto">
                    {announcements.length > 0 ? announcements.map((announcement) => (
                        <article key={announcement.id} className="border-b border-gray-100 py-4 last:border-b-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                {announcement.category || 'Announcement'}
                            </span>
                            <h3 className="mt-0.5 text-xs font-bold text-gray-800">{announcement.title}</h3>
                            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                                {summarizeAnnouncement(announcement.content)}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedAnnouncement(announcement);
                                }}
                                className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                            >
                                Read announcement
                            </button>
                        </article>
                    )) : (
                        <p className="py-6 text-center text-sm text-gray-400">No announcements yet.</p>
                    )}
                </div>
            </BaseModal>

            <BaseModal
                isOpen={Boolean(selectedAnnouncement)}
                onClose={() => {
                    setSelectedAnnouncement(null);
                    setIsAnnouncementsModalOpen(false);
                }}
                title={selectedAnnouncement?.title || 'Announcement'}
                maxWidth="max-w-xl"
                headerAction={isAnnouncementsModalOpen && (
                    <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(null)}
                        aria-label="Back to all announcements"
                        title="Back to all announcements"
                        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
            >
                {selectedAnnouncement && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                {selectedAnnouncement.category || 'Announcement'}
                            </span>
                            {selectedAnnouncement.created_at && (
                                <time className="text-xs text-gray-400">
                                    {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                                </time>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
                            {selectedAnnouncement.content}
                        </p>
                    </div>
                )}
            </BaseModal>
        </div>
    );
};

export default Overview;