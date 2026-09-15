const Button = ({ func, children }) => {
    return (
        <button
        onClick={func}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md transition-colors">
            {children}
        </button>
    )
}

export default Button