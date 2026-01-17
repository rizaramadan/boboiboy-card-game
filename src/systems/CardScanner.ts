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
const OPENROUTER_TIMEOUT_MS = 30000; // 30 second timeout for image generation

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash-image';

const CHARACTER_EXTRACTION_PROMPT = `Analyze the attached photo of the card. I need a clean, flat vector asset of just the character for a game icon.

Task: Create a 1:1 aspect ratio image (suitable for 100x100px) of the character based on the visual design in the card. Style: Flat 2D vector art, minimalist, clean lines, no gradients, no shading. Constraints:

Isolate the character completely (remove the card background, text, numbers, and the hand/fingers).

Ensure the character is fully visible and centered.

Output on a solid white background (or transparent if supported).

The design must be simple enough to remain legible when resized to 100x100 pixels`;

export class CardScanner {
  private worker: Tesseract.Worker | null = null;
  private apiKey: string | null = null;

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  getApiKey(): string | null {
    // Try to load from localStorage if not set
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('openrouter_api_key');
    }
    return this.apiKey;
  }

  saveApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openrouter_api_key', key);
  }

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

      // Extract character image using OpenRouter AI
      onProgress?.('Generating character icon with AI...');
      const characterImage = await this.extractCharacterWithAI(imageData, onProgress);

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

  private async extractCharacterWithAI(imageData: string, onProgress?: ProgressCallback): Promise<string | null> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('No OpenRouter API key set, falling back to simple extraction');
      onProgress?.('No API key, using simple crop...');
      return this.extractCharacterSimple(imageData);
    }

    try {
      onProgress?.('Sending to AI for character extraction...');

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://boboiboy-card-game.local',
          'X-Title': 'BoBoiBoy Card Game',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: CHARACTER_EXTRACTION_PROMPT,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenRouter response:', data);

      // Extract the generated image from the response
      // The response format may contain base64 image data
      const generatedImage = this.extractImageFromResponse(data);

      if (generatedImage) {
        onProgress?.('AI character generated successfully!');
        return generatedImage;
      }

      // Fallback to simple extraction if no image in response
      console.warn('No image in API response, falling back to simple extraction');
      onProgress?.('AI response had no image, using fallback...');
      return this.extractCharacterSimple(imageData);

    } catch (error) {
      console.error('AI extraction failed:', error);
      onProgress?.('AI extraction failed, using fallback...');
      return this.extractCharacterSimple(imageData);
    }
  }

  private extractImageFromResponse(data: any): string | null {
    try {
      console.log('Full API response:', JSON.stringify(data, null, 2));

      // Check for image in the response content
      const choices = data.choices || [];
      console.log('Number of choices:', choices.length);

      for (const choice of choices) {
        const message = choice.message;
        if (!message) {
          console.log('No message in choice:', choice);
          continue;
        }

        console.log('Message structure:', JSON.stringify(message, null, 2));

        // Check for images array in message (Gemini/OpenRouter format)
        // Format: message.images[].image_url.url
        if (message.images && Array.isArray(message.images)) {
          console.log('Found images array with', message.images.length, 'images');
          for (const img of message.images) {
            if (img.type === 'image_url' && img.image_url?.url) {
              console.log('Found image_url in images array');
              return img.image_url.url;
            }
            // Direct URL in image object
            if (img.url && img.url.startsWith('data:image')) {
              console.log('Found direct url in images array');
              return img.url;
            }
          }
        }

        const content = message.content;

        // If content is a string, check if it's a base64 image
        if (typeof content === 'string') {
          console.log('Content is string, length:', content.length);
          console.log('Content preview:', content.substring(0, 200));

          if (content.startsWith('data:image')) {
            console.log('Found data URL image directly');
            return content;
          }
          // Check if it contains a base64 image pattern
          const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
          if (base64Match) {
            console.log('Found embedded base64 image');
            return base64Match[0];
          }
        }

        // If content is an array (multimodal response)
        if (Array.isArray(content)) {
          console.log('Content is array with', content.length, 'parts');
          for (let i = 0; i < content.length; i++) {
            const part = content[i];
            console.log(`Part ${i} type:`, part.type, 'keys:', Object.keys(part));

            // Standard OpenAI format
            if (part.type === 'image_url' && part.image_url?.url) {
              console.log('Found image_url format');
              return part.image_url.url;
            }

            // Anthropic format
            if (part.type === 'image' && part.source?.data) {
              console.log('Found Anthropic image format');
              const mimeType = part.source.media_type || 'image/png';
              return `data:${mimeType};base64,${part.source.data}`;
            }

            // Google/Gemini inline_data format
            if (part.type === 'image' && part.inline_data) {
              console.log('Found Gemini inline_data format');
              const mimeType = part.inline_data.mime_type || 'image/png';
              return `data:${mimeType};base64,${part.inline_data.data}`;
            }

            // Direct inline_data without type wrapper
            if (part.inline_data?.data) {
              console.log('Found direct inline_data');
              const mimeType = part.inline_data.mime_type || 'image/png';
              return `data:${mimeType};base64,${part.inline_data.data}`;
            }

            // Check for b64_json or url in part directly
            if (part.b64_json) {
              console.log('Found b64_json format');
              return `data:image/png;base64,${part.b64_json}`;
            }
            if (part.url && part.url.startsWith('data:image')) {
              console.log('Found url with data image');
              return part.url;
            }
          }
        }
      }

      console.log('No image found in any known format');
    } catch (error) {
      console.error('Error parsing API response:', error);
    }
    return null;
  }

  private async extractCharacterSimple(imageData: string): Promise<string | null> {
    // Fallback: Resize the image to 100x100 for hero display
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

  hasApiKey(): boolean {
    return this.getApiKey() !== null;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
