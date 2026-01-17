import Tesseract from 'tesseract.js';

export interface ScanResult {
  attack: number;
  health: number;
  characterImage: string | null;
}

interface StoredCardData extends ScanResult {
  timestamp: number;
}

export type ProgressCallback = (status: string) => void;

const STORAGE_KEY = 'boboiboy_scanned_card';
const OCR_TIMEOUT_MS = 10000; // 10 second timeout

export class CardScanner {
  private worker: Tesseract.Worker | null = null;

  async initialize(onProgress?: ProgressCallback): Promise<void> {
    onProgress?.('Initializing OCR engine...');
    this.worker = await Tesseract.createWorker('eng');
  }

  async scanCard(imageData: string | null, onProgress?: ProgressCallback): Promise<ScanResult> {
    // If no image provided, return demo values
    if (!imageData) {
      return this.getDemoValues();
    }

    try {
      // Initialize worker if needed
      if (!this.worker) {
        await this.initialize(onProgress);
      }

      onProgress?.('Analyzing card...');

      // Resize image for faster OCR processing
      const resizedImage = await this.resizeImage(imageData, 800);

      // Perform OCR with timeout protection
      const result = await this.recognizeWithTimeout(resizedImage, OCR_TIMEOUT_MS);
      const text = result.data.text;

      onProgress?.('Extracting stats...');

      // Extract numbers from the card
      const numbers = this.extractNumbers(text);

      // Try to identify attack and health values
      const { attack, health } = this.parseCardStats(text, numbers);

      // Extract character image (simplified - returns the whole image for now)
      onProgress?.('Processing character image...');
      const characterImage = await this.extractCharacter(imageData);

      const scanResult: ScanResult = {
        attack,
        health,
        characterImage,
      };

      // Save to localStorage
      this.saveToLocalStorage(scanResult);

      return scanResult;
    } catch (error) {
      console.error('Card scanning failed:', error);
      onProgress?.('Scan failed, using default values...');
      return this.getDemoValues();
    }
  }

  private async recognizeWithTimeout(
    imageData: string,
    timeoutMs: number
  ): Promise<Tesseract.RecognizeResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('OCR timeout'));
      }, timeoutMs);

      this.worker!.recognize(imageData)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async resizeImage(imageData: string, maxWidth: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        // Return original on error
        resolve(imageData);
      };
      img.src = imageData;
    });
  }

  private extractNumbers(text: string): number[] {
    const numberPattern = /\d+/g;
    const matches = text.match(numberPattern);
    return matches ? matches.map(n => parseInt(n, 10)) : [];
  }

  private parseCardStats(text: string, numbers: number[]): { attack: number; health: number } {
    const lowerText = text.toLowerCase();

    let attack = 45; // Default
    let health = 100; // Default

    // Look for labeled values
    const attackMatch = lowerText.match(/(?:attack|atk|power)[:\s]*(\d+)/i);
    const healthMatch = lowerText.match(/(?:health|hp|life)[:\s]*(\d+)/i);

    if (attackMatch) {
      attack = parseInt(attackMatch[1], 10);
    }
    if (healthMatch) {
      health = parseInt(healthMatch[1], 10);
    }

    // If no labeled values found, use first two numbers
    if (!attackMatch && !healthMatch && numbers.length >= 2) {
      // Assume smaller number is attack, larger is health
      const sorted = [...numbers].sort((a, b) => a - b);
      attack = sorted[0];
      health = sorted[sorted.length - 1];
    } else if (!attackMatch && !healthMatch && numbers.length === 1) {
      attack = numbers[0];
    }

    // Clamp values to reasonable ranges
    attack = Math.max(10, Math.min(200, attack));
    health = Math.max(20, Math.min(500, health));

    return { attack, health };
  }

  private async extractCharacter(imageData: string): Promise<string | null> {
    // Resize the image to 100x100 for hero display
    // A more sophisticated implementation would:
    // 1. Detect the card borders
    // 2. Find the character artwork area
    // 3. Use background removal or edge detection
    // 4. Return just the character portion

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 100;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Calculate crop to get center square from the image
          const minDim = Math.min(img.width, img.height);
          const cropX = (img.width - minDim) / 2;
          const cropY = (img.height - minDim) / 2;

          // Draw center-cropped and scaled image
          ctx.drawImage(
            img,
            cropX, cropY, minDim, minDim,  // Source crop (center square)
            0, 0, targetSize, targetSize    // Destination (100x100)
          );
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        resolve(imageData); // Return original on error
      };
      img.src = imageData;
    });
  }

  private getDemoValues(): ScanResult {
    // Return randomized demo values for testing
    return {
      attack: 30 + Math.floor(Math.random() * 40), // 30-70
      health: 80 + Math.floor(Math.random() * 40), // 80-120
      characterImage: null,
    };
  }

  // localStorage persistence methods
  saveToLocalStorage(result: ScanResult): void {
    const data: StoredCardData = {
      ...result,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Card data saved to localStorage');
    } catch (error) {
      console.error('Failed to save card data:', error);
    }
  }

  loadFromLocalStorage(): ScanResult | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StoredCardData = JSON.parse(stored);
      console.log('Loaded card data from localStorage:', data);

      return {
        attack: data.attack,
        health: data.health,
        characterImage: data.characterImage,
      };
    } catch (error) {
      console.error('Failed to load card data:', error);
      return null;
    }
  }

  clearLocalStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Card data cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear card data:', error);
    }
  }

  hasSavedCard(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
