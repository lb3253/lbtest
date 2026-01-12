# Icon Creation Guide for PC Refresh Lookup

## Required Icon Sizes

You'll need to create the following icon files:

1. **favicon-16x16.png** - Browser tab icon (16x16px)
2. **favicon-32x32.png** - Browser tab icon (32x32px)
3. **apple-touch-icon.png** - iOS home screen (180x180px)
4. **icon-192x192.png** - Android home screen (192x192px)
5. **icon-512x512.png** - Android splash screen (512x512px)

## Icon Design Requirements

Your icon should feature:
- **PC/Computer monitor** - representing the PC refresh equipment
- **Magnifying glass** - representing the lookup/search functionality
- **Recycle logo** - representing the refresh/recycle process

### Design Specifications:
- **Colors**: Use Entergy brand colors
  - Primary: #ff1a57 (pink-red)
  - Secondary: #0091da (blue)
  - Background: White or #f1f1f1
- **Style**: Clean, flat design matching the corporate aesthetic
- **Safe Area**: Keep important elements 10% from edges (for rounded corners on mobile)

## Option 1: Create with Canva (Recommended - Free & Easy)

1. Go to [Canva.com](https://www.canva.com)
2. Create a custom size: 512x512 pixels
3. Design your icon:
   - Add a computer monitor shape
   - Overlay a magnifying glass
   - Add a small recycle symbol
   - Use the Entergy colors (#ff1a57 and #0091da)
4. Download as PNG
5. Resize to other needed sizes using the steps below

## Option 2: Use Figma (Professional - Free)

1. Go to [Figma.com](https://www.figma.com)
2. Create a 512x512 frame
3. Design with shapes and icons from Figma's library
4. Export as PNG at different sizes

## Option 3: Use an AI Icon Generator

Try these free tools:
- **Favicon.io** - Generate from text or emoji
- **RealFaviconGenerator.net** - Upload one image, get all sizes
- **Adobe Express** - Free icon maker

## Option 4: Hire a Designer (Fastest)

- **Fiverr**: $5-20 for simple icon design
- **Upwork**: Professional designers available
- Provide them with this guide and the Entergy color codes

## Resizing Your Icon

Once you have a 512x512 PNG, resize it:

### Using Online Tool:
1. Go to [ResizeImage.net](https://resizeimage.net)
2. Upload your 512x512 icon
3. Create versions at: 16x16, 32x32, 180x180, 192x192

### Using Command Line (if you have ImageMagick):
```bash
# Install ImageMagick first
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 180x180 apple-touch-icon.png
convert icon-512x512.png -resize 32x32 favicon-32x32.png
convert icon-512x512.png -resize 16x16 favicon-16x16.png
```

## Quick Start: Use the Placeholder

We've included a temporary SVG placeholder (`icon-placeholder.svg`) that you can use while designing your custom icon. Convert it to PNG:

1. Open icon-placeholder.svg in a browser
2. Take a screenshot or use an online SVG to PNG converter
3. Resize to the needed dimensions

## Testing Your Icons

After creating and placing the icon files in the root directory:

1. **iOS (Safari):**
   - Open the app in Safari
   - Tap Share → Add to Home Screen
   - Check if your icon appears

2. **Android (Chrome):**
   - Open the app in Chrome
   - Tap Menu (⋮) → Add to Home Screen or Install App
   - Check if your icon appears

3. **Browser:**
   - Check the browser tab for the favicon

## Icon Checklist

- [ ] Created 512x512 base icon with PC, magnifying glass, and recycle symbol
- [ ] Used Entergy brand colors (#ff1a57, #0091da)
- [ ] Resized to all required dimensions
- [ ] Placed all PNG files in the root directory (`/home/user/lbtest/`)
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Verified favicon shows in browser

## File Placement

All icon files should be placed in the root directory:
```
/home/user/lbtest/
  ├── favicon-16x16.png
  ├── favicon-32x32.png
  ├── apple-touch-icon.png
  ├── icon-192x192.png
  └── icon-512x512.png
```

## Example Icon Concepts

**Concept 1: Layered**
- Background: Circular gradient (pink to blue)
- Middle: Computer monitor silhouette
- Overlay: Magnifying glass on monitor
- Badge: Small recycle symbol in corner

**Concept 2: Side-by-side**
- Split icon: PC on left, magnifying glass on right
- Recycle arrows as background pattern
- Entergy colors for each element

**Concept 3: Integrated**
- Computer monitor with recycle arrows on screen
- Magnifying glass examining the screen
- Clean white background with pink border

## Need Help?

If you need assistance creating the icon, you can:
1. Ask a colleague with design experience
2. Use the IT design team
3. Hire a freelancer on Fiverr ($5-20)
4. Use the placeholder until you have a custom design
