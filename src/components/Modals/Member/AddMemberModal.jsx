import { useState, useEffect } from 'react';
import { X, Loader, ArrowRight, Check, ArrowLeft, User, CreditCard, Phone, MapPin, Upload, Mail, HeartPulse } from 'lucide-react';
import usePaymentPortal from '../../../hooks/PaymentPortal';
import toast from 'react-hot-toast';

const PRICING = {
    'Daily': 50,     
    'Half Month': 250,  
    'Monthly': 500,
};

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

const AddMemberModal = ({ isOpen, onClose, onSubmit, isSaving }) => {
    const [step, setStep] = useState(1);
    const openPortal = usePaymentPortal();
    const [isProcessing, setIsProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: '', gender: '', email: '', 
        contactNumber: '', address: '', emergencyContactName: '', emergencyContactPhone: '',
        role: 'Standard', image: '', paymentMethod: 'Cash'
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setStep(1);
            setImagePreview(null);
            setFormData({ 
                firstName: '', lastName: '', dob: '', gender: '', email: '', 
                contactNumber: '', address: '', emergencyContactName: '', emergencyContactPhone: '',
                role: 'Standard', image: '', paymentMethod: 'Cash' 
            });
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const currentPrice = PRICING[formData.role] || 50;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 400, 0.7);
                setFormData({ ...formData, image: compressedBase64 });
                setImagePreview(compressedBase64);
            } catch (error) {
                toast.error("Failed to process your image.");
            }
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.contactNumber) {
            toast.error("Please fill in required fields.");
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true); 
        try {
            await openPortal(formData.paymentMethod);
            await onSubmit(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                            {step === 1 ? "New Member Registration" : "Payment Details"}
                        </h3>
                        <div className="flex gap-2 mt-1">
                            <div className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
                            <div className={`h-1.5 w-8 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={step === 1 ? handleNext : handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    
                    {step === 1 && (
                        <>
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-28 h-28 mb-2 rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden bg-gray-100 group">
                                    {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                        <Upload size={24} className="mb-1" />
                                        <span className="text-[10px] font-bold tracking-wider">UPLOAD</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            {/* Personal Info Grid */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Personal Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></label>
                                        <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                                        <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            max="9999-12-31"
                                            value={formData.dob} 
                                            onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
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
                                            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
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

                            {/* Select Plan */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Select Membership Plan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {Object.keys(PRICING).map((plan) => (
                                        <div 
                                            key={plan}
                                            onClick={() => setFormData({...formData, role: plan})}
                                            className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition-all ${
                                                formData.role === plan ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200 bg-white'
                                            }`}
                                        >
                                            <span className={`font-bold ${formData.role === plan ? 'text-blue-700' : 'text-slate-600'}`}>{plan}</span>
                                            <span className={`text-sm mt-1 ${formData.role === plan ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>₱{PRICING[plan]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Summary</p>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                    <span className="text-gray-700 font-medium">{formData.role} Membership</span>
                                    <span className="font-bold text-gray-900">₱{currentPrice}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Member Name:</span>
                                    <span className="font-semibold text-gray-700">{formData.firstName} {formData.lastName}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Cash', 'GCash', 'PayMaya', 'Bank Transfer'].map((method) => (
                                        <button
                                            type="button" key={method}
                                            onClick={() => setFormData({...formData, paymentMethod: method})}
                                            className={`cursor-pointer py-3 px-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                                formData.paymentMethod === method ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                                <CreditCard size={20} className="shrink-0 text-blue-600 mt-0.5" />
                                <p>Upon confirmation, the new member status will activate immediately and a system invoice will be logged.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 border-t border-gray-100">
                        {step === 2 && (
                            <button type="button" onClick={() => setStep(1)} className="cursor-pointer px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <button type="submit" disabled={isSaving || isProcessing} className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-md">
                            {isSaving || isProcessing ? (
                                <> <Loader className="animate-spin" size={18} /> Processing... </>
                            ) : step === 1 ? (
                                <> Continue to Payment <ArrowRight size={18} /> </>
                            ) : (
                                <> <Check size={18} /> Confirm & Save Member </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;