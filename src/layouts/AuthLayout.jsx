const AuthLayout = ({ children }) => {
    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white p-6 rounded shadow">
            {children}
        </div>
    </div>
    );
};

export default AuthLayout;