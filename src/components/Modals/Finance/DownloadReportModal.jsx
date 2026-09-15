import { useState, useEffect } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const DownloadReportModal = ({ isOpen, onClose }) => {
    const [reportType, setReportType] = useState('month');
    const [referenceDate, setReferenceDate] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const iso = today.toISOString().split('T')[0];
            setReferenceDate(iso.slice(0, 7));
            setReportType('month');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTypeChange = (type) => {
        setReportType(type);
        const today = new Date().toISOString().split('T')[0];

        if (type === 'year') setReferenceDate(today.split('-')[0]);
        else if (type === 'month') setReferenceDate(today.slice(0, 7));
        else setReferenceDate(today);
    };

    const getInputConfig = () => {
        switch (reportType) {
            case 'year': 
                return { type: 'number', placeholder: 'YYYY', min: '2000', max: '2100' };
            case 'month': 
                return { type: 'month', placeholder: '', max: '9999-12' };
            default: 
                return { type: 'date', placeholder: '', max: '9999-12-31' };
        }
    };

    const getBackendDate = () => {
        if (reportType === 'year') return `${referenceDate}-01-01`;
        if (reportType === 'month') return `${referenceDate}-01`;
        return referenceDate;
    };

const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = [
        'Invoice ID', 
        'Ref No',
        'Member Name', 
        'Email', 
        'Phone', 
        'Membership Role', 
        'Amount', 
        'Payment Method', 
        'Status', 
        'Payment Date'
    ];

    const rows = data.map(row => [
        `INV-${String(row.id).padStart(3, '0')}`,
        `"${row.ref_no || 'N/A'}"`,
        `"${row.member_name || 'Deleted User'}"`,
        `"${row.member_email || 'N/A'}"`,
        `"${row.member_phone || 'N/A'}"`,
        `"${row.member_role || 'N/A'}"`,
        row.amount,
        row.payment_method,
        row.status,
        new Date(row.payment_date).toLocaleString()
    ]);

    return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
};

const handleDownload = async () => {
    if (!referenceDate) {
        toast.error("Please select a date.");
        return;
    }

    setIsDownloading(true);
    try {
        const dateToSend = getBackendDate();
        const res = await api.get('/reports/revenue', {
            params: { period: reportType, date: dateToSend }
        });

        if (res.data.length === 0) {
            toast.error(`No records found for this ${reportType}.`);
            setIsDownloading(false);
            return;
        }

        let finalFileName = `Revenue_${reportType}_${referenceDate}.csv`;
        if (reportType === 'week') {
            const end = new Date(referenceDate);
            const start = new Date(referenceDate);
            start.setDate(end.getDate() - 7);
            const fmt = (d) => d.toISOString().split('T')[0];
            finalFileName = `Revenue_Week_${fmt(start)}_to_${fmt(end)}.csv`;
        }

        const csvData = convertToCSV(res.data);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Downloaded!");
        onClose();
    } catch (error) {
        toast.error("Download failed.");
    } finally {
        setIsDownloading(false);
    }
};

    const inputConfig = getInputConfig();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Export Report</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Report Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['day', 'week', 'month', 'year'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    className={`cursor-pointer py-2 text-sm font-medium rounded-lg border capitalize transition-all ${
                                        reportType === type 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Reference Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type={inputConfig.type}
                                min={inputConfig.min}
                                max={inputConfig.max}
                                placeholder={inputConfig.placeholder}
                                value={referenceDate}
                                onChange={(e) => setReferenceDate(e.target.value)}
                                className="cursor-pointer w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            {reportType === 'week' 
                                ? "Select any day within the week you want to export." 
                                : `Select the ${reportType} you want to export.`}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t rounded-xl border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isDownloading ? 'Processing...' : <><Download size={16} /> Download CSV</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadReportModal;