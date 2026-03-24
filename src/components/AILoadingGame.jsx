import { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

const SYMBOLS = ['🎵', '🎹', '🎸', '🥁', '🎧', '🎤'];

export function AILoadingGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);

  // Shuffles a new deck of 12 cards (6 pairs)
  const initializeGame = () => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, id) => ({ id, symbol }));
    setCards(deck);
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
  };

  // Start the game when the component loads
  useEffect(() => {
    initializeGame();
  }, []);

  // Handle a user flipping a card
  const handleCardClick = (index) => {
    // Prevent clicking if game is paused, card is already flipped, or card is solved
    if (disabled || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    // If two cards are flipped, check for a match!
    if (newFlipped.length === 2) {
      setDisabled(true); // Pause clicks temporarily
      const [first, second] = newFlipped;
      
      if (cards[first].symbol === cards[second].symbol) {
        // It's a match!
        setSolved(prev => [...prev, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        // Not a match - flip them back over after a short delay
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 800); // 800ms gives them enough time to memorize it
      }
    }
  };

  // Check for a win condition
  useEffect(() => {
    if (solved.length === SYMBOLS.length * 2) {
      // They won! Wait 1.5 seconds so they can see their victory, then restart
      setTimeout(initializeGame, 1500);
    }
  }, [solved]);

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(8px)', 
      zIndex: 9999, display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden', 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" 
    }}>

      {/* The Central UI Container */}
      <div style={{ 
        background: DESIGN_SYSTEM.colors.bg.card, padding: '32px 48px', 
        borderRadius: 24, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, 
        textAlign: 'center', zIndex: 10, 
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', maxWidth: 450, width: '100%'
      }}>
        
        {/* Header Section */}
        <Sparkles size={36} color={DESIGN_SYSTEM.colors.brand.primary} style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          AI is working its magic...
        </h2>
        <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginBottom: 24 }}>
          Play a quick memory game while we analyze your tracks!
        </p>

        {/* The Memory Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: 16
        }}>
          {cards.map((card, index) => {
            const isFlipped = flipped.includes(index);
            const isSolved = solved.includes(index);
            
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                style={{
                  aspectRatio: '1',
                  background: isFlipped || isSolved ? DESIGN_SYSTEM.colors.bg.primary : `${DESIGN_SYSTEM.colors.brand.primary}15`,
                  border: `2px solid ${isFlipped || isSolved ? DESIGN_SYSTEM.colors.border.light : `${DESIGN_SYSTEM.colors.brand.primary}40`}`,
                  borderRadius: 12,
                  fontSize: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isFlipped || isSolved ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isFlipped || isSolved ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Only show the symbol if the card is flipped or solved */}
                <span style={{ 
                  transform: isFlipped || isSolved ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  opacity: isFlipped || isSolved ? 1 : 0,
                  transition: 'opacity 0.2s'
                }}>
                  {card.symbol}
                </span>
              </button>
            );
          })}
        </div>

        {/* Victory/Status Footer */}
        <div style={{ minHeight: 24 }}>
          {solved.length === SYMBOLS.length * 2 ? (
            <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RefreshCcw size={14} className="animate-spin" /> Perfect score! Reshuffling...
            </div>
          ) : (
            <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600 }}>
              MATCHES: {solved.length / 2} / {SYMBOLS.length}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}