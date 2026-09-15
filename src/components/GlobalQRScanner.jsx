import { useState } from 'react';
import { QrCode, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import QRScannerModal from './Modals/QRScannerModal';

const GlobalQRScanner = () => {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const queryClient = useQueryClient();

    const checkInMutation = useMutation({
        mutationFn: async (qrPayload) => {
            const res = await api.post('/checkin/qr', { qrData: qrPayload });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['members']);
            queryClient.invalidateQueries(['allActivity']);
            queryClient.invalidateQueries(['memberStats']);
            
            toast.success(`Checked in: ${data.memberName}`, {
                icon: '✅',
                style: { borderRadius: '10px', background: '#fff', color: '#333' },
            });
            setIsScannerOpen(false);
        },
        onError: (error) => {
            const message = error.response?.data?.error || "Check-in Failed";
            toast.error(message);
            setIsScannerOpen(false);
        }
    });

    const handleScanSuccess = (decodedText) => {
        if (!checkInMutation.isPending) {
            checkInMutation.mutate(decodedText);
        }
    };

    return (
        <>
            <div className="fixed bottom-1 right-1 z-40 group">
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl whitespace-nowrap">
                    Scan Member ID
                </div>
                
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    disabled={checkInMutation.isPending}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-tr from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white focus:outline-none disabled:opacity-70 disabled:cursor-wait"
                >
                    <div className="flex items-center justify-center leading-none">
                        {checkInMutation.isPending ? (
                            <Loader2 size={28} className="animate-spin" />
                        ) : (
                            <QrCode size={28} className="group-hover:animate-pulse" />
                        )}
                    </div>
                </button>
            </div>

            <QRScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScanSuccess={handleScanSuccess} 
            />
        </>
    );
};

export default GlobalQRScanner;