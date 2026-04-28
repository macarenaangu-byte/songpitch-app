import { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw, Gamepad2, Clock } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

const SYMBOLS = ['🎵', '🎹', '🎸', '🥁', '🎧', '🎤'];

export function AILoadingGame() {
  // 'choosing' → show the opt-in prompt
  // 'playing'  → show the memory game
  // 'waiting'  → show simple loading animation
  const [mode, setMode] = useState('choosing');

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [dots, setDots] = useState('');

  // Animate the "..." dots on the waiting screen
  useEffect(() => {
    if (mode !== 'waiting') return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [mode]);

  const initializeGame = () => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, id) => ({ id, symbol }));
    setCards(deck);
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
  };

  const handleCardClick = (index) => {
    if (disabled || flipped.includes(index) || solved.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setDisabled(true);
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        setSolved(prev => [...prev, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => { setFlipped([]); setDisabled(false); }, 800);
      }
    }
  };

  useEffect(() => {
    if (solved.length === SYMBOLS.length * 2) {
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

      <div style={{
        background: DESIGN_SYSTEM.colors.bg.card, padding: '36px 48px',
        borderRadius: 24, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        textAlign: 'center', zIndex: 10,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', maxWidth: 450, width: '100%'
      }}>

        {/* ── CHOICE SCREEN ─────────────────────────────────────── */}
        {mode === 'choosing' && (
          <>
            <Sparkles size={36} color={DESIGN_SYSTEM.colors.brand.primary} style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              AI is working its magic...
            </h2>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginBottom: 32 }}>
              This usually takes 15–30 seconds. What would you like to do while you wait?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => { setMode('playing'); initializeGame(); }}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: `${DESIGN_SYSTEM.colors.brand.primary}18`,
                  border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}50`,
                  borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}28`}
                onMouseLeave={e => e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}18`}
              >
                <Gamepad2 size={20} color={DESIGN_SYSTEM.colors.brand.primary} style={{ flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 700, margin: 0 }}>
                    Play a memory game
                  </p>
                  <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, margin: '2px 0 0' }}>
                    Match the music icons while you wait
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('waiting')}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: 'transparent',
                  border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Clock size={20} color={DESIGN_SYSTEM.colors.text.secondary} style={{ flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 700, margin: 0 }}>
                    Just wait for the results
                  </p>
                  <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, margin: '2px 0 0' }}>
                    I'll keep an eye on it
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── WAITING SCREEN ────────────────────────────────────── */}
        {mode === 'waiting' && (
          <>
            {/* Pulsing ring animation */}
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 20px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `2px solid ${DESIGN_SYSTEM.colors.brand.primary}30`,
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={22} color={DESIGN_SYSTEM.colors.brand.primary} />
              </div>
            </div>

            <style>{`
              @keyframes ping {
                75%, 100% { transform: scale(1.8); opacity: 0; }
              }
            `}</style>

            <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Analyzing{dots}
            </h2>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginBottom: 24 }}>
              Our AI is reading every clause. This usually takes 15–30 seconds.
            </p>

            <button
              onClick={() => { setMode('playing'); initializeGame(); }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 600,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}
            >
              Actually, I'll play the game →
            </button>
          </>
        )}

        {/* ── GAME SCREEN ───────────────────────────────────────── */}
        {mode === 'playing' && (
          <>
            <Sparkles size={28} color={DESIGN_SYSTEM.colors.brand.primary} style={{ margin: '0 auto 12px' }} />
            <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              AI is working its magic...
            </h2>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, marginBottom: 20 }}>
              Match all the pairs before the results land!
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px', marginBottom: 16
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
                      borderRadius: 12, fontSize: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isFlipped || isSolved ? 'default' : 'pointer',
                      transition: 'all 0.3s ease',
                      transform: isFlipped || isSolved ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
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
          </>
        )}

      </div>
    </div>
  );
}
