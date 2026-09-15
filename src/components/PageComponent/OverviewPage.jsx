import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import StatsCard from "../../components/Cards/StatsCard";
import Skeleton from "../../components/Skeletons"; 
import RecentActivityModal from '../../components/Modals/RecentActivityModal';
import { 
    Users, UserCheck, AlertTriangle, UserPlus, 
    TrendingUp, AlertCircle, Activity, Clock, ArrowRight,
    Dumbbell, CheckCircle, Wrench
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

const Overview = () => {
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

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
                <div className="lg:col-span-2 space-y-8">
                    
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
                <div className="lg:col-span-1 space-y-6">
                    
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
        </div>
    );
};

export default Overview;