import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';


        const scanner = new Html5QrcodeScanner("qr-reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0]
        });

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
            }
        );

        return () => {
            document.body.style.overflow = 'unset';
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Scan Member ID</h3>
                        <p className="text-xs text-gray-500">Position the QR code inside the box</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300"></div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button onClick={onClose} className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                        Cancel Scanning
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;