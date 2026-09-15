import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
};

const RecentActivity = () => {
    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => {
            const response = await api.get('/activity');
            return response.data;
        },
        refetchInterval: 5000
    });

    return (
        <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            
            {isLoading ? (
                <div className="text-gray-400 text-sm">Loading activity...</div>
            ) : activities.length === 0 ? (
                <div className="text-gray-400 text-sm">No recent activity</div>
            ) : (
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {activities.map((activity, activityIdx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== activities.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                    ) : null}
                                    
                                    <div className="relative flex space-x-3">
                                        <img
                                            className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                                            src={activity.image}
                                            alt=""
                                            onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=User&background=random"; }}
                                        />
                                        
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium text-gray-900">{activity.name}</span>{' '}
                                                    {activity.action}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                <time>{timeAgo(activity.time)}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RecentActivity;