import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

/** One PNG of the extension icon */
interface IconSpec {
    /** Where the PNG goes, from the root of the project */
    readonly path: string;
    /** Width and height in pixels */
    readonly size: number;
    /** Transparent border on each side */
    readonly padding: number;
    /** Multiplier of the glyph line widths: small sizes need bolder lines */
    readonly strokeScale: number;
}

/** The brand glyph «rq»: IconNames.BRAND of shared/ui/Icon, drawn in a 20 × 20 box */
const BRAND_GLYPH =
    'M1.5 13.25V4M1.5 7.75c0-2.4 1.9-3.75 5-3.75M13.75 4a4.625 4.625 0 1 0 0 9.25a4.625 4.625 0 1 0 0-9.25zM18.375 4V17.6';

/** Line width of the glyph in units of its box at 128 px and up */
const STROKE_WIDTH = 1.75;

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** The store wants 96 of the 128 pixels drawn and the rest transparent; the small sizes fill their square */
const ICONS: readonly IconSpec[] = [
    { path: 'public/icons/icon-16.png', size: 16, padding: 0, strokeScale: 1.25 },
    { path: 'public/icons/icon-32.png', size: 32, padding: 0, strokeScale: 1.1 },
    { path: 'public/icons/icon-48.png', size: 48, padding: 2, strokeScale: 1.05 },
    { path: 'public/icons/icon-128.png', size: 128, padding: 16, strokeScale: 1 },
    { path: 'store/images/edge-logo.png', size: 300, padding: 0, strokeScale: 1 },
];

const COLORS = {
    TILE: '#1f6feb',
    GLYPH: '#ffffff',
} as const;

const GLYPH_BOX = 20;

const GLYPH_SHARE = 0.76;

const CORNER_SHARE = 0.22;

const PAGE_STYLE = '<style>html, body { margin: 0; background: transparent; }</style>';

const buildIconSvg = ({ size, padding, strokeScale }: IconSpec): string => {
    const tile = size - padding * 2;
    const glyph = tile * GLYPH_SHARE;
    const offset = padding + (tile - glyph) / 2;
    const scale = glyph / GLYPH_BOX;

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
        `<rect x="${padding}" y="${padding}" width="${tile}" height="${tile}" rx="${tile * CORNER_SHARE}" fill="${COLORS.TILE}"/>`,
        `<g transform="translate(${offset} ${offset}) scale(${scale})"`,
        ` fill="none" stroke="${COLORS.GLYPH}" stroke-width="${STROKE_WIDTH * strokeScale}" stroke-linecap="round" stroke-linejoin="round">`,
        `<path d="${BRAND_GLYPH}"/></g></svg>`,
    ].join('');
};

const renderIcons = async (): Promise<void> => {
    const browser = await chromium.launch({ channel: 'chromium' });

    for (const icon of ICONS) {
        const path = join(ROOT, icon.path);
        const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size }, deviceScaleFactor: 1 });

        mkdirSync(dirname(path), { recursive: true });

        await page.setContent(`${PAGE_STYLE}${buildIconSvg(icon)}`);
        await page.screenshot({ path, omitBackground: true });
        await page.close();
    }

    await browser.close();
};

await renderIcons();
