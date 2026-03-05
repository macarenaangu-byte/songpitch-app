import { readFileSync, writeFileSync } from 'fs';
const file = '/Users/macarena.nadeau/Desktop/songpitch-app/src/App.jsx';
let lines = readFileSync(file, 'utf8').split('\n');

// Lines 417-431 (1-based) = indices 416-430 (0-based), 15 lines total
// Replace the normalizedRole block with a simple hasValidRole check
const newLines = [
  '      } else {',
  '        const hasValidRole = !!(data?.account_type || data?.role);',
  '',
  '        setUserProfile(data);',
  '        if (hasValidRole) {',
  '          setNeedsOnboarding(false);',
  "          setPage('dashboard');",
  '        } else {',
  '          setNeedsOnboarding(true);',
  '        }',
  '      }'
];

lines.splice(416, 15, ...newLines);
writeFileSync(file, lines.join('\n'));
console.log('Done. Line count:', lines.length);
