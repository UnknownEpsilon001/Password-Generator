# Password Generator

A browser-based password generator with entropy analysis, common password detection, and optional AES-256 encrypted export. No server, no tracking — runs entirely client-side.

## Features

- **Cryptographically secure generation** — uses `window.crypto.getRandomValues` with rejection sampling, never `Math.random()`
- **Secure shuffle** — Fisher-Yates shuffle with crypto-safe RNG ensures unbiased character ordering
- **Entropy analysis** — calculates bits of entropy in real time, penalizes low-uniqueness and repeated-character patterns
- **Common password blacklist** — checks against a large wordlist; flags known weak passwords before you use them
- **Strength tiers** — Very Weak / Weak / Medium / Strong / Ultra Secure based on entropy thresholds
- **Encrypted export** — AES-256-GCM with PBKDF2 key derivation (100,000 iterations, SHA-256), saves as `.passgen`
- **Import & decrypt** — load `.txt` or `.passgen` files, decrypt with the original key
- **Two themes** — Matrix terminal (green scanlines) and Cyberpunk (cyan grid)

## How It Works

### Password Generation

Guarantees at least one lowercase, uppercase, digit, and special character. The full charset is shuffled before selection, then the result is shuffled again so the guaranteed characters don't cluster at the start.

Length is configurable from 8 to 100 characters.

### Entropy Calculation

```
entropy = length × log2(charsetSize) × repetitionPenalty
```

- `charsetSize` — sum of active character pools (26 + 26 + 10 + 32)
- `repetitionPenalty` — 0.3× if unique ratio < 30%, 0.6× if < 50%
- Common passwords score -1 bits; all-same-character scores 0 bits

### Encryption

Export with encryption uses the Web Crypto API:

1. Random 16-byte salt + 12-byte IV generated per encryption
2. PBKDF2 derives a 256-bit AES key from your passphrase
3. AES-GCM encrypts the password — authentication tag built in
4. `salt + IV + ciphertext` packed and base64-encoded into a `.passgen` file

Decryption reverses this. Wrong key or corrupted file: AES-GCM auth fails and returns null.

## Usage

No build step. Open `index.html` in any modern browser.

```
git clone https://github.com/UnknownEpsilon001/Password-Generator.git
cd Password-Generator
# open index.html in browser
```

For import/export to work locally, serve over HTTP (file:// blocks fetch for the password list):

```
npx serve .
# or
python -m http.server 8080
```

## File Structure

```
├── index.html         # UI structure
├── script.js          # Generation, entropy, crypto logic
├── style.css          # Matrix green theme
├── style2.css         # Cyberpunk cyan theme
└── passwordlist.txt   # Common password blacklist
```

## Disclaimer

> **This project is for educational purposes only.**
>
> It demonstrates browser-based cryptography concepts — secure random number generation, entropy analysis, PBKDF2 key derivation, and AES-GCM encryption — using the Web Crypto API.
>
> Do not rely on this tool as your primary password manager or security solution for sensitive accounts. Encryption strength depends entirely on the passphrase you provide. The author makes no guarantees about fitness for production security use.

## License

MIT License — Copyright (c) 2026 Leo (UnknownAimo). See [LICENSE](LICENSE) for details.
