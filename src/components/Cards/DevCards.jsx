const DevCards = ( {name , picture} ) => {
    return (
        <div className="flex flex-col items-center space-y-4 w-48">
            <div className="w-40 h-40 rounded-half border border-white/20 overflow-hidden bg-transparent">
                <img
                src={picture}
                alt="Placeholder"
                className="w-full h-full object-cover"
                />
            </div>
            <div className="text-center">
                <p className="text-black font-medium">{name}</p>
            </div>
        </div>
    );
};

export default DevCards
