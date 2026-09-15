import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'; 
import StatsCard from "../../components/Cards/StatsCard"
import Skeleton from '../../components/Skeletons'
import { 
    Users, UserCheck, AlertTriangle, UserPlus, Search, 
    Edit, Trash2, ChevronLeft, ChevronRight, Phone
} from 'lucide-react'; 
import Button from '../../components/Button'
import AddMemberModal from "../../components/Modals/Member/AddMemberModal"
import EditMemberModal from "../../components/Modals/Member/EditMemberModal" 
import MemberViewModal from '../Modals/Member/MemberViewModal'
import ConfirmDeleteModal from "../../components/Modals/Member/ConfirmDeleteModal"

const MembersList = () => {
    const queryClient = useQueryClient()
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [memberToEdit, setMemberToEdit] = useState(null)
    
    const [searchTerm, setSearchTerm] = useState('')
    const [activeSearch, setActiveSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [viewMember, setViewMember] = useState(null);

    const { data, isFetching, error } = useQuery({
        queryKey: ['members', currentPage, activeSearch],
        queryFn: async () => {
            const res = await api.get('/members', {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: activeSearch
                }
            });
            return res.data;
        },
        keepPreviousData: true,
        refetchOnWindowFocus: false
    });

    const members = data?.data || [];
    const totalPages = data?.pagination?.totalPages || 1;
    const totalItems = data?.pagination?.total || 0;

    const { data: stats = { total: 0, active: 0, expiring: 0, newToday: 0 } } = useQuery({
        queryKey: ['memberStats'],
        queryFn: async () => (await api.get('/member-stats')).data,
        refetchOnWindowFocus: false
    });

    const addMemberMutation = useMutation({
        mutationFn: async (formData) => await api.post('/members', formData),
        onSuccess: () => { queryClient.invalidateQueries(['members']); queryClient.invalidateQueries(['memberStats']); setIsAddModalOpen(false); toast.success("Member Added!") },
        onError: () => toast.error("Failed to add member.")
    });

    const editMemberMutation = useMutation({
        mutationFn: async (formData) => await api.put(`/members/${memberToEdit.id}`, formData),
        onSuccess: () => { queryClient.invalidateQueries(['members']); queryClient.invalidateQueries(['memberStats']); setIsEditModalOpen(false); setMemberToEdit(null); toast.success("Member Updated!") },
        onError: () => toast.error("Failed to update member.")
    });

    const deleteMemberMutation = useMutation({
        mutationFn: async (id) => await api.delete(`/members/${id}`),
        onSuccess: () => { queryClient.invalidateQueries(['members']); queryClient.invalidateQueries(['memberStats']); toast.success("Member Deleted") },
        onError: () => toast.error("Failed to delete member.")
    });

    const handleDeleteClick = (id) => { setMemberToDelete(id); setIsDeleteModalOpen(true); };
    const confirmDelete = () => { if (memberToDelete) deleteMemberMutation.mutate(memberToDelete, { onSuccess: () => { setIsDeleteModalOpen(false); setMemberToDelete(null) } }); };
    const handleEditClick = (person) => { setMemberToEdit(person); setIsEditModalOpen(true); };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const getPaginationRange = (current, total) => {
        if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, '...', total];
        if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setActiveSearch(searchTerm);
            setCurrentPage(1);
        }
    };

    const getMemberStatus = (member) => {
        if (member.status === 'Inactive' || member.status === 'Pending') return member.status;
        
        const endDate = new Date(member.end_date);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
            return 'Expiring Soon';
        }
        
        return 'Active';
    };

    const getStatusBadge = (status) => {
        const styles = { 
            Active: "bg-green-100 text-green-800", 
            Inactive: "bg-red-100 text-red-800", 
            "Expiring Soon": "bg-orange-100 text-orange-800", 
            Pending: "bg-yellow-100 text-yellow-800" 
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || styles.Inactive}`}>{status}</span>;
    };

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";

    if (error) return <div className='p-6 text-red-500'>Database Error</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard title="Total Members" value={stats.total} sub="All time" icon={Users} theme="blue" />
                <StatsCard title="Active Members" value={stats.active} sub="Currently active" icon={UserCheck} theme="green" />
                <StatsCard title="Expiring Soon" value={stats.expiring} sub="Next 7 Days" icon={AlertTriangle} theme="red" />
                <StatsCard title="New Today" value={stats.newToday} sub="Joined today" icon={UserPlus} theme="purple" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search members... (Press Enter)" 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <Button func={() => setIsAddModalOpen(true)}>
                    <UserPlus className="h-5 w-5 mr-2" /> Add Member
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isFetching ? (
                                [...Array(itemsPerPage)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : members.length > 0 ? (
                                members.map((person) => (
                                    <tr key={person.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setViewMember(person)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="shrink-0 h-10 w-10">
                                                    <img 
                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                                                        src={person.image || `https://ui-avatars.com/api/?name=${encodeURIComponent((person.first_name || '') + ' ' + (person.last_name || ''))}&background=random&color=fff`} 
                                                        alt={`${person.first_name} ${person.last_name}`}
                                                        onError={(e) => { 
                                                            e.target.onerror = null; 
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((person.first_name || '') + ' ' + (person.last_name || ''))}&background=random&color=fff`;
                                                        }} 
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {person.first_name} {person.last_name}
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-500">{person.email}</div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 font-medium">
                                                        {person.contact_number ? (
                                                            <>
                                                                <Phone size={10} />
                                                                {person.contact_number}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-300 italic text-[10px]">No contact</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{person.role}</div></td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(getMemberStatus(person))}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(person.joined)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-medium">{formatDate(person.end_date)}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditClick(person); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer" title="Edit"><Edit size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(person.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer" title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No members found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> 
                                    <span className="text-gray-400 ml-2">({totalItems} total results)</span>
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

            <AddMemberModal key={isAddModalOpen ? "open" : "closed"} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={(data) => addMemberMutation.mutate(data)} isSaving={addMemberMutation.isPending}/>
            <EditMemberModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={(data) => editMemberMutation.mutate(data)} isSaving={editMemberMutation.isPending} memberData={memberToEdit} />
            <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} isDeleting={deleteMemberMutation.isPending} />
            <MemberViewModal isOpen={!!viewMember} onClose={() => setViewMember(null)} member={viewMember} />
        </div>
    )
}

export default MembersList