import { Search, Music, Briefcase, Headphones, MessageCircle, Users, Shield } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

export function LandingPage({ onGetStarted, onLegalPage }) {
  return (
    <div className="hero-animated-bg" style={{
      minHeight: "100vh",
      fontFamily: "'Outfit', sans-serif",
      color: DESIGN_SYSTEM.colors.text.primary,
      overflow: "auto"
    }}>
      {/* Header/Nav */}
      <div style={{
        padding: "24px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/songpitch-logo.png"
            alt="SongPitch"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={(e) => e.target.style.display = 'none'}
          />
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SongPitch</div>
        </div>

        <button
          onClick={onGetStarted}
          style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            color: DESIGN_SYSTEM.colors.text.primary,
            border: "none",
            borderRadius: 10,
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 16px rgba(29,185,84,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.3)';
          }}
        >
          Sign In / Sign Up
        </button>
      </div>

      {/* Hero Section */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "80px 48px 60px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: 32 }}>
          <img
            src="/songpitch-logo.png"
            alt="SongPitch"
            style={{
              width: 88,
              height: 88,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 24px rgba(29,185,84,0.35))',
              animation: 'fadeInUp 0.6s ease-out',
            }}
          />
        </div>

        <h1 style={{
          fontSize: 56,
          fontWeight: 900,
          marginBottom: 20,
          lineHeight: 1.2,
          letterSpacing: "-1px"
        }}>
          Welcome to{' '}
          <span style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SongPitchHub</span>
        </h1>

        <p style={{
          fontSize: 20,
          color: DESIGN_SYSTEM.colors.text.secondary,
          maxWidth: 680,
          margin: "0 auto 40px",
          lineHeight: 1.7
        }}>
          The exclusive, AI-powered hub connecting world-class composers with industry-leading music executives. We handle the metadata so you can focus on the music.
        </p>
      </div>

      {/* Private Alpha Welcome */}
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "60px 48px",
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 80,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: 'calc(100% - 96px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 30,
          textAlign: "center",
          background: DESIGN_SYSTEM.colors.gradient.main,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🚀 Welcome to the Private Alpha!
        </h2>

        <p style={{
          fontSize: 17,
          color: DESIGN_SYSTEM.colors.text.secondary,
          lineHeight: 1.8,
          marginBottom: 0,
          textAlign: 'center'
        }}>
          Hey everyone! Thank you so much for helping me test SongPitchHub this weekend. The core AI analysis and pitching pipelines are officially live! Since this is an early Alpha, you might spot a few bugs as we stress-test the vault. Poke around, upload some tracks, test the AI, and let me know your thoughts!
        </p>
      </div>

      {/* How It Works Section */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 48px 80px",
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 60
        }}>The Solution</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40
        }}>
          {/* For Executives */}
          <div style={{
            background: "rgba(6,182,212,0.05)",
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.accent}30`,
            borderRadius: 16,
            padding: 36,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '60';
            e.currentTarget.style.boxShadow = `0 12px 32px ${DESIGN_SYSTEM.colors.brand.accent}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '30';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: `${DESIGN_SYSTEM.colors.brand.accent}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24
            }}>
              <Search size={30} color={DESIGN_SYSTEM.colors.brand.accent} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>🕵️‍♂️ For Music Executives</h3>
            <ul style={{ color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.7, fontSize: 16, margin: 0, paddingLeft: 22 }}>
              <li>🚫 Skip the messy Dropbox folders and expired links.</li>
              <li>🧠 Use AI-powered search to instantly filter by vibe, genre, or BPM.</li>
              <li>🎧 Review pre-sorted, perfectly tagged tracks in one clean dashboard.</li>
            </ul>
          </div>

          {/* For Composers */}
          <div style={{
            background: "rgba(168,85,247,0.05)",
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}30`,
            borderRadius: 16,
            padding: 36,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.purple + '60';
            e.currentTarget.style.boxShadow = `0 12px 32px ${DESIGN_SYSTEM.colors.brand.purple}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.purple + '30';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: `${DESIGN_SYSTEM.colors.brand.purple}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24
            }}>
              <Music size={30} color={DESIGN_SYSTEM.colors.brand.purple} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>🎹 For Composers & Producers</h3>
            <ul style={{ color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.7, fontSize: 16, margin: 0, paddingLeft: 22 }}>
              <li>🤖 Let our custom AI instantly auto-tag your genre, mood, and BPM.</li>
              <li>🔒 Build and manage your own secure, private track vault.</li>
              <li>🎯 Submit professional, pitch-ready catalogs directly to real industry briefs.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Preview / Feature Walkthrough */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 48px 80px",
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          background: DESIGN_SYSTEM.colors.gradient.main,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          See What's Inside
        </h2>
        <p style={{
          fontSize: 17,
          color: DESIGN_SYSTEM.colors.text.secondary,
          textAlign: "center",
          maxWidth: 600,
          margin: "0 auto 48px",
          lineHeight: 1.7,
        }}>
          Everything you need to discover, pitch, and collaborate — all in one platform.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {[
            { icon: <Music size={24} color={DESIGN_SYSTEM.colors.brand.primary} />, title: "🤖 AI Auto-Tagging", desc: "Upload your tracks and let our custom AI instantly tag your genre, mood, and BPM.", color: DESIGN_SYSTEM.colors.brand.primary },
            { icon: <Briefcase size={24} color={DESIGN_SYSTEM.colors.brand.accent} />, title: "📁 The Secure Vault", desc: "Keep all your unreleased, high-value tracks perfectly organized in one secure, cloud-based hub.", color: DESIGN_SYSTEM.colors.brand.accent },
            { icon: <Headphones size={24} color={DESIGN_SYSTEM.colors.brand.purple} />, title: "🎯 Search by Vibe", desc: "Looking for \"UPLIFTING INDIE FOLK\" at 115 BPM? Filter and find exactly what the scene needs instantly.", color: DESIGN_SYSTEM.colors.brand.purple },
            { icon: <MessageCircle size={24} color={DESIGN_SYSTEM.colors.brand.blue} />, title: "💼 Pitch-Ready Catalogs", desc: "Every track is standardized with accurate metadata so executives can make decisions faster.", color: DESIGN_SYSTEM.colors.brand.blue },
            { icon: <Users size={24} color={DESIGN_SYSTEM.colors.accent.amber} />, title: "📈 Real Opportunities", desc: "Executives post briefs with budgets, deadlines, and genre needs. Composers apply with one click.", color: DESIGN_SYSTEM.colors.accent.amber },
            { icon: <Shield size={24} color={DESIGN_SYSTEM.colors.accent.green} />, title: "💬 Direct Messaging", desc: "Skip the middleman. Real-time conversations between composers and executives.", color: DESIGN_SYSTEM.colors.accent.green },
          ].map((feature, idx) => (
            <div key={idx} style={{
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 16,
              padding: 24,
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = feature.color + '50';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${feature.color}18`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${feature.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                {feature.icon}
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: DESIGN_SYSTEM.colors.text.primary }}>{feature.title}</h4>
              <p style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 48px 100px",
        textAlign: "center"
      }}>
        <h2 style={{
          fontSize: 40,
          fontWeight: 800,
          marginBottom: 24
        }}>Ready to Connect?</h2>

        <button
          onClick={onGetStarted}
          style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            color: DESIGN_SYSTEM.colors.text.primary,
            border: "none",
            borderRadius: 14,
            padding: "20px 52px",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 8px 28px rgba(29,185,84,0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(29,185,84,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,185,84,0.4)';
          }}
        >
          Get Started →
        </button>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        padding: "40px 48px",
        textAlign: "center"
      }}>
        <p style={{
          color: DESIGN_SYSTEM.colors.text.muted,
          fontSize: 15,
          marginBottom: 12
        }}>
          Questions? Feedback? We'd love to hear from you.
        </p>
        <a
          href="mailto:mangulo@songpitchhub.com"
          style={{
            color: DESIGN_SYSTEM.colors.brand.accent,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.blue}
          onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.accent}
        >
          mangulo@songpitchhub.com
        </a>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <button onClick={() => onLegalPage('terms')} style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Terms of Service
          </button>
          <button onClick={() => onLegalPage('privacy')} style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Privacy Policy
          </button>
          <button onClick={() => onLegalPage('dmca')} style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            DMCA Policy
          </button>
        </div>
        <p style={{
          color: DESIGN_SYSTEM.colors.text.muted,
          fontSize: 14,
          marginTop: 16
        }}>
          © {new Date().getFullYear()} SongPitch. Where talent meets opportunity.
        </p>
      </div>
    </div>
  );
}
