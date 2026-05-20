import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Mock the hook so we control online/offline state in tests
vi.mock('@/hooks/useOnlineStatus');

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: true, isOffline: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders amber banner when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false, isOffline: true });
    render(<OfflineIndicator />);
    expect(screen.getByText(/you're offline/i)).toBeTruthy();
  });

  it('renders WifiOff icon when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false, isOffline: true });
    render(<OfflineIndicator />);
    // lucide-react WifiOff renders as an SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has amber background when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false, isOffline: true });
    render(<OfflineIndicator />);
    const banner = screen.getByText(/you're offline/i).closest('div');
    expect(banner?.className).toMatch(/amber/);
  });
});
