const Header = ({ title }) => {
    return (
        <header className="app-header h-20 w-full p-6 relative">
            <div className="app-header-rule absolute bottom-0 left-6 right-6"></div>
            <h1 className="text-slate-900 text-2xl font-semibold absolute bottom-3 left-6">
                {title}
            </h1>
        </header>
    )
}

export default Header