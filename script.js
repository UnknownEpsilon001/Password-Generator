const createpassbutton = document.getElementById('generate');
const copybutton = document.getElementById('copy');
const input = document.getElementById('password');
const entropyDisplay = document.getElementById('entropy');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const strengthTierDisplay = document.getElementById('entropytier');
const importExportButton = document.getElementById('import-export');
const importExportDialog = document.getElementById('import-export-dialog');
const encryptoggle = document.getElementById('encrypt-toggle');
const encryptkeyinput = document.getElementById('encrypt-key');
const exportButton = document.getElementById('export');
const passwordnameinput = document.getElementById('passwordname');
const decodebutton = document.getElementById('decode');
const copydialogbutton = document.getElementById('copydialog');
const passworddisplay = document.getElementById('passworddisplay');
const switchtheme = document.getElementById('switch-theme');

const importedpassworddisplay = document.getElementById('importedpassword');
const importdecryptkeyinput = document.getElementById('import-decrypt-key');
const importFileInput = document.getElementById('import');


let cachedPasswordList = null;

switchtheme.addEventListener('change', function() {
    let theme = document.getElementById('theme-stylesheet');
    if (theme.getAttribute('href') == 'style.css') {
        theme.setAttribute('href', 'style2.css');
    } else {
        theme.setAttribute('href', 'style.css');
    }
});

lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;createpassword();
    createpassword();
});

copybutton.addEventListener('click', () => {
    copyToClipboard(input);
});

copydialogbutton.addEventListener('click', () => {
    copyToClipboard(importedpassworddisplay);
});

importExportButton.addEventListener("click", () => {
    passworddisplay.textContent = input.value // Update the password display in the dialog
    importExportDialog.showModal();
});

input.addEventListener('input', (event) => {
    calculateEntropy(event.target.value); // Calculate and display entropy
});

function toggleEncryption() {
    if (encryptoggle.checked) {
        encryptkeyinput.style.display = 'block';
    } else {
        encryptkeyinput.style.display = 'none';
    }
}


async function loadpasswordlist() {
    if (cachedPasswordList) return cachedPasswordList; // return cache if available

    try {
        const response = await fetch('passwordlist.txt');
        const data = await response.text();
        cachedPasswordList = new Set(
            data.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        );
        return cachedPasswordList;
    } catch (error) {
        console.error('Error loading password list:', error);
        return new Set(); // return empty set so entropy still calculates
    }
}

loadpasswordlist(); // Preload password list on page load
 
function getStrengthTier(entropy) {
  if (entropy < 40) return { label: "Very Weak"};
  if (entropy < 60) return { label: "Weak"};
  if (entropy < 80) return { label: "Medium"};
  if (entropy < 110) return { label: "Strong"};
  return { label: "Ultra Secure"};
}

async function copyToClipboard(element) {
    if (!element) return;

    // Get the text based on element type
    // Inputs use .value | Spans/Divs use .textContent
    const textToCopy = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' 
        ? element.value 
        : element.textContent;

    if (!textToCopy) {
        console.warn("Nothing to copy!");
        return;
    }

    try {
        // Use the Clipboard API
        await navigator.clipboard.writeText(textToCopy);
        
        // Visual feedback: Select text if it's an input
        if (element.tagName === 'INPUT') {
            element.focus();
            element.select();
        }

        const original = copybutton.textContent;
        copybutton.textContent = 'Copied!';
        setTimeout(() => {
            copybutton.textContent = original;
        }, 1500);

    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy. Please try again.');
    }
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

exportButton.addEventListener('click', async () => {
    const name = passwordnameinput.value;
    if (!name) { alert('Please enter a name.'); return; }

    if (encryptoggle.checked) {
        const key = encryptkeyinput.value;
        if (!key) { alert('Please enter an encryption key.'); return; }

        const encrypted = await encryptPassword(input.value, key);
        downloadFile(encrypted, `${name}.passgen`);
    } else {
        downloadFile(input.value, `${name}.txt`);
    }
});

function createpassword(length = parseInt(lengthValue.textContent)) {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const all = lower + upper + digits + special;

    let charsetArray = all.split('');

    charsetArray = secureShuffle(charsetArray); // Shuffle the character set to ensure randomness
    
    // Guarantee one of each required type
    let passwordArray = [
        lower[getRandomInt(lower.length)],
        upper[getRandomInt(upper.length)],
        digits[getRandomInt(digits.length)],
        special[getRandomInt(special.length)],
    ];

    // Fill the rest from the full charset
    for (let i = passwordArray.length; i < length; i++) {
        passwordArray.push(charsetArray[getRandomInt(charsetArray.length)]);
    }

    // Shuffle so the guaranteed chars aren't always at the front
    passwordArray = secureShuffle(passwordArray);

    const password = passwordArray.join('');
    input.value = password;
    calculateEntropy(password);
}

createpassbutton.addEventListener('click', () => {
    createpassword();
});



function getRandomInt(max) {
    const range = 4294967296; // 2^32
    const limit = range - (range % max); // Find the highest multiple of max
    const array = new Uint32Array(1);

    let val;
    do {
        window.crypto.getRandomValues(array); // Fill the array with a secure random number
        val = array[0];
    } while (val >= limit); // Discard numbers that are out of range

    return val % max;
}

function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) { // Generate a secure random index between 0 and i

        const j = getRandomInt(i + 1);  // Scale the random number to fit our range [0, i]

        [array[i], array[j]] = [array[j], array[i]]; // Swap elements array[i] and array[j]
    }
    return array;
}

