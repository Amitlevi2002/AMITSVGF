import { parseString } from 'xml2js';
import { IDesignItem, DesignIssue } from '../models/Design';
import fs from 'fs';

export interface ParsedSVGResult {
  svgWidth: number;
  svgHeight: number;
  items: IDesignItem[];
  itemsCount: number;
  coverageRatio: number;
  issues: DesignIssue[];
}

export async function parseSvg(filePath: string): Promise<ParsedSVGResult> {
  console.log('[parseSvg] Starting SVG parsing for:', filePath);
  const startTime = Date.now();

  try {
    console.log('[parseSvg] Reading file...');
    const svgContent = fs.readFileSync(filePath, 'utf-8');
    console.log('[parseSvg] File read, size:', svgContent.length, 'bytes');

    return new Promise((resolve, reject) => {
      console.log('[parseSvg] Parsing XML...');
      parseString(svgContent, (err: any, result: any) => {
        if (err) {
          console.error('[parseSvg] XML parsing error:', err);
          reject(err);
          return;
        }

        console.log('[parseSvg] XML parsed successfully');

        let svgWidth = 0;
        let svgHeight = 0;
        const items: IDesignItem[] = [];
        const issues: DesignIssue[] = [];

        // Extract SVG dimensions
        console.log('[parseSvg] Extracting SVG dimensions...');
        const svgElement = result.svg || result;
        if (svgElement?.$) {
          // Try to get width and height from attributes
          const widthAttr = svgElement.$.width;
          const heightAttr = svgElement.$.height;

          if (widthAttr) {
            svgWidth = parseFloat(widthAttr.toString().replace(/[^\d.]/g, ''));
          }
          if (heightAttr) {
            svgHeight = parseFloat(heightAttr.toString().replace(/[^\d.]/g, ''));
          }

          // If width/height not found, try to extract from viewBox
          if (svgElement.$['viewBox']) {
            const viewBoxStr = svgElement.$['viewBox'].toString();
            const viewBox = viewBoxStr.split(/[\s,]+/).map(parseFloat).filter((n: number) => !isNaN(n));
            if (viewBox.length === 4) {
              // viewBox format: "x y width height"
              if (svgWidth === 0 || isNaN(svgWidth)) svgWidth = viewBox[2];
              if (svgHeight === 0 || isNaN(svgHeight)) svgHeight = viewBox[3];
            }
          }
        }

        // Fallback: if dimensions are still 0, use defaults
        if ((svgWidth === 0 || isNaN(svgWidth)) && (svgHeight === 0 || isNaN(svgHeight))) {
          svgWidth = 100;
          svgHeight = 100;
        }

        console.log('[parseSvg] SVG dimensions:', svgWidth, 'x', svgHeight);

        // Track visited elements to prevent infinite loops
        const visited = new WeakSet();
        const MAX_RECURSION_DEPTH = 100;
        let totalElementsCount = 0; // Count all SVG elements

        function extractAllElements(element: any, depth: number = 0): void {
          if (!element || depth > MAX_RECURSION_DEPTH) {
            if (depth > MAX_RECURSION_DEPTH) {
              console.warn('[parseSvg] Max recursion depth reached, stopping');
            }
            return;
          }

          // Prevent processing the same element twice
          if (visited.has(element)) {
            return;
          }
          visited.add(element);

          // Count all SVG elements (rect, path, circle, ellipse, polygon, polyline, line, text, etc.)
          const elementTypes = ['rect', 'path', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'use', 'image'];
          elementTypes.forEach((type) => {
            if (element[type]) {
              const elements = Array.isArray(element[type]) ? element[type] : [element[type]];
              totalElementsCount += elements.length;
            }
          });

          // Extract rect elements for coverage calculation and items list
          if (element.rect) {
            const rects = Array.isArray(element.rect) ? element.rect : [element.rect];
            rects.forEach((rect: any) => {
              const x = parseFloat(rect.$.x || '0');
              const y = parseFloat(rect.$.y || '0');
              const width = parseFloat(rect.$.width || '0');
              const height = parseFloat(rect.$.height || '0');
              const fill = rect.$.fill || '#000000';

              // OUT_OF_BOUNDS detection - O(1) per rectangle
              const isOutOfBounds = 
                x < 0 ||
                y < 0 ||
                x + width > svgWidth ||
                y + height > svgHeight;

              const item: IDesignItem = {
                x,
                y,
                width,
                height,
                fill,
              };

              if (isOutOfBounds) {
                item.issue = 'OUT_OF_BOUNDS';
              }

              items.push(item);
            });
          }

          // Recursively process children (groups, svg, etc.)
          if (element.g) {
            const groups = Array.isArray(element.g) ? element.g : [element.g];
            groups.forEach((group: any) => {
              extractAllElements(group, depth + 1);
            });
          }

          // Only process nested SVG if it's not the root
          if (element.svg && depth > 0) {
            const svgs = Array.isArray(element.svg) ? element.svg : [element.svg];
            svgs.forEach((svg: any) => {
              extractAllElements(svg, depth + 1);
            });
          }
        }

        try {
          console.log('[parseSvg] Extracting all SVG elements...');
          extractAllElements(result, 0);
          console.log('[parseSvg] Total elements found:', totalElementsCount);
          console.log('[parseSvg] Rectangles found:', items.length);

          // Detect EMPTY issue - O(1) - check if no elements at all
          if (totalElementsCount === 0) {
            issues.push('EMPTY');
          }

          // Detect OUT_OF_BOUNDS issue - O(n) single pass (only for rectangles)
          const hasOutOfBounds = items.some(item => item.issue === 'OUT_OF_BOUNDS');
          if (hasOutOfBounds) {
            issues.push('OUT_OF_BOUNDS');
          }

          // Calculate coverage ratio - O(n) single reduce (only for rectangles)
          console.log('[parseSvg] Calculating coverage ratio...');
          const totalRectArea = items.reduce((sum, item) => {
            return sum + (item.width * item.height);
          }, 0);

          const svgArea = svgWidth * svgHeight;
          const coverageRatio = svgArea > 0 ? totalRectArea / svgArea : 0;

          // Use total elements count instead of just rectangles
          const itemsCount = totalElementsCount;

          const elapsed = Date.now() - startTime;
          console.log('[parseSvg] Parsing completed in', elapsed, 'ms');
          console.log('[parseSvg] Total elements:', itemsCount, 'Rectangles:', items.length, 'Coverage:', (coverageRatio * 100).toFixed(2) + '%');

          resolve({
            svgWidth,
            svgHeight,
            items,
            itemsCount,
            coverageRatio,
            issues,
          });
        } catch (error) {
          console.error('[parseSvg] Error during extraction:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('[parseSvg] File read error:', error);
    throw error;
  }
}
