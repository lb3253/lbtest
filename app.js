// Configuration
const CONFIG = {
    USE_BACKEND: false, // Set to true to use backend API, false for localStorage only
    API_URL: 'http://localhost:3000/api' // Backend API URL
};

// Global variables
let serialNumbers = [];
let scanHistory = [];
let html5QrcodeScanner = null;
let isScanning = false;
let scannedBarcodes = new Set(); // Collect all barcodes from a label
let scanTimeout = null; // Timeout to finalize scanning if no match found
const SCAN_COLLECT_DURATION = 8000; // 8 seconds to collect all barcodes before giving up

// DOM Elements
const excelFileInput = document.getElementById('excelFile');
const uploadStatus = document.getElementById('uploadStatus');
const clearStorageBtn = document.getElementById('clearStorageBtn');
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
excelFileInput.addEventListener('change', handleFileUpload);
startScanBtn.addEventListener('click', startScanning);
stopScanBtn.addEventListener('click', stopScanning);
checkBtn.addEventListener('click', checkManualEntry);
manualInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkManualEntry();
    }
});

// Load serial numbers from localStorage or backend on page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize app - load from backend or localStorage
async function initializeApp() {
    if (CONFIG.USE_BACKEND) {
        await loadFromBackend();
    } else {
        loadFromLocalStorage();
    }
}

// Backend API Functions
async function loadFromBackend() {
    try {
        uploadStatus.className = 'status-message';
        uploadStatus.innerHTML = '<span class="loading"></span> Loading from server...';

        const response = await fetch(`${CONFIG.API_URL}/serials`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            serialNumbers = data.data;
            const date = data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown';

            uploadStatus.className = 'status-message success';
            uploadStatus.innerHTML = `✓ Loaded ${serialNumbers.length} serial numbers from server<br><small>Last updated: ${date}</small>`;

            // Show clear button
            clearStorageBtn.style.display = 'inline-block';

            // Enable scanning and manual entry
            startScanBtn.disabled = false;
            manualInput.disabled = false;
            checkBtn.disabled = false;

            // Display serial numbers
            displaySerialNumbers();
        } else {
            uploadStatus.className = 'status-message';
            uploadStatus.textContent = 'No serial numbers on server. Please upload a file.';
        }
    } catch (error) {
        console.error('Error loading from backend:', error);
        uploadStatus.className = 'status-message error';
        uploadStatus.textContent = '✗ Could not connect to server. Please check if server is running.';
    }
}

async function uploadToBackend(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        uploadStatus.className = 'status-message';
        uploadStatus.innerHTML = '<span class="loading"></span> Uploading to server...';

        const response = await fetch(`${CONFIG.API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            uploadStatus.className = 'status-message success';
            uploadStatus.textContent = data.message;

            // Reload from server
            await loadFromBackend();
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        uploadStatus.className = 'status-message error';
        uploadStatus.textContent = `✗ Error uploading to server: ${error.message}`;
    }
}

async function clearBackendData() {
    if (confirm('Are you sure you want to clear serial numbers from the server?')) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/serials`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                serialNumbers = [];
                uploadStatus.className = 'status-message';
                uploadStatus.textContent = 'Server data cleared. Please upload a new file.';
                serialListCard.style.display = 'none';
                clearStorageBtn.style.display = 'none';
                startScanBtn.disabled = true;
                manualInput.disabled = true;
                checkBtn.disabled = true;
            }
        } catch (error) {
            uploadStatus.className = 'status-message error';
            uploadStatus.textContent = `✗ Error clearing server data: ${error.message}`;
        }
    }
}

