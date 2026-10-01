import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Clock } from 'lucide-react';
import BaseModal from './BaseModal';

const RecentActivityModal = ({ isOpen, onClose }) => {
    const { data: activities = [], isLoading, isError } = useQuery({
        queryKey: ['allActivity'],
        queryFn: async () => {
            const res = await api.get('/activity?limit=all');
            return res.data;
        },
        enabled: isOpen 
    });

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', 
            hour: 'numeric', minute: '2-digit' 
        });
    };

    const getBadgeStyle = (action) => {
        switch (action) {
            case 'add':      return 'bg-green-100 text-green-700 border-green-200';
            case 'edit':     return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'delete':   return 'bg-red-100 text-red-700 border-red-200';
            case 'check-in': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'payment':  return 'bg-blue-100 text-blue-700 border-blue-200';
            default:         return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Activity Log" maxWidth="max-w-2xl">
            <div className="max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-400">Loading history...</div>
                    ) : isError ? (
                        <div role="alert" className="p-10 text-center text-red-600">Activity history could not be loaded.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {activities.length > 0 ? (
                                activities.map((log) => (
                                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                        <img src={log.image} alt="User" className="w-10 h-10 rounded-full border border-gray-200 object-cover mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 font-medium">{log.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(log.action)}`}>
                                                    {log.action || 'System'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={12} /> {formatTime(log.time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-400">No activity logs found.</div>
                            )}
                        </div>
                    )}
            </div>
        </BaseModal>
    );
};

export default RecentActivityModal;