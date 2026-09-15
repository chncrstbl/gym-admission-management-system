import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { X, Loader, Check } from 'lucide-react';

const PRICING = {
    'Standard': 50,
    'Half Month': 500,
    'Monthly': 1000
};

const AddTransactionModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    
    const [formData, setFormData] = useState({
        memberId: '',
        amount: PRICING['Standard'],
        method: 'Cash',
        plan: 'Standard'
    });

    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/members');
            return res.data; 
        },
        enabled: isOpen
    });

    const createPaymentMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/payments', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            queryClient.invalidateQueries(['dashboardStats']);
            queryClient.invalidateQueries(['recentActivity']);
            queryClient.invalidateQueries(['members']);
            
            toast.success("Payment recorded!");
            setFormData({ 
                memberId: '', 
                amount: PRICING['Standard'], 
                method: 'Cash', 
                plan: 'Standard' 
            }); 
            onClose();
        },
        onError: () => {
            toast.error("Failed to record transaction.");
        }
    });

    const handlePlanChange = (e) => {
        const selectedPlan = e.target.value;
        setFormData({
            ...formData,
            plan: selectedPlan,
            amount: PRICING[selectedPlan]
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.memberId) return toast.error("Please select a member");
        
        createPaymentMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">New Transaction</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* 1. MEMBER SELECT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                            value={formData.memberId}
                            onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                            required
                        >
                            <option value="">-- Choose a Member --</option>
                            {loadingMembers ? (
                                <option disabled>Loading members...</option>
                            ) : members.length > 0 ? (
                                members.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} — {member.status}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No members found</option>
                            )}
                        </select>
                    </div>

                    {/* 2. PLAN SELECTION */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Membership Plan</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Standard', 'Half Month', 'Monthly'].map((plan) => (
                                <button
                                    type="button"
                                    key={plan}
                                    onClick={() => handlePlanChange({ target: { value: plan } })}
                                    className={`px-2 py-3 rounded-lg text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer
                                        ${formData.plan === plan 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    <span>{plan}</span>
                                    <span className={`text-xs ${formData.plan === plan ? 'text-blue-200' : 'text-gray-400'}`}>
                                        ₱{PRICING[plan]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <input type="hidden" value={formData.amount} />
                    </div>

                    {/* 3. PAYMENT METHOD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.method}
                            onChange={(e) => setFormData({...formData, method: e.target.value})}
                        >
                            <option value="Cash">Cash</option>
                            <option value="GCash">GCash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                        </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                        <span className="text-sm text-gray-500 font-medium">Total to Pay:</span>
                        <span className="text-xl font-bold text-gray-900">₱{formData.amount.toLocaleString()}</span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={createPaymentMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 mt-2 cursor-pointer"
                    >
                        {createPaymentMutation.isPending ? (
                            <> <Loader className="animate-spin" size={18} /> Processing... </>
                        ) : (
                            <> <Check size={18} /> Confirm Payment </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;