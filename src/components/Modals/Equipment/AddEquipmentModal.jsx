import React, { useState } from 'react';
import BaseModal from '../BaseModal';
import { Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const compressImage = (file, maxWidth = 800, quality = 0.7) => {
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

const AddEquipmentModal = ({ isOpen, onClose, onSubmit, isSaving }) => {
    const [formData, setFormData] = useState({
        name: '', category: 'Cardio', value: '', image: ''
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload a valid image file.");
                return;
            }
            try {
                const compressedBase64 = await compressImage(file, 800, 0.7);
                setFormData({ ...formData, image: compressedBase64 });
            } catch (error) {
                toast.error("Failed to process image.");
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const generatedSerial = 'EQP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        onSubmit({ ...formData, serialCode: generatedSerial, condition: 'Excellent' });
        setFormData({ name: '', category: 'Cardio', value: '', image: '' });
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Register New Equipment">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                        {formData.image ? (
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-gray-400" size={24} />
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors w-fit">
                            <Upload size={16} /> Choose Photo
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">Image will be auto-compressed</p>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipment Name</label>
                    <input className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Treadmill Pro 9000" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {['Cardio', 'Strength', 'Free Weights', 'Functional Training', 'Accessories'].map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset Value ($)</label>
                        <input type="text" step="0.01" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0.00" />
                    </div>
                </div>

                <div className="pt-4 border-t mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition cursor-pointer">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition cursor-pointer disabled:opacity-70">
                        {isSaving ? 'Registering...' : 'Register Equipment'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default AddEquipmentModal;