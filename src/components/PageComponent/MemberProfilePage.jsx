// src/pages/member/MemberProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Settings2, UserRound, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import Skeleton from '../Skeletons';
import api from '../../lib/api';

export default function MemberProfile() {
    const navigate = useNavigate();
    const qrRef = useRef(null);
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Token-isolated retrieval from backend
                const response = await api.get('/portal/profile');
                if (response.data?.success) {
                    setMember(response.data.data);
                }
            } catch (err) {
                console.error('API /portal/profile failed:', err);
                setError(err.response?.data?.message || 'Member profile could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
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
            downloadLink.download = `${member?.unique_id || 'member'}_QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    if (loading) {
        return (
            <div role="status" aria-label="Loading member profile" aria-busy="true" className="grid w-full grid-cols-1 items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <Skeleton className="h-130 w-full rounded-xl bg-slate-800" />
                <div className="space-y-5">
                    <div className="space-y-2 border-b border-slate-200 pb-4"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div>
                    {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 w-full rounded-lg" />)}
                </div>
            </div>
        );
    }

    const qrValue = member?.unique_id ? `GAMS-MBR-${member.unique_id}` : '';
    const fullName = member?.first_name 
        ? `${member.first_name} ${member.last_name || ''}`.trim() 
        : 'Name unavailable';
    const status = member?.status || 'Unavailable';
    const isMembershipActive = status.toLowerCase() === 'active';
    const membershipTier = member?.role 
        ? `${member.role.charAt(0).toUpperCase() + member.role.slice(1)} Member` 
        : 'Membership unavailable';

    if (!member) return <div role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Member profile could not be loaded.'}</div>;

    return (
        <div className="grid w-full grid-cols-1 items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* Digital access pass and member identity */}
            <aside className="flex h-full flex-col items-center rounded-xl bg-[#061539] p-6 text-white shadow-sm sm:p-8">
                <div className="w-full flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-blue-300 bg-slate-800 ring-4 ring-blue-400/15">
                            {member?.image ? (
                                <img src={member.image} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-900 text-blue-200 font-bold text-2xl">
                                    {fullName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">Member Profile</span>
                    <h2 className="mt-2 text-xl font-bold text-white text-center leading-snug">{fullName}</h2>
                    <span className="mt-1 text-xs font-medium text-blue-200">
                        Member ID {member.unique_id || 'Unavailable'}
                    </span>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${isMembershipActive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border-rose-500/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isMembershipActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            {status}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30">
                            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            {membershipTier}
                        </span>
                    </div>

                    <div className="mt-7 w-full rounded-xl bg-white p-4 text-slate-800 shadow-lg">
                        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Digital Access Pass</span>
                            <span className="text-[10px] font-semibold text-blue-700">QR</span>
                        </div>
                        <div className="flex justify-center">
                        <div ref={qrRef} className="p-1">
                            <QRCodeSVG includeMargin={false} level="H" size={145} value={qrValue} />
                        </div>
                        </div>

                        <button
                            onClick={handleDownloadQR}
                            disabled={!member.unique_id}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-[#01358a] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={15} aria-hidden="true" />
                            Download pass
                        </button>
                    </div>
                </div>

                <p className="mt-5 text-center text-xs text-blue-200">Present this pass at the gym entrance.</p>
            </aside>

            <div className="min-w-0 space-y-5 text-slate-800">
                    
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-xl font-extrabold text-[#041a5f]">Profile details</h1>
                            <p className="mt-1 text-sm text-slate-500">Personal, contact, and membership information.</p>
                        </div>

                        <button 
                            onClick={() => navigate('/member/settings')}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                        >
                            <Settings2 size={16} aria-hidden="true" />
                            Account settings
                        </button>
                    </div>

                    <div className="space-y-6">

                        {/* 1. Personal Information */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <UserRound size={16} className="text-[#01358a]" aria-hidden="true" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[#01358a]">
                                    Personal Information
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                                        <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Date of Birth</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.dob ? new Date(member.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Gender</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.gender || 'Unavailable'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* 2. Contact Details */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Phone size={16} className="text-[#01358a]" aria-hidden="true" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[#01358a]">
                                    Contact Details
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Mobile Number</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.contact_number || 'Unavailable'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Email Address</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5 break-all">
                                        {member?.email || 'Unavailable'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3 sm:col-span-2">
                                    <span className="block text-[11px] font-semibold text-slate-400">Home Address</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.address || 'Unavailable'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* 3. Membership Details */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard size={16} className="text-[#01358a]" aria-hidden="true" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[#01358a]">
                                    Membership Details
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Membership Type</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {membershipTier}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Start Date</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.start_date ? new Date(member.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Expiration Date</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.end_date ? new Date(member.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Status</span>
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-0.5 ${isMembershipActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isMembershipActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                        {status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* 4. Emergency Contact */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={16} className="text-[#01358a]" aria-hidden="true" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[#01358a]">
                                    Emergency Contact
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Contact Name</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.emergency_contact_name || 'N/A'}
                                    </span>
                                </div>
                                <div className="border-b border-slate-100 py-3">
                                    <span className="block text-[11px] font-semibold text-slate-400">Phone Number</span>
                                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                        {member?.emergency_contact_phone || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </section>

                    </div>
            </div>
        </div>
    );
}