import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NewScanModal from '../components/shared/NewScanModal';
import useNewScan from '../hooks/useNewScan';

/**
 * AppLayout — Main app shell that composes Sidebar + TopBar + page content via <Outlet />.
 */
export default function AppLayout() {
  const { isOpen, open, close } = useNewScan();

  return (
    <>
      <Sidebar onNewScan={open} />

      <main className="ml-0 md:ml-[280px] flex-1 flex flex-col min-h-screen bg-transparent relative z-0">
        <TopBar />
        <div className="flex-1 relative z-10 flex flex-col">
          <Outlet />
        </div>
      </main>

      <NewScanModal isOpen={isOpen} onClose={close} />
    </>
  );
}