// LocalStorage Functions
function saveToLocalStorage(serials) {
    try {
        localStorage.setItem('pcRefreshSerials', JSON.stringify(serials));
        localStorage.setItem('pcRefreshSerialsDate', new Date().toISOString());
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('pcRefreshSerials');
        const storedDate = localStorage.getItem('pcRefreshSerialsDate');

        if (stored) {
            serialNumbers = JSON.parse(stored);

            if (serialNumbers.length > 0) {
                const date = storedDate ? new Date(storedDate).toLocaleString() : 'Unknown';
                uploadStatus.className = 'status-message success';
                uploadStatus.innerHTML = `✓ Loaded ${serialNumbers.length} serial numbers from storage<br><small>Last updated: ${date}</small>`;

                // Show clear button
                clearStorageBtn.style.display = 'inline-block';

                // Enable scanning and manual entry
                startScanBtn.disabled = false;
                manualInput.disabled = false;
                checkBtn.disabled = false;

                // Display serial numbers
                displaySerialNumbers();
            }
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }

    // Load scan history
    loadScanHistory();
}

// Scan History Functions
function saveScanToHistory(serial, found) {
    const scan = {
        serial: serial,
        found: found,
        timestamp: new Date().toISOString()
    };

    scanHistory.unshift(scan); // Add to beginning of array

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

    // Update display
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
        <span style="color: #28a745;">✓ Found: ${foundCount}</span> |
        <span style="color: #dc3545;">✗ Not Found: ${notFoundCount}</span>
    `;

    historyList.innerHTML = scanHistory.map(scan => {
        const date = new Date(scan.timestamp).toLocaleString();
        const statusClass = scan.found ? 'history-item-found' : 'history-item-not-found';
        const statusIcon = scan.found ? '✓' : '✗';
        const statusText = scan.found ? 'Found' : 'Not Found';

        return `
            <div class="history-item ${statusClass}">
                <div class="history-serial">${scan.serial}</div>
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

    // Create CSV content
    let csv = 'Serial Number,Status,Date/Time\n';
    scanHistory.forEach(scan => {
        const status = scan.found ? 'Found' : 'Not Found';
        const date = new Date(scan.timestamp).toLocaleString();
        csv += `"${scan.serial}","${status}","${date}"\n`;
    });

    // Create download link
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

// Wrapper function to clear data (localStorage or backend)
function clearStoredData() {
    if (CONFIG.USE_BACKEND) {
        clearBackendData();
    } else {
        clearLocalStorage();
    }
}

function clearLocalStorage() {
    if (confirm('Are you sure you want to clear stored serial numbers?')) {
        localStorage.removeItem('pcRefreshSerials');
        localStorage.removeItem('pcRefreshSerialsDate');
        serialNumbers = [];
        uploadStatus.className = 'status-message';
        uploadStatus.textContent = 'Storage cleared. Please upload a new file.';
        serialListCard.style.display = 'none';
        clearStorageBtn.style.display = 'none';
        startScanBtn.disabled = true;
        manualInput.disabled = true;
        checkBtn.disabled = true;
    }
}

// Handle Excel file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // If backend is enabled, upload to server
    if (CONFIG.USE_BACKEND) {
        uploadToBackend(file);
        return;
    }

    // Otherwise, process locally
    uploadStatus.className = 'status-message';
    uploadStatus.innerHTML = '<span class="loading"></span> Reading file...';

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Extract serial numbers (assuming they're in the first column)
            serialNumbers = [];
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row && row[0]) {
                    // Convert to string and trim whitespace
                    const serial = String(row[0]).trim();
                    if (serial) {
                        serialNumbers.push(serial);
                    }
                }
            }

            // Remove duplicates
            serialNumbers = [...new Set(serialNumbers)];

            if (serialNumbers.length === 0) {
                uploadStatus.className = 'status-message error';
                uploadStatus.textContent = 'No serial numbers found in the file.';
                return;
            }

            uploadStatus.className = 'status-message success';
            uploadStatus.textContent = `✓ Successfully loaded ${serialNumbers.length} serial numbers!`;

            // Save to localStorage
            saveToLocalStorage(serialNumbers);

            // Show clear button
            clearStorageBtn.style.display = 'inline-block';

            // Enable scanning and manual entry
            startScanBtn.disabled = false;
            manualInput.disabled = false;
            checkBtn.disabled = false;

            // Display serial numbers
            displaySerialNumbers();

        } catch (error) {
            uploadStatus.className = 'status-message error';
            uploadStatus.textContent = `✗ Error reading file: ${error.message}`;
            console.error('Error:', error);
        }
    };

    reader.onerror = function() {
        uploadStatus.className = 'status-message error';
        uploadStatus.textContent = '✗ Error reading file.';
    };

    reader.readAsArrayBuffer(file);
}

// Display loaded serial numbers
function displaySerialNumbers() {
    serialCount.textContent = `Total Serial Numbers: ${serialNumbers.length}`;

    // Show first 50 serial numbers
    const displayLimit = 50;
    const serialsToShow = serialNumbers.slice(0, displayLimit);

    serialList.innerHTML = serialsToShow
        .map(serial => `<div class="serial-item">${serial}</div>`)
        .join('');

    if (serialNumbers.length > displayLimit) {
        serialList.innerHTML += `<div style="text-align: center; margin-top: 10px; color: #666;">... and ${serialNumbers.length - displayLimit} more</div>`;
    }

    serialListCard.style.display = 'block';
}

// Start barcode scanning
function startScanning() {
    if (isScanning) return;

    // Reset collection for a fresh scan session
    resetScanCollection();

    const config = {
        fps: 10,
        qrbox: { width: 280, height: 60 },
        aspectRatio: 1.0,
        disableFlip: false
    };

    html5QrcodeScanner = new Html5Qrcode("reader");

    html5QrcodeScanner.start(
        { facingMode: "environment" }, // Use back camera
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'inline-block';
    }).catch(err => {
        console.error('Scanner error:', err);
        alert(`Unable to start scanner: ${err}. Please make sure you've granted camera permissions.`);
    });
}

// Stop barcode scanning
function stopScanning() {
    if (!isScanning || !html5QrcodeScanner) return;

    clearTimeout(scanTimeout);

    html5QrcodeScanner.stop().then(() => {
        isScanning = false;
        startScanBtn.style.display = 'inline-block';
        stopScanBtn.style.display = 'none';
    }).catch(err => {
        console.error('Error stopping scanner:', err);
    });
}

