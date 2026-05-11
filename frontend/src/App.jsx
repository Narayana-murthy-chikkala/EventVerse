import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import Loader from './components/Loader';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1C1917',
            color: '#FFF',
            borderRadius: '12px',
            border: '1px solid #D97706',
          },
          success: {
            iconTheme: { primary: '#D97706', secondary: '#FFF' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#FFF' },
          },
        }}
      />
      <Suspense fallback={<Loader />}>
        <AppRoutes />
      </Suspense>
    </>
  );
}

export default App;
