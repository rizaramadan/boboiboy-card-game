# App Icons

SVG icons have been generated. To convert them to PNG:

## Option 1: Online Converter
1. Visit https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Download the PNG files

## Option 2: Using ImageMagick (if installed)
```bash
for file in *.svg; do
  convert "$file" "${file%.svg}.png"
done
```

## Option 3: Using Browser
The service worker will serve the SVG files, which work fine for PWAs.
Modern browsers support SVG icons in web app manifests.
