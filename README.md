# Barcode Scanner - Serial Number Checker

A mobile-friendly web application that scans barcodes and checks if the serial numbers exist in an uploaded Excel file.

## Features

- **Mobile-Optimized**: Responsive design works perfectly on smartphones and tablets
- **Barcode Scanning**: Uses device camera to scan 1D and 2D barcodes
- **Excel Support**: Upload .xlsx, .xls, or .csv files containing serial numbers
- **Manual Entry**: Option to manually enter serial numbers
- **Real-time Validation**: Instant feedback on whether a serial number exists
- **Visual Feedback**: Clear success/error indicators with sound notifications
- **Multiple Format Support**: Supports various barcode formats (QR Code, EAN, UPC, Code 128, etc.)

## How to Use

### 1. Prepare Your Excel File

Create an Excel file (.xlsx, .xls, or .csv) with serial numbers in the **first column**:

```
Serial Number
ABC123456
XYZ789012
DEF345678
GHI901234
```

The first row can be a header (it will be included in the scan).

### 2. Access the Application

Open `index.html` in a web browser, preferably on a mobile device with a camera.

**For local testing:**
```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server
```

Then visit `http://localhost:8000` in your browser.

**For mobile access:**
- Deploy to a web server (GitHub Pages, Netlify, Vercel, etc.)
- Or use your computer's local IP address (e.g., `http://192.168.1.100:8000`)

### 3. Upload Serial Numbers

1. Click "Choose Excel File"
2. Select your Excel file
3. Wait for confirmation that serial numbers are loaded

### 4. Scan Barcodes

**Option A: Use Camera Scanner**
1. Click "Start Scanner"
2. Grant camera permissions when prompted
3. Point camera at barcode
4. App automatically scans and checks the serial number

**Option B: Manual Entry**
1. Type the serial number in the text field
2. Click "Check" or press Enter

### 5. View Results

- **Green checkmark (✓)**: Serial number found in your list
- **Red X (✗)**: Serial number not found
- Audio beep plays when a barcode is successfully scanned

## Browser Requirements

- **Modern browsers** with camera access support (Chrome, Safari, Firefox, Edge)
- **HTTPS required** for camera access (except on localhost)
- **Mobile devices**: iOS Safari 11+, Chrome for Android

## Supported Barcode Formats

- QR Code
- EAN-13, EAN-8
- UPC-A, UPC-E
- Code 128
- Code 39
- Code 93
- ITF (Interleaved 2 of 5)
- Codabar
- And more...

## File Structure

```
barcode-scanner/
├── index.html      # Main HTML file
├── styles.css      # Styling and responsive design
├── app.js          # Application logic
└── README.md       # Documentation
```

## Technologies Used

- **html5-qrcode**: Camera-based barcode scanning library
- **SheetJS (xlsx)**: Excel file parsing
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern, responsive design

## Troubleshooting

**Camera not working:**
- Ensure you've granted camera permissions
- Use HTTPS (required for camera access)
- Try a different browser
- Check if camera is being used by another app

**Excel file not loading:**
- Ensure serial numbers are in the first column
- Check file format (.xlsx, .xls, or .csv)
- Verify the file isn't corrupted

**Serial number not matching:**
- Check for extra spaces or special characters
- Ensure the barcode contains the exact serial number
- Try manual entry to verify

## Privacy & Security

- All processing happens locally in your browser
- No data is sent to any server
- Excel files are not uploaded anywhere
- Camera stream is only used for scanning, not recorded

## License

Free to use and modify for personal and commercial projects.

## Support

For issues or questions, please check the troubleshooting section or inspect the browser console for error messages.
