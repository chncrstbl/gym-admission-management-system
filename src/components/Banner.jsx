import bgImage from '../assets/images/banner.png';

const Banner = ({ title }) => {
    return (
        <header 
            className="h-40 w-full bg-gray-800 p-6 relative bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/40"></div>

            <h1 className="text-white text-2xl font-medium absolute -bottom-1 left-3 pl-5 py-5 drop-shadow-md">
                {title}
            </h1>
        </header>
    )
}

export default Banner