async function calculateEntropy(password) {
    if (!password) return 0;
    const wordlist = await loadpasswordlist();
    if (wordlist.has(password)) {
        entropyDisplay.textContent = `Password Entropy: -1 bits (Common Password)`;
        strengthTierDisplay.textContent = `Password Strength: Shit`;
        return 0;
    }

    if (/^(.)\1+$/.test(password)) {
        entropyDisplay.textContent = `Password Entropy: 0 bits (Repeated Characters)`;
        strengthTierDisplay.textContent = `Password Strength: Trash`;
        return 0;
    }

    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26; // Lowercase letters
    if (/[A-Z]/.test(password)) charsetSize += 26; // Uppercase letters
    if (/[0-9]/.test(password)) charsetSize += 10; // Digits
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Special characters (approximate)
    
    const uniqueChars = new Set(password).size;
    const uniqueRatio = uniqueChars / password.length;

    let repetitionPenalty = 1;
    if (uniqueRatio < 0.3) repetitionPenalty = 0.3;
    else if (uniqueRatio < 0.5) repetitionPenalty = 0.6;

    const rawEntropy = password.length * Math.log2(charsetSize);
    const entropy = rawEntropy * repetitionPenalty;

    entropyDisplay.textContent = `Password Entropy: ${entropy.toFixed(2)} bits`;
    strengthTierDisplay.textContent = `Password Strength: ${getStrengthTier(entropy).label}`;

    return parseFloat(entropy.toFixed(2));
}


importFileInput.addEventListener('change', () => {
    if (importFileInput.files.length > 0) {
    const file = importFileInput.files[0]; // Get the first selected file

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.passgen')) {
        alert('Invalid file type. Please select a .txt or .passgen file.');
        return;
    }
    
     if (file.size > 5 * 1024 * 1024) { // Check if file is larger than 5MB
        alert('File is too large. Please select a file smaller than 5MB.');
        return;
    }

    if (file.name.endsWith('.passgen')) {
        importdecryptkeyinput.style.display = 'block';
        return;
    } else {
        importdecryptkeyinput.style.display = 'none';
    }

  } else {
    console.log("No file selected.");
  }
});

decodebutton.addEventListener('click', async () => {
    if (importFileInput.files.length > 0) {
        const file = importFileInput.files[0]; // Get the first selected file

        if (file.name.endsWith('.passgen')) {
            if (!importdecryptkeyinput.value) {
                alert('Please enter the encryption key to import this file.');
                return;
            }
            const reader = new FileReader();
            reader.onload = async function(e) {
                const content = e.target.result;
                importedpassworddisplay.value = await decryptPassword(content, importdecryptkeyinput.value) || "Wrong key or corrupted file. Decryption failed.";
            };
            reader.readAsText(file);
        }

        if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                importedpassworddisplay.value = content;
        };
        reader.readAsText(file);
    }

    } else {
        alert("No file selected. Please select a .txt or .passgen file to decode.");
    }
});

async function deriveKey(password, salt) {
    const enc = new TextEncoder();

    // import the raw password string as key material
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",       // key derivation algorithm
        false,          // not extractable
        ["deriveKey"]
    );

    // derive a strong AES key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt instanceof Uint8Array ? salt : enc.encode(salt),
            iterations: 100000, // slows down brute force attackers
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 }, // output: 256-bit AES key
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptPassword(password, userKey) {
    // Each encryption gets its own random IV — never reuse an IV with the same key
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
    const salt = crypto.getRandomValues(new Uint8Array(16)); // random salt per encryption

    const key = await deriveKey(userKey, salt);

    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(password)
    );

    // Pack salt + iv + ciphertext together into one Uint8Array
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64 string for saving to file
    return btoa(String.fromCharCode(...combined));
}

async function decryptPassword(encryptedData, userKey) {
    try {
        // Reverse the base64 encoding
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        // Unpack the three parts
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);          // 16 + 12 = 28
        const ciphertext = combined.slice(28);       // rest is the actual data

        const key = await deriveKey(userKey, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (err) {
        // AES-GCM authentication will throw if the key is wrong — use this to detect bad keys
        return null; // signal to caller that decryption failed
    }
}