import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            
            <Toaster position="top-right" reverseOrder={false} />
            
            <AppRoutes />
        </QueryClientProvider>
    );
}

export default App;