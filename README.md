# PC Refresh Lookup

A mobile-friendly web application for scanning asset barcodes and verifying serial numbers during PC refresh operations. Styled with Entergy branding.

## Features

- **Mobile-Optimized**: Responsive design works perfectly on smartphones and tablets
- **Barcode Scanning**: Uses device camera to scan 1D and 2D barcodes (optimized for thin horizontal barcodes)
- **Excel Support**: Upload .xlsx, .xls, or .csv files containing serial numbers
- **Manual Entry**: Option to manually enter serial numbers
- **Persistent Storage**: Two storage modes available:
  - **LocalStorage Mode** (default): Saves serial numbers in browser, no server required
  - **Backend Mode**: Upload once to server, available to all users
- **Real-time Validation**: Instant feedback on whether a serial number exists
- **Visual Feedback**: Clear success/error indicators with sound notifications
- **Multiple Format Support**: Supports various barcode formats (QR Code, EAN, UPC, Code 128, etc.)
- **Entergy Branding**: Clean corporate design matching Entergy.com styling

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

### 2. Choose Your Deployment Mode

## Deployment Options

### Option A: LocalStorage Mode (Default - No Server Required)

This mode saves serial numbers in the browser's localStorage. Perfect for single-user scenarios.

**Pros:**
- No server setup required
- Works offline after initial load
- Simple to deploy

**Cons:**
- Data only available on the device used to upload
- Each user must upload their own Excel file

**Setup:**
1. Open `app.js` and ensure `CONFIG.USE_BACKEND = false`
2. Deploy the files to any web server or run locally:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js http-server
npx http-server
```
3. Visit `http://localhost:8000` in your browser

### Option B: Backend Mode (Recommended for Teams)

This mode uploads serial numbers to a Node.js server, making them available to all users.

**Pros:**
- Upload once, available to everyone
- Centralized data management
- Better for team environments

**Cons:**
- Requires Node.js server setup
- Needs server hosting

**Setup:**

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Configure the frontend:**
   - Open `app.js`
   - Set `CONFIG.USE_BACKEND = true`
   - Update `CONFIG.API_URL` if needed (default: `http://localhost:3000/api`)

3. **Start the server:**
```bash
npm start
```

The server will start on `http://localhost:3000`

4. **Production deployment:**
   - Deploy to any Node.js hosting service (Heroku, AWS, DigitalOcean, etc.)
   - Update `CONFIG.API_URL` in `app.js` to your production server URL
   - Ensure CORS is configured for your domain

**Server API Endpoints:**
- `GET /api/serials` - Retrieve all serial numbers
- `POST /api/upload` - Upload Excel file with serial numbers
- `DELETE /api/serials` - Clear all serial numbers
- `GET /api/status` - Check server status

**For mobile access (both modes):**
- Use HTTPS in production (required for camera access)
- For local network testing, use your computer's IP address (e.g., `http://192.168.1.100:3000`)

### 3. Upload Serial Numbers

1. Click "CHOOSE EXCEL FILE"
2. Select your Excel file
3. Wait for confirmation that serial numbers are loaded
4. Serial numbers are now saved (in browser or on server, depending on mode)
5. Click "Clear Stored Data" if you need to upload a new list

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
