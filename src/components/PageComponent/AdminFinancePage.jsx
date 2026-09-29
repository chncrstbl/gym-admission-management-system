import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import DownloadReportModal from '../../components/Modals/Finance/DownloadReportModal';
import StatsCard from '../../components/Cards/StatsCard'; 
import Skeleton from '../Skeletons';
import toast from 'react-hot-toast';
import { 
    Download, CheckCircle, Clock, AlertCircle, XCircle, Search, 
    TrendingUp, Activity, ChevronLeft, ChevronRight 
} from 'lucide-react';
import Button from '../../components/Button';

const FinancePage = () => {
    const queryClient = useQueryClient();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false); 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7; 

    const { data: payments = [], isLoading, isFetching, isError } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await api.get('/payments');
            return res.data;
        },
        refetchOnWindowFocus: false
    });

    const { data: stats = [], isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const res = await api.get('/stats');
            return res.data;
        },
        refetchOnWindowFocus: false
    });

    const revenueStat = stats.find(s => s.title === "Total Revenue") || { value: 0, subValue: "0%", isPositive: true };
    const outstandingStat = stats.find(s => s.title === "Outstanding Invoices") || { value: 0, subValue: "0 Invoices overdue" };
    const memberStat = stats.find(s => s.title === "Active Members") || { value: 0, subValue: "+0 this month" };

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.put(`/payments/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            queryClient.invalidateQueries(['recentActivity']);
            queryClient.invalidateQueries(['dashboardStats']);
            toast.success("Status updated!");
        },
        onError: () => toast.error("Failed to update status")
    });

    const handleBulkAction = async (status) => {
        if (selectedIds.length === 0) return;
        try {
            const promises = selectedIds.map(id => statusMutation.mutateAsync({ id, status }));
            await Promise.all(promises);
            setSelectedIds([]); 
        } catch (error) {
            console.error("Bulk Action Failed:", error);
        }
    };

    const formatPeso = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setActiveSearch(searchTerm);
            setCurrentPage(1);
        }
    };

    const filteredPayments = payments.filter(payment => 
        (payment.member_name || "Unknown").toLowerCase().includes(activeSearch.toLowerCase()) ||
        String(payment.id).includes(activeSearch)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getPaginationRange = (current, total) => {
        if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, '...', total];
        if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredPayments.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            Paid: "bg-green-100 text-green-700",
            Completed: "bg-green-100 text-green-700",
            Pending: "bg-yellow-100 text-yellow-700",
            Overdue: "bg-red-100 text-red-700",
            Void: "bg-gray-200 text-gray-500 line-through decoration-gray-400",
            Unsuccessful: "bg-gray-100 text-gray-500 line-through" 
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
    };

    if ((isLoading && !payments.length) || (isLoadingStats && !stats.length)) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen space-y-6">
                <div className="flex justify-end items-center mb-4">
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-32">
                            <Skeleton className="h-4 w-24 mb-4" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between h-20">
                        <Skeleton className="h-10 w-full sm:w-72" />
                    </div>
                    <div className="p-0">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="p-4 border-b border-gray-50 flex items-center gap-4">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-20" />
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-end items-center mb-8 gap-3">
                <Button func={() => setIsReportModalOpen(true)}> 
                    <Download size={16} /> Download Report
                </Button>
                <DownloadReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard title="Total Revenue (YTD)" value={formatPeso(revenueStat.value)} sub={revenueStat.subValue} icon={TrendingUp} theme={revenueStat.isPositive ? 'green' : 'red'} />
                <StatsCard title="Outstanding Invoices" value={formatPeso(outstandingStat.value)} sub={outstandingStat.subValue} icon={AlertCircle} theme="red" />
                <StatsCard title="Active Subscriptions" value={memberStat.value} sub={memberStat.subValue} icon={Activity} theme="blue" />
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-4">Recent Transactions</h3>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 h-20 transition-all">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search invoice or name... (Press Enter)" 
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-fade-in-right">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mr-2">
                                    {selectedIds.length} Selected
                                </span>
                                <button onClick={() => handleBulkAction('Paid')} className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition border border-green-200 cursor-pointer" title="Mark Paid"><CheckCircle size={18} /></button>
                                <button onClick={() => handleBulkAction('Pending')} className="p-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition border border-yellow-200 cursor-pointer" title="Mark Pending"><Clock size={18} /></button>
                                <button onClick={() => handleBulkAction('Overdue')} className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition border border-red-200 cursor-pointer" title="Mark Overdue"><AlertCircle size={18} /></button>
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                <button onClick={() => handleBulkAction('Unsuccessful')} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition border border-gray-200 cursor-pointer" title="Mark Unsuccessful"><XCircle size={18} /></button>
                                <button onClick={() => setSelectedIds([])} className="ml-2 text-sm text-gray-400 hover:text-gray-600 underline decoration-dotted cursor-pointer">Cancel</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === filteredPayments.length && filteredPayments.length > 0}
                                        disabled={isFetching}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Invoice ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isFetching ? (
                                [...Array(itemsPerPage)].map((_, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    </tr>
                                ))
                            ) : isError ? (
                                <tr><td colSpan="7" className="p-8 text-center text-red-500">Error loading data.</td></tr>
                            ) : currentPayments.length === 0 ? (
                                <tr><td colSpan="7" className="p-12 text-center text-gray-400">No transactions found.</td></tr>
                            ) : currentPayments.map((p) => (
                                <tr 
                                    key={p.id} 
                                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(p.id) ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => handleSelectRow(p.id)}
                                >
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer" checked={selectedIds.includes(p.id)} readOnly />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600 tracking-wider">
                                        {p.ref_no || `INV-${String(p.id).padStart(3, '0')}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {p.member_name ? p.member_name.charAt(0) : "?"}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{p.member_name || "Deleted User"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.payment_date)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatPeso(p.amount)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.payment_method || "Cash"}</td>
                                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || isFetching} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">Previous</button>
                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || isFetching} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">Next</button>
                        </div>

                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</span> of <span className="font-medium">{filteredPayments.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1 || isFetching}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft size={16} strokeWidth={2.5} />
                                    </button>
                                    
                                    {getPaginationRange(currentPage, totalPages).map((page, index) => (
                                        page === '...' ? (
                                            <span 
                                                key={`ellipsis-${index}`} 
                                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-500 ring-1 ring-inset ring-gray-300 bg-gray-50/50"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button 
                                                key={page} 
                                                onClick={() => paginate(page)}
                                                disabled={isFetching}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 cursor-pointer disabled:opacity-50 transition-colors ${
                                                    currentPage === page 
                                                        ? 'z-10 bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500 focus-visible:outline focus-visible:outline-offset-2' 
                                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages || isFetching}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight size={16} strokeWidth={2.5} />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancePage;