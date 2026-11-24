function createMockPage(pageNumber: number, accent: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1140" viewBox="0 0 800 1140">
  <rect width="800" height="1140" fill="#fafafa"/>
  <rect x="28" y="28" width="744" height="1084" fill="none" stroke="#171717" stroke-width="6"/>
  <rect x="48" y="48" width="704" height="310" fill="${accent}" fill-opacity="0.16" stroke="#171717" stroke-width="5"/>
  <rect x="48" y="382" width="340" height="340" fill="#f5f5f5" stroke="#171717" stroke-width="5"/>
  <rect x="412" y="382" width="340" height="340" fill="${accent}" fill-opacity="0.08" stroke="#171717" stroke-width="5"/>
  <rect x="48" y="746" width="704" height="346" fill="#ffffff" stroke="#171717" stroke-width="5"/>
  <text x="400" y="218" font-family="sans-serif" font-size="72" font-weight="700" text-anchor="middle" fill="#171717">PAGE ${pageNumber}</text>
  <text x="400" y="930" font-family="sans-serif" font-size="28" text-anchor="middle" fill="#525252">Manga Reader Story Preview</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MOCK_PAGES = [
    createMockPage(1, '#2563eb'),
    createMockPage(2, '#dc2626'),
    createMockPage(3, '#059669'),
    createMockPage(4, '#d97706'),
    createMockPage(5, '#7c3aed'),
    createMockPage(6, '#0891b2'),
];

export const MOCK_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ca', label: 'Catalan' },
];
