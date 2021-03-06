import {isUrlInList} from '../utils/url';
import {createTextRule} from './text-style';
import {applyFilterToColor} from './utils/matrix';
import {FilterConfig, StaticTheme} from '../definitions';

interface ThemeColors {
    [prop: string]: number[];
    neutralBg: number[];
    neutralText: number[];
    redBg: number[];
    redText: number[];
    greenBg: number[];
    greenText: number[];
    blueBg: number[];
    blueText: number[];
    fadeBg: number[];
    fadeText: number[];
}

const darkTheme: ThemeColors = {
    neutralBg: [16, 20, 23],
    neutralText: [167, 158, 139],
    redBg: [64, 12, 32],
    redText: [247, 142, 102],
    greenBg: [32, 64, 48],
    greenText: [128, 204, 148],
    blueBg: [32, 48, 64],
    blueText: [128, 182, 204],
    fadeBg: [16, 20, 23, 0.5],
    fadeText: [167, 158, 139, 0.5],
};

const lightTheme: ThemeColors = {
    neutralBg: [255, 242, 228],
    neutralText: [0, 0, 0],
    redBg: [255, 85, 170],
    redText: [140, 14, 48],
    greenBg: [192, 255, 170],
    greenText: [0, 128, 0],
    blueBg: [173, 215, 229],
    blueText: [28, 16, 171],
    fadeBg: [0, 0, 0, 0.5],
    fadeText: [0, 0, 0, 0.5],
};

