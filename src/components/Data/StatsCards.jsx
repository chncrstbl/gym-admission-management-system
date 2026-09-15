const StatsCards = ({ title, value, icon, trend, trendColor}) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>

                {trend && (
                    <p className={`text-sm mt-2 font-medium ${trendColor}`}>
                        {trend}
                    </p>
                )}
            </div>

            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                {icon}
            </div>
        </div>
    )
}

export default StatsCards