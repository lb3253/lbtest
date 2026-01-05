// Global variables
let serialNumbers = [];
let html5QrcodeScanner = null;
let isScanning = false;

// DOM Elements
const excelFileInput = document.getElementById('excelFile');
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

// Handle Excel file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

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

    const config = {
        fps: 10,
        qrbox: { width: 200, height: 120 },
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
    // Stop scanning temporarily to avoid multiple scans
    stopScanning();

    // Check the scanned serial number
    checkSerialNumber(decodedText);

    // Play a beep sound (optional)
    playBeep();
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
