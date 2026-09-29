import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathname = location.pathname.replace(/\/+$/, '') || '/';
    const isMemberPortal = pathname === '/member' || pathname.startsWith('/member/');
    const homePath = isMemberPortal ? '/member/dashboard' : '/home';
    const homeLabel = isMemberPortal ? 'Dashboard' : 'Home';
    const isHomePage = pathname === homePath;
    const routeLabels = {
        dashboard: 'Dashboard',
        profile: 'Profile',
        membership: 'Membership',
        visits: 'Check-In & Visits',
        progress: 'Fitness Progress',
        settings: 'Settings',
        overview: 'Overview',
        members: 'Members',
        equipment: 'Equipment',
        finance: 'Finance'
    };
    const segments = pathname.split('/').filter(Boolean)
        .filter((segment, index) => !(isMemberPortal && index === 0 && segment === 'member'));
    const routeSegments = isHomePage ? [] : segments;
    const crumbs = routeSegments.map((segment, index) => {
        const routePath = [...(isMemberPortal ? ['member'] : []), ...routeSegments.slice(0, index + 1)];
        const currentPath = `/${routePath.join('/')}`;
        return {
            id: currentPath,
            name: routeLabels[segment] || segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
            path: currentPath
        };
    });

return (
        <nav className="flex pl-3" aria-label="Breadcrumb">
        <ol className="inline-flex flex-wrap items-center gap-x-1 gap-y-1 md:gap-x-3">

            <li className="inline-flex items-center">
            {isHomePage ? (
                <span className="inline-flex items-center text-sm font-medium text-gray-700" aria-current="page">
                <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                {homeLabel}
                </span>
            ) : (
                <Link to={homePath} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600">
                    <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                    </svg>
                    {homeLabel}
                </Link>
            )}
            </li>

            {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
                <li key={crumb.id}>
                <div className="flex items-center">

                    <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                    
                    {isLast ? (

                    <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2" aria-current="page">
                        {crumb.name}
                    </span>
                    ) : (

                    <Link to={crumb.path} className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ml-2">
                        {crumb.name}
                    </Link>
                    )}
                </div>
                </li>
            );
            })}
        </ol>
        </nav>
    );
};

export default Breadcrumbs;