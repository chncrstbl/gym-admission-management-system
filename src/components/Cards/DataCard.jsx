const DataCard = ({ children, dataDescription }) => {
return (
    <div className="bg-white border-2 border-gray-800 rounded-xl p-4 w-80 cursor-pointer">
        <div className="h-48 w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-4">
            {children}
        </div>
        <div className="tracking-tight">
            {dataDescription}
        </div>
    </div>
    );
};

export default DataCard