const StatsCard = ({ title, value, sub, icon: Icon, theme = 'blue' }) => {
    const styles = {
        blue:   { bg: "bg-blue-50", text: "text-blue-600", sub: "text-blue-600" },
        green:  { bg: "bg-green-50", text: "text-green-600", sub: "text-green-600" },
        red:    { bg: "bg-red-50", text: "text-red-600", sub: "text-red-600" },
        purple: { bg: "bg-indigo-50", text: "text-indigo-600", sub: "text-indigo-600" },
        orange: { bg: "bg-orange-50", text: "text-orange-600", sub: "text-orange-600" },
    };

    const currentStyle = styles[theme] || styles.blue;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
                <p className={`text-xs font-medium mt-1 ${currentStyle.sub}`}>{sub}</p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStyle.bg} ${currentStyle.text}`}>
                {Icon && <Icon size={24} strokeWidth={2} />}
            </div>
        </div>
    );
};

export default StatsCard;