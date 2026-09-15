const SignOutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-all border border-gray-100">
            
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            </div>

            <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">Sign out?</h3>
            <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to leave? You will need to log in again to access your account.
            </p>
            </div>

            <div className="mt-6 flex gap-3">
            <button
                onClick={onClose}
                className="cursor-pointer flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="cursor-pointer flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors shadow-sm"
            >
                Sign Out
            </button>
            </div>
        </div>
        </div>
    );
};

export default SignOutModal;