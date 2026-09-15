import React, { useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, CreditCard, ShieldCheck, HeartPulse, User, Download } from 'lucide-react';

const MemberViewModal = ({ isOpen, onClose, member }) => {

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !member) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDownloadQR = () => {
        if (!member.qr_code) return;
        
        const link = document.createElement('a');
        link.href = member.qr_code;
        link.download = `${member.first_name}_${member.last_name}_Gym_Pass.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <div className="min-h-screen px-4 flex items-center justify-center">
                
                <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden my-8">
                    
                    {/* LEFT PANEL: Digital ID Card */}
                    <div className="w-full md:w-1/3 bg-linear-to-b bg-slate-900 text-white p-6 flex flex-col items-center justify-center shrink-0 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full md:hidden transition-colors">
                            <X size={20} />
                        </button>
                        
                        <div className="w-32 h-32 rounded-full border-4 border-white/20 shadow-xl bg-white overflow-hidden flex items-center justify-center mb-4">
                            {member.image ? (
                                <img src={member.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-gray-300" />
                            )}
                        </div>
                        
                        <h3 className="text-2xl font-bold text-center leading-tight mb-1">
                            {member.first_name} {member.last_name}
                        </h3>
                        <p className="text-blue-200 text-sm font-mono tracking-widest mb-4">
                            ID: {member.unique_id ? `MBR-${member.unique_id}` : 'PENDING'}
                        </p>

                        <div className="flex gap-2 mb-8">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${member.status === 'Active' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'}`}>
                                {member.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/10 border border-white/20 flex items-center gap-1">
                                <ShieldCheck size={12} /> {member.role}
                            </span>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white p-3 rounded-xl shadow-inner flex flex-col items-center">
                            {member.qr_code ? (
                                <>
                                    <img src={member.qr_code} alt="QR" className="w-36 h-36" />
                                    <button 
                                        onClick={handleDownloadQR}
                                        className="mt-3 w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Download size={14} /> Download QR
                                    </button>
                                </>
                            ) : (
                                <div className="w-36 h-36 flex items-center justify-center bg-gray-100 text-gray-400 text-xs text-center border border-dashed border-gray-300 rounded-lg">No QR Generated</div>
                            )}
                        </div>
                        <p className="mt-3 text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em]">Scanner Access</p>
                    </div>

                    {/* RIGHT PANEL: Details Data */}
                    <div className="w-full md:w-2/3 p-6 md:p-8 bg-white relative">
                        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full hidden md:block transition-colors cursor-pointer">
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-gray-800 mb-5 border-b pb-3">Member Details</h2>

                        <div className="space-y-5">
                            
                            {/* Section: Personal Info */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Information</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Date of Birth</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(member.dob)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Gender</p>
                                        <p className="text-sm font-medium text-gray-900">{member.gender || 'Not Specified'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Contact Details */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Details</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <Phone className="text-blue-500 shrink-0" size={18} />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Mobile Number</p><p className="text-sm text-gray-900">{member.contact_number}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <Mail className="text-blue-500 shrink-0" size={18} />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Email Address</p><p className="text-sm text-gray-900">{member.email}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <MapPin className="text-blue-500 shrink-0" size={18} />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Home Address</p><p className="text-sm text-gray-900">{member.address || 'N/A'}</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Emergency Contact */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <HeartPulse size={14} className="text-red-500"/> Emergency Contact
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-[10px] text-red-400 font-bold uppercase">Contact Name</p>
                                        <p className="text-sm font-medium text-red-900">{member.emergency_contact_name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-[10px] text-red-400 font-bold uppercase">Phone Number</p>
                                        <p className="text-sm font-medium text-red-900">{member.emergency_contact_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Membership Timelines */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Membership Status</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <Calendar className="text-blue-500 shrink-0" size={16} />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Start Date</p><p className="text-sm text-gray-900 font-medium">{formatDate(member.joined)}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <CreditCard className="text-blue-500 shrink-0" size={16} />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Expiration Date</p><p className="text-sm text-gray-900 font-medium">{formatDate(member.end_date)}</p></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberViewModal;