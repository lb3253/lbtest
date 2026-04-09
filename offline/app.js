// Global variables
let assetRecords = []; // Array of objects with all CSV columns
let scanHistory = [];
let html5QrcodeScanner = null;
let isScanning = false;

// DOM Elements
const uploadStatus = document.getElementById('uploadStatus');
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const manualInput = document.getElementById('manualInput');
const checkBtn = document.getElementById('checkBtn');
const resultsCard = document.getElementById('resultsCard');
const resultContent = document.getElementById('resultContent');
const serialListCard = document.getElementById('serialListCard');
const serialCount = document.getElementById('serialCount');
const serialList = document.getElementById('serialList');
const historyCard = document.getElementById('historyCard');
const historyCount = document.getElementById('historyCount');
const historyList = document.getElementById('historyList');

// Event Listeners
startScanBtn.addEventListener('click', startScanning);
stopScanBtn.addEventListener('click', stopScanning);
checkBtn.addEventListener('click', checkManualEntry);
manualInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkManualEntry();
    }
});

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCSVData();
    loadScanHistory();
});

// Parse CSV text into array of objects
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]);

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) continue;

        const record = {};
        for (let j = 0; j < headers.length; j++) {
            record[headers[j].trim()] = (j < values.length) ? values[j].trim() : '';
        }
        records.push(record);
    }
    return records;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current);
    return result;
}

// Find the serial number column name from headers
function findSerialColumn(record) {
    const keys = Object.keys(record);
    // Look for common serial number column names
    const candidates = ['Serial Number', 'SerialNumber', 'Serial_Number', 'serial number', 'serial', 'Serial'];
    for (const candidate of candidates) {
        if (keys.includes(candidate)) return candidate;
    }
    // Fallback: find a key that contains "serial"
    for (const key of keys) {
        if (key.toLowerCase().includes('serial')) return key;
    }
    // Last resort: use first column
    return keys[0];
}

// Load CSV data from data.js (works on file:// and http://)
function loadCSVData() {
    uploadStatus.className = 'status-message';
    uploadStatus.innerHTML = '<span class="loading"></span> Loading data...';

    try {
        // DATA_CSV is defined in data.js, loaded via <script> tag
        if (typeof DATA_CSV === 'undefined' || !DATA_CSV) {
            throw new Error('No data found. Make sure data.js is in the same folder and contains your CSV data.');
        }

        assetRecords = parseCSV(DATA_CSV);

        if (assetRecords.length === 0) {
            uploadStatus.className = 'status-message error';
            uploadStatus.textContent = 'No records found in data.js. Please check the file format.';
            return;
        }

        uploadStatus.className = 'status-message success';
        uploadStatus.textContent = `\u2713 Loaded ${assetRecords.length} records`;

        // Enable scanning and manual entry
        startScanBtn.disabled = false;
        manualInput.disabled = false;
        checkBtn.disabled = false;

        // Display serial numbers
        displaySerialNumbers();

    } catch (error) {
        uploadStatus.className = 'status-message error';
        uploadStatus.textContent = `\u2717 ${error.message}`;
        console.error('Error loading data:', error);
    }
}

// Display loaded serial numbers
function displaySerialNumbers() {
    const serialCol = findSerialColumn(assetRecords[0]);
    serialCount.textContent = `Total Records: ${assetRecords.length}`;

    // Show first 50 serial numbers
    const displayLimit = 50;
    const recordsToShow = assetRecords.slice(0, displayLimit);

    serialList.innerHTML = recordsToShow
        .map(record => `<div class="serial-item">${escapeHTML(record[serialCol] || 'N/A')}</div>`)
        .join('');

    if (assetRecords.length > displayLimit) {
        serialList.innerHTML += `<div style="text-align: center; margin-top: 10px; color: #666;">... and ${assetRecords.length - displayLimit} more</div>`;
    }

    serialListCard.style.display = 'block';
}

// Start barcode scanning
function startScanning() {
    if (isScanning) return;

    const config = {
        fps: 10,
        qrbox: { width: 280, height: 60 },
        aspectRatio: 1.0,
        disableFlip: false
    };

    html5QrcodeScanner = new Html5Qrcode("reader");

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'inline-block';
    }).catch(err => {
        console.error('Scanner error:', err);
        alert(`Unable to start scanner: ${err}. Please make sure you've granted camera permissions. Note: Scanner requires HTTPS or localhost.`);
    });
}

// Stop barcode scanning
function stopScanning() {
    if (!isScanning || !html5QrcodeScanner) return;

    html5QrcodeScanner.stop().then(() => {
        isScanning = false;
        startScanBtn.style.display = 'inline-block';
        stopScanBtn.style.display = 'none';
    }).catch(err => {
        console.error('Error stopping scanner:', err);
    });
}

// Handle successful scan
function onScanSuccess(decodedText, decodedResult) {
    stopScanning();
    checkSerialNumber(decodedText);
    playBeep();
}

// Handle scan error
function onScanError(errorMessage) {
    // Ignore - fires constantly while scanning
}

// Check manual entry
function checkManualEntry() {
    const serial = manualInput.value.trim();
    if (!serial) {
        alert('Please enter a serial number.');
        return;
    }
    checkSerialNumber(serial);
}

// Check if serial number exists and get full record
function checkSerialNumber(scannedSerial) {
    const normalizedScanned = String(scannedSerial).trim();
    const serialCol = findSerialColumn(assetRecords[0]);

    // Try exact match first
    let matchedRecord = assetRecords.find(record =>
        String(record[serialCol]).trim() === normalizedScanned
    );

    // If not found, try case-insensitive
    if (!matchedRecord) {
        matchedRecord = assetRecords.find(record =>
            String(record[serialCol]).trim().toLowerCase() === normalizedScanned.toLowerCase()
        );
    }

    const found = !!matchedRecord;

    // Save to scan history
    saveScanToHistory(normalizedScanned, found);

    displayResult(normalizedScanned, found, matchedRecord);
}