// Handle successful scan - collect multiple barcodes and find the serial
function onScanSuccess(decodedText, decodedResult) {
    const barcode = String(decodedText).trim();

    // Skip if we've already seen this barcode
    if (scannedBarcodes.has(barcode.toLowerCase())) return;

    // Add to collected set
    scannedBarcodes.add(barcode.toLowerCase());

    // Play a short beep for feedback
    playBeep();

    // Check if this barcode matches a serial number in the list
    const isMatch = serialNumbers.some(serial =>
        serial.toLowerCase() === barcode.toLowerCase()
    );

    // Update the live scan indicator
    updateScanIndicator(barcode, isMatch);

    if (isMatch) {
        // Found the serial number! Stop scanning and show result.
        clearTimeout(scanTimeout);
        stopScanning();
        checkSerialNumber(barcode);
        resetScanCollection();
    } else {
        // Not a match yet - keep scanning, reset the timeout
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
            // Time's up - no match found among all scanned barcodes
            stopScanning();
            showNoMatchResults();
            resetScanCollection();
        }, SCAN_COLLECT_DURATION);
    }
}

// Show live indicator of barcodes being collected
function updateScanIndicator(latestBarcode, isMatch) {
    let indicator = document.getElementById('scanIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'scanIndicator';
        indicator.className = 'scan-indicator';
        const readerEl = document.getElementById('reader');
        readerEl.parentNode.insertBefore(indicator, readerEl.nextSibling);
    }

    indicator.style.display = 'block';
    indicator.innerHTML = `
        <div class="scan-indicator-header">
            <span class="loading"></span> Scanning label... (${scannedBarcodes.size} barcode${scannedBarcodes.size !== 1 ? 's' : ''} detected)
        </div>
        <div class="scan-indicator-list">
            ${Array.from(scannedBarcodes).map(bc => {
                const matched = serialNumbers.some(s => s.toLowerCase() === bc.toLowerCase());
                return `<div class="scan-indicator-item ${matched ? 'scan-match' : 'scan-no-match'}">
                    ${matched ? '&#10003;' : '&#10007;'} ${bc}
                    ${matched ? '<span class="scan-match-label">SERIAL MATCH</span>' : ''}
                </div>`;
            }).join('')}
        </div>
        <div class="scan-indicator-hint">Point camera at all barcodes on the label. Auto-stops when serial is found.</div>
    `;
}

// Show results when no barcode matched any serial number
function showNoMatchResults() {
    const barcodes = Array.from(scannedBarcodes);

    resultsCard.style.display = 'block';
    resultContent.innerHTML = `
        <div class="result-error">
            <div class="result-icon">&#10007;</div>
            <div class="result-text" style="color: #dc3545;">No Serial Number Match Found</div>
            <div class="result-detail">Scanned ${barcodes.length} barcode${barcodes.length !== 1 ? 's' : ''} from the label:</div>
            <div class="scanned-barcodes-list">
                ${barcodes.map(bc => `
                    <div class="scanned-barcode-item" onclick="manualCheckFromScan('${bc}')">
                        ${bc} <span class="tap-to-check">tap to check</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Save all scanned barcodes to history as not found
    barcodes.forEach(bc => saveScanToHistory(bc, false));

    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Hide scan indicator
    const indicator = document.getElementById('scanIndicator');
    if (indicator) indicator.style.display = 'none';
}

// Allow user to manually check a specific barcode from the scan results
function manualCheckFromScan(barcode) {
    checkSerialNumber(barcode);
}

// Reset scan collection for next scan session
function resetScanCollection() {
    scannedBarcodes = new Set();
    clearTimeout(scanTimeout);
    const indicator = document.getElementById('scanIndicator');
    if (indicator) indicator.style.display = 'none';
}

// Handle scan error (can be ignored as it fires frequently while searching for codes)
function onScanError(errorMessage) {
    // Ignore - this fires constantly while scanning
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

// Check if serial number exists in the list
function checkSerialNumber(scannedSerial) {
    const normalizedScanned = String(scannedSerial).trim();

    // Check for exact match (case-sensitive)
    let found = serialNumbers.includes(normalizedScanned);

    // If not found, try case-insensitive search
    if (!found) {
        found = serialNumbers.some(serial =>
            serial.toLowerCase() === normalizedScanned.toLowerCase()
        );
    }

    // Save to scan history
    saveScanToHistory(normalizedScanned, found);

    displayResult(normalizedScanned, found);
}

// Display result
function displayResult(serial, found) {
    resultsCard.style.display = 'block';

    if (found) {
        resultContent.innerHTML = `
            <div class="result-success">
                <div class="result-icon">✓</div>
                <div class="result-text" style="color: #28a745;">Serial Number Found!</div>
                <div class="result-serial">${serial}</div>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-error">
                <div class="result-icon">✗</div>
                <div class="result-text" style="color: #dc3545;">Serial Number Not Found</div>
                <div class="result-serial">${serial}</div>
            </div>
        `;
    }

    // Scroll to results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
console.log('Barcode Scanner App initialized!');
