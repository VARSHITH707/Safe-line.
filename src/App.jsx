import { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage.jsx';
import ARViewport   from './components/ARViewport.jsx';

/**
 * App — top-level state machine.
 *
 * States:
 *   'landing'  → Show futuristic ticket scan UI
 *   'ar'       → Show live camera + AR glowing path
 */
export default function App() {
  const [appState, setAppState] = useState('landing');

  // Ticket data populated after a successful scan
  const [ticket, setTicket] = useState(null);

  /** Called by LandingPage when the user "scans" a ticket. */
  const handleScanSuccess = useCallback((ticketData) => {
    setTicket(ticketData);
    setAppState('ar');
  }, []);

  /** Called by ARViewport "← Back" button */
  const handleExit = useCallback(() => {
    setTicket(null);
    setAppState('landing');
  }, []);

  return (
    <>
      {appState === 'landing' && (
        <LandingPage onScanSuccess={handleScanSuccess} />
      )}
      {appState === 'ar' && ticket && (
        <ARViewport ticket={ticket} onExit={handleExit} />
      )}
    </>
  );
}