function rgb([r, g, b, a]: number[]) {
    if (typeof a === 'number') {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
}

function mix(color1: number[], color2: number[], t: number) {
    return color1.map((c, i) => Math.round(c * (1 - t) + color2[i] * t));
}

export default function createStaticStylesheet(config: FilterConfig, url: string, staticThemes: StaticTheme[]) {
    const srcTheme = config.mode === 1 ? darkTheme : lightTheme;
    const theme = Object.entries(srcTheme).reduce((t, [prop, color]) => {
        t[prop] = applyFilterToColor(color, {...config, mode: 0});
        return t;
    }, {} as ThemeColors);

    const commonTheme = getCommonTheme(staticThemes);
    const siteTheme = getThemeFor(url, staticThemes);

    const lines: string[] = [];

    if (!siteTheme || !siteTheme.noCommon) {
        lines.push('/* Common theme */');
        lines.push(...ruleGenerators.map((gen) => gen(commonTheme, theme)));
    }

    if (siteTheme) {
        lines.push(`/* Theme for ${siteTheme.url.join(' ')} */`);
        lines.push(...ruleGenerators.map((gen) => gen(siteTheme, theme)));
    }

    if (config.useFont || config.textStroke > 0) {
        lines.push('/* Font */');
        lines.push(`* ${createTextRule(config)}`);
    }

    return lines
        .filter((ln) => ln)
        .join('\n');
}

function createRuleGen(getSelectors: (siteTheme: StaticTheme) => string[], generateDeclarations: (theme: ThemeColors) => string[], modifySelector: ((s: string) => string) = (s) => s) {
    return (siteTheme: StaticTheme, themeColors: ThemeColors) => {
        const selectors = getSelectors(siteTheme);
        if (selectors == null || selectors.length === 0) {
            return null;
        }
        const lines: string[] = [];
        selectors.forEach((s, i) => {
            let ln = modifySelector(s);
            if (i < selectors.length - 1) {
                ln += ','
            } else {
                ln += ' {';
            }
            lines.push(ln);
        });
        const declarations = generateDeclarations(themeColors);
        declarations.forEach((d) => lines.push(`    ${d} !important;`));
        lines.push('}');
        return lines.join('\n');
    };
}

const mx = {
    bg: {
        hover: 0.075,
        active: 0.1,
    },
    fg: {
        hover: 0.25,
        active: 0.5,
    },
    border: 0.5,
};

const staticThemeProps = [
    'noCommon',

    'neutralBg',
    'neutralBgActive',
    'neutralText',
    'neutralTextActive',
    'neutralBorder',

    'redBg',
    'redBgActive',
    'redText',
    'redTextActive',
    'redBorder',

    'greenBg',
    'greenBgActive',
    'greenText',
    'greenTextActive',
    'greenBorder',

    'blueBg',
    'blueBgActive',
    'blueText',
    'blueTextActive',
    'blueBorder',

    'fadeBg',
    'fadeText',
    'transparentBg',

    'noImage',
    'invert',
];

const ruleGenerators = [
    createRuleGen((t) => t.neutralBg, (t) => [`background-color: ${rgb(t.neutralBg)}`]),
    createRuleGen((t) => t.neutralBgActive, (t) => [`background-color: ${rgb(t.neutralBg)}`]),
    createRuleGen((t) => t.neutralBgActive, (t) => [`background-color: ${rgb(mix(t.neutralBg, [255, 255, 255], mx.bg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.neutralBgActive, (t) => [`background-color: ${rgb(mix(t.neutralBg, [255, 255, 255], mx.bg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.neutralText, (t) => [`color: ${rgb(t.neutralText)}`]),
    createRuleGen((t) => t.neutralTextActive, (t) => [`color: ${rgb(t.neutralText)}`]),
    createRuleGen((t) => t.neutralTextActive, (t) => [`color: ${rgb(mix(t.neutralText, [255, 255, 255], mx.fg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.neutralTextActive, (t) => [`color: ${rgb(mix(t.neutralText, [255, 255, 255], mx.fg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.neutralBorder, (t) => [`border-color: ${rgb(mix(t.neutralBg, t.neutralText, mx.border))}`]),

    createRuleGen((t) => t.redBg, (t) => [`background-color: ${rgb(t.redBg)}`]),
    createRuleGen((t) => t.redBgActive, (t) => [`background-color: ${rgb(t.redBg)}`]),
    createRuleGen((t) => t.redBgActive, (t) => [`background-color: ${rgb(mix(t.redBg, [255, 0, 64], mx.bg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.redBgActive, (t) => [`background-color: ${rgb(mix(t.redBg, [255, 0, 64], mx.bg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.redText, (t) => [`color: ${rgb(t.redText)}`]),
    createRuleGen((t) => t.redTextActive, (t) => [`color: ${rgb(t.redText)}`]),
    createRuleGen((t) => t.redTextActive, (t) => [`color: ${rgb(mix(t.redText, [255, 255, 0], mx.fg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.redTextActive, (t) => [`color: ${rgb(mix(t.redText, [255, 255, 0], mx.fg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.redBorder, (t) => [`border-color: ${rgb(mix(t.redBg, t.redText, mx.border))}`]),

    createRuleGen((t) => t.greenBg, (t) => [`background-color: ${rgb(t.greenBg)}`]),
    createRuleGen((t) => t.greenBgActive, (t) => [`background-color: ${rgb(t.greenBg)}`]),
    createRuleGen((t) => t.greenBgActive, (t) => [`background-color: ${rgb(mix(t.greenBg, [128, 255, 182], mx.bg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.greenBgActive, (t) => [`background-color: ${rgb(mix(t.greenBg, [128, 255, 182], mx.bg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.greenText, (t) => [`color: ${rgb(t.greenText)}`]),
    createRuleGen((t) => t.greenTextActive, (t) => [`color: ${rgb(t.greenText)}`]),
    createRuleGen((t) => t.greenTextActive, (t) => [`color: ${rgb(mix(t.greenText, [182, 255, 224], mx.fg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.greenTextActive, (t) => [`color: ${rgb(mix(t.greenText, [182, 255, 224], mx.fg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.greenBorder, (t) => [`border-color: ${rgb(mix(t.greenBg, t.greenText, mx.border))}`]),

    createRuleGen((t) => t.blueBg, (t) => [`background-color: ${rgb(t.blueBg)}`]),
    createRuleGen((t) => t.blueBgActive, (t) => [`background-color: ${rgb(t.blueBg)}`]),
    createRuleGen((t) => t.blueBgActive, (t) => [`background-color: ${rgb(mix(t.blueBg, [0, 128, 255], mx.bg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.blueBgActive, (t) => [`background-color: ${rgb(mix(t.blueBg, [0, 128, 255], mx.bg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.blueText, (t) => [`color: ${rgb(t.blueText)}`]),
    createRuleGen((t) => t.blueTextActive, (t) => [`color: ${rgb(t.blueText)}`]),
    createRuleGen((t) => t.blueTextActive, (t) => [`color: ${rgb(mix(t.blueText, [182, 224, 255], mx.fg.hover))}`], (s) => `${s}:hover`),
    createRuleGen((t) => t.blueTextActive, (t) => [`color: ${rgb(mix(t.blueText, [182, 224, 255], mx.fg.active))}`], (s) => `${s}:active, ${s}:focus`),
    createRuleGen((t) => t.blueBorder, (t) => [`border-color: ${rgb(mix(t.blueBg, t.blueText, mx.border))}`]),

    createRuleGen((t) => t.fadeBg, (t) => [`background-color: ${rgb(t.fadeBg)}`]),
    createRuleGen((t) => t.fadeText, (t) => [`color: ${rgb(t.fadeText)}`]),
    createRuleGen((t) => t.transparentBg, (t) => ['background-color: transparent']),
    createRuleGen((t) => t.noImage, (t) => ['background-image: none']),
    createRuleGen((t) => t.invert, (t) => ['filter: invert(100%) hue-rotate(180deg)']),
];

export function parseUrlSelectorConfig(text: string) {
    const themes: StaticTheme[] = [];

    const isPropertyName = (text) => Boolean(text.match(/^[A-Z ]+$/));

    // Split blocks
    const blocks = text.replace(/\r/g, '').split(/={2,}/g);
    blocks.forEach((block) => {
        // Remove empty lines
        const lines = block.split('\n').map((l) => l.trim()).filter((l) => l);

        // Get list of URL patterns
        let firstCommandIndex = lines.findIndex(isPropertyName);
        if (firstCommandIndex < 0) {
            firstCommandIndex = lines.length;
        }
        const url = lines.slice(0, firstCommandIndex);

        // Fill properties selectors
        let line;
        let prop;
        const raw: StaticTheme = {url};
        lines.slice(url.length).forEach((line) => {
            if (isPropertyName(line)) {
                // Convert property name from UPPER CASE to lowerCase
                prop = line
                    .split(' ')
                    .map((word, i) => {
                        return (i === 0
                            ? word.toLowerCase()
                            : (word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
                        );
                    })
                    .join('');
                if (prop === 'noCommon') {
                    raw[prop] = true;
                } else {
                    raw[prop] = [];
                }
            } else {
                raw[prop].push(line);
            }
        });
        themes.push(raw);
    });

    const common = getCommonTheme(themes);
    if (!(common && common.url && common.url[0] === '*')) {
        throw new Error('Common theme is missing');
    }

    return themes;
}

export function formatUrlSelectorConfig(staticThemes: StaticTheme[]) {
    const camelCaseToUpperCase = (text: string) => text.replace(/([A-Z])/g, ' $1').toUpperCase().trim();

    const themes = staticThemes.slice().sort((a, b) => (
        a.url[0]
            .toLowerCase()
            .replace(/[^0-9a-z\.]/g, '')
            .localeCompare(
                b.url[0]
                    .toLowerCase()
                    .replace(/[^0-9a-z\.]/g, '')
            )
    ));

    const lines: string[] = [];

    themes.forEach((theme, i) => {
        lines.push(...theme.url);
        staticThemeProps.forEach((prop) => {
            if (
                (prop === 'noCommon' && theme.noCommon) ||
                (Array.isArray(theme[prop]) && theme[prop].length > 0)
            ) {
                lines.push('');
                lines.push(camelCaseToUpperCase(prop));
                if (Array.isArray(theme[prop])) {
                    lines.push(...theme[prop]);
                }
            }
        });
        if (i < themes.length - 1) {
            lines.push('');
            lines.push(Array.from({length: 32}).fill('=').join(''));
            lines.push('');
        }
    });

    lines.push('');
    return lines.join('\n');
}

function getCommonTheme(themes: StaticTheme[]) {
    return themes[0];
}

function getThemeFor(url: string, themes: StaticTheme[]) {
    const sortedBySpecificity = themes
        .slice(1)
        .map((theme) => {
            return {
                specificity: isUrlInList(url, theme.url) ? theme.url[0].length : 0,
                theme
            };
        })
        .filter(({specificity}) => specificity > 0)
        .sort((a, b) => b.specificity - a.specificity);

    if (sortedBySpecificity.length === 0) {
        return null;
    }

    return sortedBySpecificity[0].theme;
}
