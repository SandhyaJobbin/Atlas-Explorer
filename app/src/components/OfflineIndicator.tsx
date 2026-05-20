import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-300 px-4 py-2.5 flex items-center justify-center gap-2 shadow-sm">
      <WifiOff className="w-4 h-4 text-amber-700" />
      <span className="text-sm font-medium text-amber-800">
        You're offline — scores will sync when reconnected
      </span>
    </div>
  );
}
