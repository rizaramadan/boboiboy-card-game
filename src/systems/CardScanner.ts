import Tesseract from 'tesseract.js';

export interface ScanResult {
  attack: number;
  health: number;
  characterImage: string | null;
}

export class CardScanner {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    this.worker = await Tesseract.createWorker('eng');
  }

  async scanCard(imageData: string | null): Promise<ScanResult> {
    // If no image provided, return demo values
    if (!imageData) {
      return this.getDemoValues();
    }

    try {
      // Initialize worker if needed
      if (!this.worker) {
        await this.initialize();
      }

      // Perform OCR
      const result = await this.worker!.recognize(imageData);
      const text = result.data.text;

      // Extract numbers from the card
      const numbers = this.extractNumbers(text);

      // Try to identify attack and health values
      const { attack, health } = this.parseCardStats(text, numbers);

      // Extract character image (simplified - returns the whole image for now)
      const characterImage = await this.extractCharacter(imageData);

      return {
        attack,
        health,
        characterImage,
      };
    } catch (error) {
      console.error('Card scanning failed:', error);
      return this.getDemoValues();
    }
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
    // For now, return the original image
    // A more sophisticated implementation would:
    // 1. Detect the card borders
    // 2. Find the character artwork area
    // 3. Use background removal or edge detection
    // 4. Return just the character portion

    // TODO: Implement proper character extraction using Canvas API
    // or a background removal library

    return imageData;
  }

  private getDemoValues(): ScanResult {
    // Return randomized demo values for testing
    return {
      attack: 30 + Math.floor(Math.random() * 40), // 30-70
      health: 80 + Math.floor(Math.random() * 40), // 80-120
      characterImage: null,
    };
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
