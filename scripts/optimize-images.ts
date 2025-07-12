import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora from 'ora';

interface ImageOptimizationOptions {
  inputDir: string;
  outputDir: string;
  formats: ('webp' | 'avif' | 'original')[];
  sizes: number[];
  quality: number;
  preserveOriginal: boolean;
}

class ImageOptimizer {
  private totalSaved = 0;
  private processedCount = 0;

  async optimize(options: ImageOptimizationOptions) {
    const {
      inputDir,
      outputDir,
      formats = ['webp', 'original'],
      sizes = [320, 640, 768, 1024, 1280, 1920],
      quality = 80,
      preserveOriginal = true,
    } = options;

    console.log(chalk.blue('🖼️  Starting image optimization...\n'));

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Find all images
    const patterns = ['**/*.{jpg,jpeg,png,gif}'];
    const images = await glob(patterns, {
      cwd: inputDir,
      nodir: true,
    });

    console.log(chalk.yellow(`Found ${images.length} images to optimize\n`));

    // Process each image
    for (const imagePath of images) {
      await this.processImage(
        path.join(inputDir, imagePath),
        outputDir,
        imagePath,
        { formats, sizes, quality, preserveOriginal }
      );
    }

    // Summary
    this.displaySummary();
  }

  private async processImage(
    inputPath: string,
    outputDir: string,
    relativePath: string,
    options: Pick<ImageOptimizationOptions, 'formats' | 'sizes' | 'quality' | 'preserveOriginal'>
  ) {
    const spinner = ora(`Processing ${relativePath}`).start();

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const originalSize = fs.statSync(inputPath).size;

      // Create output subdirectory
      const outputSubdir = path.join(outputDir, path.dirname(relativePath));
      if (!fs.existsSync(outputSubdir)) {
        fs.mkdirSync(outputSubdir, { recursive: true });
      }

      const baseName = path.basename(relativePath, path.extname(relativePath));
      let totalNewSize = 0;

      // Generate responsive sizes
      for (const width of options.sizes) {
        // Skip if image is smaller than target size
        if (metadata.width && metadata.width < width) continue;

        // Process each format
        for (const format of options.formats) {
          const outputPath = this.getOutputPath(
            outputSubdir,
            baseName,
            width,
            format,
            path.extname(relativePath)
          );

          await this.saveOptimized(
            image,
            outputPath,
            width,
            format,
            options.quality
          );

          totalNewSize += fs.statSync(outputPath).size;
        }
      }

      // Save original size if needed
      if (options.preserveOriginal && metadata.width) {
        for (const format of options.formats) {
          if (format === 'original') continue;
          
          const outputPath = this.getOutputPath(
            outputSubdir,
            baseName,
            metadata.width,
            format,
            path.extname(relativePath)
          );

          await this.saveOptimized(
            image,
            outputPath,
            metadata.width,
            format,
            options.quality
          );

          totalNewSize += fs.statSync(outputPath).size;
        }
      }

      const saved = originalSize - totalNewSize;
      this.totalSaved += saved;
      this.processedCount++;

      spinner.succeed(
        `${relativePath} - Saved ${this.formatSize(saved)} (${Math.round((saved / originalSize) * 100)}%)`
      );
    } catch (error) {
      spinner.fail(`Failed to process ${relativePath}: ${error.message}`);
    }
  }

  private getOutputPath(
    dir: string,
    baseName: string,
    width: number,
    format: string,
    originalExt: string
  ): string {
    if (format === 'original') {
      return path.join(dir, `${baseName}-${width}w${originalExt}`);
    }
    return path.join(dir, `${baseName}-${width}w.${format}`);
  }

  private async saveOptimized(
    image: sharp.Sharp,
    outputPath: string,
    width: number,
    format: string,
    quality: number
  ) {
    let pipeline = image.clone().resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 6 });
        break;
      case 'original':
        const ext = path.extname(outputPath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality, progressive: true });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ quality, compressionLevel: 9 });
        }
        break;
    }

    await pipeline.toFile(outputPath);
  }

  private formatSize(bytes: number): string {
    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  }

  private displaySummary() {
    console.log(chalk.green('\n✅ Optimization Complete!\n'));
    console.log(chalk.blue('Summary:'));
    console.log(`  • Images processed: ${this.processedCount}`);
    console.log(`  • Total space saved: ${this.formatSize(this.totalSaved)}`);
    console.log(`  • Average saving: ${this.formatSize(this.totalSaved / this.processedCount)}`);
  }
}

// Generate picture element HTML
export function generatePictureElement(
  imagePath: string,
  alt: string,
  sizes: string = '100vw',
  className?: string
): string {
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const widths = [320, 640, 768, 1024, 1280, 1920];

  const webpSrcset = widths
    .map(w => `/images/${baseName}-${w}w.webp ${w}w`)
    .join(', ');

  const fallbackSrcset = widths
    .map(w => `/images/${baseName}-${w}w${path.extname(imagePath)} ${w}w`)
    .join(', ');

  return `
<picture>
  <source
    type="image/webp"
    srcset="${webpSrcset}"
    sizes="${sizes}"
  />
  <source
    srcset="${fallbackSrcset}"
    sizes="${sizes}"
  />
  <img
    src="/images/${baseName}-1024w${path.extname(imagePath)}"
    alt="${alt}"
    loading="lazy"
    decoding="async"
    ${className ? `class="${className}"` : ''}
  />
</picture>
  `.trim();
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options: ImageOptimizationOptions = {
    inputDir: args[0] || './client/public/images',
    outputDir: args[1] || './client/public/images/optimized',
    formats: ['webp', 'original'],
    sizes: [320, 640, 768, 1024, 1280, 1920],
    quality: 80,
    preserveOriginal: true,
  };

  const optimizer = new ImageOptimizer();
  optimizer.optimize(options).catch(console.error);
}

export { ImageOptimizer };