// Build the details table HTML for a result
function buildDetailsTable(record, serialCol, scannedSerial) {
    // Define the columns we want to show (in order)
    const columnOrder = [
        'Serial Number', 'Last Contact', 'Under Warranty',
        'Refresh Year', 'Recommended Action', 'Location', 'Vulnerabilities'
    ];

    // Get all keys from the record, ordered by columnOrder first, then any extras
    let keysToShow;
    if (record) {
        const recordKeys = Object.keys(record);
        keysToShow = [];
        // Add columns in preferred order if they exist
        for (const col of columnOrder) {
            const match = recordKeys.find(k => k.toLowerCase() === col.toLowerCase());
            if (match) keysToShow.push(match);
        }
        // Add any remaining columns not in the preferred order
        for (const key of recordKeys) {
            if (!keysToShow.includes(key)) keysToShow.push(key);
        }
    } else {
        keysToShow = columnOrder;
    }

    let rows = '';
    for (const key of keysToShow) {
        const value = record ? (record[key] || '') : (key.toLowerCase().includes('serial') ? scannedSerial : 'N/A');
        let valueClass = 'detail-value';

        // Special styling for certain columns
        if (key.toLowerCase().includes('warranty')) {
            if (value.toLowerCase() === 'yes') valueClass += ' warranty-yes';
            else if (value.toLowerCase() === 'no') valueClass += ' warranty-no';
        }
        if (key.toLowerCase().includes('vulnerabilit') && value && value !== 'N/A' && value.toLowerCase() !== 'none') {
            valueClass += ' has-vulnerabilities';
        }

        rows += `
            <tr>
                <td class="detail-label">${escapeHTML(key)}</td>
                <td class="${valueClass}">${escapeHTML(value)}</td>
            </tr>`;
    }

    return `<table class="result-details">${rows}</table>`;
}

// Display result
function displayResult(serial, found, record) {
    resultsCard.style.display = 'block';
    const serialCol = assetRecords.length > 0 ? findSerialColumn(assetRecords[0]) : 'Serial Number';

    if (found) {
        resultContent.innerHTML = `
            <div class="result-success">
                <div class="result-icon">\u2713</div>
                <div class="result-text" style="color: #28a745;">Serial Number Found!</div>
                <div class="result-serial">${escapeHTML(serial)}</div>
                ${buildDetailsTable(record, serialCol, serial)}
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-error">
                <div class="result-icon">\u2717</div>
                <div class="result-text" style="color: #dc3545;">Serial Number Not Found</div>
                <div class="result-serial">${escapeHTML(serial)}</div>
                ${buildDetailsTable(null, serialCol, serial)}
            </div>
        `;
    }

    // Scroll to results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Scan History Functions
function saveScanToHistory(serial, found) {
    const scan = {
        serial: serial,
        found: found,
        timestamp: new Date().toISOString()
    };

    scanHistory.unshift(scan);

    // Keep only last 100 scans
    if (scanHistory.length > 100) {
        scanHistory = scanHistory.slice(0, 100);
    }

    // Save to localStorage
    try {
        localStorage.setItem('pcRefreshScanHistory', JSON.stringify(scanHistory));
    } catch (error) {
        console.error('Error saving scan history:', error);
    }

    displayScanHistory();
}

function loadScanHistory() {
    try {
        const stored = localStorage.getItem('pcRefreshScanHistory');
        if (stored) {
            scanHistory = JSON.parse(stored);
            if (scanHistory.length > 0) {
                displayScanHistory();
            }
        }
    } catch (error) {
        console.error('Error loading scan history:', error);
    }
}

function displayScanHistory() {
    if (!scanHistory || scanHistory.length === 0) {
        historyCard.style.display = 'none';
        return;
    }

    const foundCount = scanHistory.filter(s => s.found).length;
    const notFoundCount = scanHistory.filter(s => !s.found).length;

    historyCount.innerHTML = `
        <strong>Total Scans: ${scanHistory.length}</strong><br>
        <span style="color: #28a745;">\u2713 Found: ${foundCount}</span> |
        <span style="color: #dc3545;">\u2717 Not Found: ${notFoundCount}</span>
    `;

    historyList.innerHTML = scanHistory.map(scan => {
        const date = new Date(scan.timestamp).toLocaleString();
        const statusClass = scan.found ? 'history-item-found' : 'history-item-not-found';
        const statusIcon = scan.found ? '\u2713' : '\u2717';
        const statusText = scan.found ? 'Found' : 'Not Found';

        return `
            <div class="history-item ${statusClass}">
                <div class="history-serial">${escapeHTML(scan.serial)}</div>
                <div class="history-status">${statusIcon} ${statusText}</div>
                <div class="history-date">${date}</div>
            </div>
        `;
    }).join('');

    historyCard.style.display = 'block';
}

function clearScanHistory() {
    if (confirm('Are you sure you want to clear scan history?')) {
        scanHistory = [];
        localStorage.removeItem('pcRefreshScanHistory');
        historyCard.style.display = 'none';
    }
}

function exportScanHistory() {
    if (scanHistory.length === 0) {
        alert('No scan history to export.');
        return;
    }

    let csv = 'Serial Number,Status,Date/Time\n';
    scanHistory.forEach(scan => {
        const status = scan.found ? 'Found' : 'Not Found';
        const date = new Date(scan.timestamp).toLocaleString();
        csv += `"${scan.serial}","${status}","${date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Play beep sound
function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('Could not play beep sound:', error);
    }
}

// Initialize
console.log('PC Refresh Lookup (Offline) initialized!');
