// src/pages/member/MemberVisits.jsx
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Skeleton from '../Skeletons';
import api from '../../lib/api';

export default function MemberVisits() {
    const qrRef = useRef(null);
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [visits, setVisits] = useState([]);
    const [stats, setStats] = useState({ totalVisits: 0, monthlyVisits: 0, previousMonthlyVisits: 0, averageMinutes: null });
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(null);
    const [attendanceAvailable, setAttendanceAvailable] = useState(true);

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                const [profileResponse, visitsResponse] = await Promise.all([
                    api.get('/portal/profile'),
                    api.get('/portal/visits')
                ]);
                setMember(profileResponse.data?.data || null);
                setVisits(visitsResponse.data?.data?.visits || []);
                setStats(visitsResponse.data?.data?.stats || { totalVisits: 0, monthlyVisits: 0, previousMonthlyVisits: 0, averageMinutes: null });
                setAttendanceAvailable(visitsResponse.data?.data?.attendanceAvailable !== false);
                setCurrentTime(Date.now());
            } catch (err) {
                console.error('Failed to load attendance data:', err);
                setError(err.response?.data?.message || 'Attendance data could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchMemberData();
    }, []);

    const handleDownloadQR = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${member?.unique_id || 'member'}_QR_Pass.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    const qrValue = member?.unique_id ? `GAMS-MBR-${member.unique_id}` : '';
    const status = member?.status || 'Unavailable';
    const isMembershipActive = status.toLowerCase() === 'active';
    const currentVisit = currentTime
        ? visits.find((visit) => !visit.check_out_time && new Date(visit.check_in_time).toDateString() === new Date(currentTime).toDateString())
        : null;
    const filteredVisits = visits.filter((visit) => {
        if (filterPeriod === 'all') return true;
        const visitDate = new Date(visit.check_in_time);
        const reference = new Date(currentTime || 0);
        if (filterPeriod === 'last_month') reference.setMonth(reference.getMonth() - 1);
        return visitDate.getMonth() === reference.getMonth() && visitDate.getFullYear() === reference.getFullYear();
    });
    const formatDuration = (minutes) => {
        if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) return 'In progress';
        const totalMinutes = Number(minutes);
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
    };
    const averageDuration = stats.averageMinutes == null ? 'N/A' : formatDuration(stats.averageMinutes);

    if (loading) {
        return (
            <div role="status" aria-label="Loading attendance history" aria-busy="true" className="mx-auto max-w-6xl space-y-6">
                <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Skeleton className="h-96 w-full rounded-xl" />
                    <div className="space-y-6 lg:col-span-2">
                        <Skeleton className="h-52 w-full rounded-xl" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}</div>
                    </div>
                </div>
                <Skeleton className="h-80 w-full rounded-xl" />
            </div>
        );
    }

    return (
            <div className="max-w-6xl mx-auto space-y-6">
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {!attendanceAvailable && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Attendance storage is not installed. Apply backend/member-portal-schema.sql to enable check-in history.</div>}

                {/* Header Description */}
                <div>
                        <h2 className="text-xl font-extrabold text-[#041a5f]">
                            Facility Access & History
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Access your digital entry QR pass and review your attendance records.
                    </p>
                </div>

                {/* Top Section: QR Pass Card & Current Facility Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Digital Entry Pass (QR Code) */}
                    <div className="bg-[#061539] rounded-2xl p-6 sm:p-7 text-white flex flex-col justify-between items-center shadow-md">
                        <div className="w-full flex justify-between items-center pb-4 border-b border-blue-950/70">
                            <div>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Digital Entry Pass</span>
                                <h3 className="text-base font-extrabold text-white">QR Pass</h3>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${isMembershipActive ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'}`}>
                                {status}
                            </span>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white rounded-xl p-4 shadow-xl my-5 flex flex-col items-center">
                            <div ref={qrRef} className="p-1">
                                <QRCodeSVG includeMargin={false} level="H" size={160} value={qrValue} />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
                                Member ID: {member?.unique_id || 'Unavailable'}
                            </span>
                        </div>

                        <div className="w-full space-y-2">
                            <button
                                onClick={handleDownloadQR}
                                disabled={!member?.unique_id}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download QR Pass
                            </button>
                            <p className="text-[10px] text-blue-300 text-center tracking-wider uppercase font-semibold">
                                Scan at a gym terminal for admission
                            </p>
                        </div>
                    </div>

                    {/* Real-Time Check-In Status & Attendance Metrics (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                        
                        {/* Live Status Widget */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Current Check-In Status
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`w-2.5 h-2.5 rounded-full ${currentVisit ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                                        <h3 className="text-lg sm:text-xl font-extrabold text-[#041a5f]">
                                            {!attendanceAvailable ? 'Attendance Unavailable' : currentVisit ? 'Currently Inside Facility' : 'Not Currently Checked In'}
                                        </h3>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
                                    {!attendanceAvailable ? 'Not configured' : currentVisit ? new Date(currentVisit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No active session'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 block">Terminal Scanned</span>
                                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{!attendanceAvailable ? 'Not configured' : currentVisit?.terminal || 'No active session'}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 block">Current Session Time</span>
                                    <span className="text-xs font-bold text-blue-600 mt-0.5 block">
                                        {!attendanceAvailable ? 'Not configured' : currentVisit && currentTime ? formatDuration(Math.floor((currentTime - new Date(currentVisit.check_in_time).getTime()) / 60000)) : 'No active session'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 block">Verification Method</span>
                                    <span className="text-xs font-bold text-slate-600 mt-0.5 block">{!attendanceAvailable ? 'Not configured' : currentVisit?.method || 'No active session'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metric Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Visits (Month)</span>
                                <div className="text-2xl font-black text-[#01358a] mt-1">{attendanceAvailable ? `${stats.monthlyVisits || 0} Sessions` : '—'}</div>
                                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                                    {attendanceAvailable ? `${Number(stats.monthlyVisits || 0) - Number(stats.previousMonthlyVisits || 0)} vs last month` : 'Not configured'}
                                </span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Lifetime Check-Ins</span>
                                <div className="text-2xl font-black text-[#041a5f] mt-1">{attendanceAvailable ? `${stats.totalVisits || 0} Visits` : '—'}</div>
                                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Since member enrollment</span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Average Duration</span>
                                <div className="text-2xl font-black text-[#0078d7] mt-1">{attendanceAvailable && averageDuration !== 'N/A' ? averageDuration : '—'}</div>
                                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Per workout routine</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Complete Visit & Check-In History Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                        <div>
                            <h3 className="text-base font-extrabold text-[#041a5f]">Complete Visit History</h3>
                            <p className="text-xs text-slate-400">Attendance records linked to your member account</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                            {['all', 'this_month', 'last_month'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setFilterPeriod(period)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                                        filterPeriod === period
                                            ? 'bg-white text-[#01358a] shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {period === 'all' ? 'All Visits' : period === 'this_month' ? 'This Month' : 'Last Month'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-3">Session ID</th>
                                    <th className="py-3 px-3">Date</th>
                                    <th className="py-3 px-3">Time In</th>
                                    <th className="py-3 px-3">Time Out</th>
                                    <th className="py-3 px-3">Duration</th>
                                    <th className="py-3 px-3">Terminal Gate</th>
                                    <th className="py-3 px-3">Method</th>
                                    <th className="py-3 px-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredVisits.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3.5 px-3 font-mono font-bold text-[#01358a]">{entry.id}</td>
                                        <td className="py-3.5 px-3 font-medium text-slate-700">{new Date(entry.check_in_time).toLocaleDateString()}</td>
                                        <td className="py-3.5 px-3 font-semibold text-slate-800">{new Date(entry.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="py-3.5 px-3 text-slate-500">{entry.check_out_time ? new Date(entry.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                        <td className="py-3.5 px-3 font-medium text-slate-700">{formatDuration(entry.check_out_time ? (new Date(entry.check_out_time) - new Date(entry.check_in_time)) / 60000 : null)}</td>
                                        <td className="py-3.5 px-3 text-slate-600">{entry.terminal || '—'}</td>
                                        <td className="py-3.5 px-3">
                                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                                {entry.method || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-right">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                {entry.status || 'Recorded'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVisits.length === 0 && <tr><td colSpan="8" className="py-6 text-center text-slate-500">{attendanceAvailable ? 'No attendance records for this period.' : 'Attendance storage is not configured.'}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
    );
}