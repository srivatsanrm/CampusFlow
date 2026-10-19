/**
 * Client-side PDF text extraction and syllabus parser
 */

export interface ExtractedUnit {
  title: string;
  topics: Array<{
    title: string;
    estimated_periods: number;
  }>;
}

export interface ExtractedSyllabus {
  units: ExtractedUnit[];
  rawTextPreview: string;
  totalTopics: number;
}

/**
 * Heuristic parser that identifies Units, Modules, Chapters and Topics
 * from raw syllabus text lines.
 */
export function parseSyllabusText(text: string): ExtractedSyllabus {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const units: ExtractedUnit[] = [];
  let currentUnit: ExtractedUnit = {
    title: 'Unit 1: Fundamentals',
    topics: [],
  };

  const unitRegex = /^(?:unit|module|chapter|part)\s*[-:]?\s*([0-9ivxlc]+|\w+)\s*[-:]?\s*(.*)$/i;
  const bulletRegex = /^(?:[-*•●]|\d+[\.\)]|[a-z][\.\)])\s*(.*)$/i;

  let unitCount = 0;

  for (const line of lines) {
    // Check if line indicates a new Unit/Module
    const unitMatch = line.match(unitRegex);
    if (unitMatch) {
      if (currentUnit.topics.length > 0) {
        units.push(currentUnit);
      }
      unitCount++;
      const unitNumber = unitMatch[1];
      const unitTitle = unitMatch[2] ? unitMatch[2].trim() : `Topic Group ${unitCount}`;
      currentUnit = {
        title: `Unit ${unitNumber}: ${unitTitle || 'Overview'}`,
        topics: [],
      };
      continue;
    }

    // Check if it's a topic item (bulleted or numbered)
    const bulletMatch = line.match(bulletRegex);
    let topicTitle = '';
    if (bulletMatch) {
      topicTitle = bulletMatch[1].trim();
    } else if (line.length > 3 && line.length < 120 && !line.toLowerCase().startsWith('syllabus') && !line.toLowerCase().startsWith('course code')) {
      // Possible comma or dash separated topics or standalone topic line
      topicTitle = line;
    }

    if (topicTitle) {
      // If the line contains comma or semicolon separated sub-topics, split them cleanly if reasonable
      if (topicTitle.includes(';') || (topicTitle.split(',').length > 1 && topicTitle.length > 60)) {
        const subItems = topicTitle.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2);
        for (const sub of subItems) {
          currentUnit.topics.push({
            title: sub,
            estimated_periods: 1,
          });
        }
      } else {
        currentUnit.topics.push({
          title: topicTitle,
          estimated_periods: 1,
        });
      }
    }
  }

  // Push last unit if has topics
  if (currentUnit.topics.length > 0) {
    units.push(currentUnit);
  }

  // Fallback if no units detected
  if (units.length === 0 && lines.length > 0) {
    units.push({
      title: 'Unit 1: General Syllabus',
      topics: lines.slice(0, 20).map((l) => ({
        title: l.replace(bulletRegex, '$1').trim(),
        estimated_periods: 1,
      })),
    });
  }

  const totalTopics = units.reduce((sum, u) => sum + u.topics.length, 0);

  return {
    units,
    rawTextPreview: lines.slice(0, 30).join('\n'),
    totalTopics,
  };
}

/**
 * Extracts readable text from an ArrayBuffer using pdfjs-dist
 */
export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Dynamically import pdfjs-dist in browser context
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let fullText = '';

  for (let i = 1; i <= Math.min(numPages, 10); i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // @ts-expect-error item has str property
      .map((item) => item.str || '')
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
