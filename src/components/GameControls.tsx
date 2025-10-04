import { useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';

export function GameControls() {
  const { status, resign, offerDraw } = useGameStore();
  const { playSound } = useSoundStore();

  if (status !== 'playing') return null;

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      playSound('notification');
      resign();
    }
  };

  const handleDrawOffer = () => {
    if (window.confirm('Offer a draw to your opponent?')) {
      playSound('notification');
      offerDraw();
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDrawOffer}
        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        aria-label="Offer draw"
      >
        Offer Draw
      </button>
      <button
        onClick={handleResign}
        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
        aria-label="Resign"
      >
        Resign
      </button>
    </div>
  );
}
