import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Dumbbell, Wrench, AlertCircle, CheckCircle, Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import StatsCard from '../Cards/StatsCard';
import Button from '../Button';
import Skeleton from '../Skeletons'; 
import AddEquipmentModal from '../Modals/Equipment/AddEquipmentModal';
import EditEquipmentModal from '../Modals/Equipment/EditEquipmentModal';
import ConfirmDeleteModal from '../Modals/Equipment/ConfirmDeleteModal'; 

const EquipmentPage = () => {
    const queryClient = useQueryClient();
    
    const [search, setSearch] = useState('');
    const [activeSearch, setActiveSearch] = useState(''); 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data: equipment = [], isLoading, isFetching } = useQuery({ 
        queryKey: ['equipment'], 
        queryFn: async () => (await api.get('/equipment')).data,
        refetchOnWindowFocus: false
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/equipment', data),
        onSuccess: () => { 
            queryClient.invalidateQueries(['equipment']); 
            setIsAddModalOpen(false); 
            toast.success("Equipment registered successfully!"); 
        }
    });

    const editMutation = useMutation({
        mutationFn: (data) => api.put(`/equipment/${editingItem.id}`, data),
        onSuccess: () => { 
            queryClient.invalidateQueries(['equipment']); 
            setIsEditModalOpen(false); 
            setEditingItem(null); 
            toast.success("Changes saved!"); 
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/equipment/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['equipment']);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            toast.success("Equipment deleted");
        }
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setActiveSearch(search);
            setCurrentPage(1);
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
        }
    };

    const getConditionBadge = (condition) => {
        if (['Excellent', 'Good'].includes(condition)) return "bg-green-100 text-green-800";
        if (condition === 'Fair') return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800"; 
    };

    const stats = {
        total: equipment.length,
        excellent: equipment.filter(e => e.equipment_condition === 'Excellent').length,
        attention: equipment.filter(e => ['Poor', 'Damaged'].includes(e.equipment_condition)).length,
        value: equipment.reduce((sum, item) => sum + (parseFloat(item.asset_value) || 0), 0)
    };

    const filteredEquipment = equipment.filter(e => 
        e.name.toLowerCase().includes(activeSearch.toLowerCase()) || 
        e.serial_code.toLowerCase().includes(activeSearch.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEquipment = filteredEquipment.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getPaginationRange = (current, total) => {
        if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, '...', total];
        if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    if (isLoading && !equipment.length) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-32">
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-32" />)}
                    </div>
                    <div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 border-b border-gray-50">
                                <Skeleton className="h-10 w-10 rounded-lg mr-2" />
                                <Skeleton className="h-4 w-32 flex-1" />
                                <Skeleton className="h-4 w-24 flex-1" />
                                <Skeleton className="h-4 w-24 flex-1" />
                                <Skeleton className="h-6 w-20 flex-1 rounded-full" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard title="Total Items" value={stats.total} theme="blue" icon={Dumbbell} />
                <StatsCard title="Top Condition" value={stats.excellent} theme="green" icon={CheckCircle} />
                <StatsCard title="Needs Attention" value={stats.attention} theme="orange" icon={Wrench} />
                <StatsCard title="Total Asset Value" value={`₱${stats.value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} theme="purple" icon={AlertCircle} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search equipment... (Press Enter)" 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <Button func={() => setIsAddModalOpen(true)}>
                    <Plus size={18} /> Add Equipment
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial Code</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Value</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Condition</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isFetching ? (
                                [...Array(itemsPerPage)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Skeleton className="h-10 w-10 rounded-lg mr-4" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : currentEquipment.length > 0 ? (
                                currentEquipment.map(item => (
                                    <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="shrink-0 h-10 w-10">
                                                    {item.image ? (
                                                        <img className="h-10 w-10 rounded-lg object-cover border border-gray-200" src={item.image} alt={item.name} />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <Dumbbell size={16} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 text-sm font-medium text-gray-900">{item.name}</div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{item.serial_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{parseFloat(item.asset_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getConditionBadge(item.equipment_condition)}`}>
                                                {item.equipment_condition}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer" title="Edit"><Edit size={18} /></button>
                                                <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer" title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No equipment found.</td></tr>
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
                                    <span className="text-gray-400 ml-2">({filteredEquipment.length} total results)</span>
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

            <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={(data) => addMutation.mutate(data)} isSaving={addMutation.isPending} />
            <EditEquipmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={(data) => editMutation.mutate(data)} isSaving={editMutation.isPending} initialData={editingItem} />
            <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} isDeleting={deleteMutation.isPending} title="Delete Equipment?" message="Are you sure you want to remove this equipment from the inventory? This action cannot be undone." />
        </div>
    );
};

export default EquipmentPage;