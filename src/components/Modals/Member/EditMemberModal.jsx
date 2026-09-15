import React, { useState, useEffect } from 'react';
import { Phone, X, User, Mail, CheckCircle, MapPin, Upload, HeartPulse, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import usePaymentPortal from '../../../hooks/PaymentPortal';

const compressImage = (file, maxWidth = 400, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
        reader.onerror = (err) => reject(err);
    });
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch {
        return '';
    }
};

const EditMemberModal = ({ isOpen, onClose, onSubmit, isSaving, memberData }) => {
    const openPaymentPortal = usePaymentPortal(); 
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        email: '',
        contactNumber: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        role: 'Standard',
        image: '',
        status: 'Active',
        recordPayment: false,
        paymentMethod: 'GCash'
    });

    useEffect(() => {
        if (memberData && isOpen) {
            setFormData({
                firstName: memberData.first_name || '',
                lastName: memberData.last_name || '',
                dob: formatDateForInput(memberData.dob),
                gender: memberData.gender || '',
                email: memberData.email || '',
                contactNumber: memberData.contact_number || '',
                address: memberData.address || '',
                emergencyContactName: memberData.emergency_contact_name || '',
                emergencyContactPhone: memberData.emergency_contact_phone || '',
                role: memberData.role || 'Standard',
                status: memberData.status || 'Active',
                image: memberData.image || '',
                recordPayment: false,
                paymentMethod: 'GCash'
            });
            setImagePreview(memberData.image || null);
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [memberData, isOpen]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 400, 0.7);
                setFormData({ ...formData, image: compressedBase64 });
                setImagePreview(compressedBase64);
            } catch (error) {
                toast.error("Failed to process your image update.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let dataToSubmit = { ...formData };

        if (formData.recordPayment) {
            await openPaymentPortal(formData.paymentMethod);
            dataToSubmit.status = 'Active'; 
        }

        onSubmit(dataToSubmit);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Edit Member Profile</h2>
                        <p className="text-sm text-gray-500">Update details for {memberData?.first_name} {memberData?.last_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 mb-2 rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden bg-gray-100 group">
                            {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                <Upload size={24} className="mb-1" />
                                <span className="text-[10px] font-bold tracking-wider">CHANGE</span>
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    {/* Personal Info Grid */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">First Name</label>
                                <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                                <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Date of Birth</label>
                                <input 
                                    type="date" 
                                    max="9999-12-31"
                                    value={formData.dob} 
                                    onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Gender</label>
                                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Grid */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Contact & Location</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input type="text" required maxLength={11} value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 11)})} className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700">Home Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-red-50/50 rounded-xl border border-red-100 p-4 space-y-4 shadow-sm">
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider border-b border-red-100 pb-2 flex items-center gap-2">
                            <HeartPulse size={14}/> Emergency Contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-red-900">Contact Name</label>
                                <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full px-4 py-2 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-red-900">Contact Phone</label>
                                <input type="text" maxLength={11} value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 11)})} className="w-full px-4 py-2 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Payment / Renewal */}
                    <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/30">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={formData.recordPayment}
                                onChange={(e) => setFormData({...formData, recordPayment: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-blue-900">Process Renewal Payment?</span>
                        </label>

                        {formData.recordPayment && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-3">
                                    {['Cash', 'GCash', 'PayMaya', 'Bank Transfer'].map(method => (
                                        <button 
                                            type="button" key={method}
                                            onClick={() => setFormData({...formData, paymentMethod: method})}
                                            className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all border ${
                                                formData.paymentMethod === method ? 'bg-white border-blue-500 text-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button 
                            type="submit" disabled={isSaving}
                            className={`flex-1 px-4 py-3 font-bold rounded-xl text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                formData.recordPayment ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSaving ? 'Processing...' : (formData.recordPayment ? 'Pay & Renew' : 'Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMemberModal;