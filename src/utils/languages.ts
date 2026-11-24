const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getLocale(): string {
    return (
        (typeof document !== 'undefined' && document.documentElement.lang) ||
        (typeof navigator !== 'undefined' && navigator.language) ||
        'en'
    );
}

function getDisplayNames(): Intl.DisplayNames {
    const locale = getLocale();
    let names = displayNamesCache.get(locale);

    if (!names) {
        names = new Intl.DisplayNames([locale], { type: 'language', fallback: 'none' });
        displayNamesCache.set(locale, names);
    }

    return names;
}

export function renderLanguage(language: string): string {
    if (!language) {
        return '';
    }

    try {
        return getDisplayNames().of(language) ?? language;
    } catch {
        return language;
    }
}

export const LANGUAGES: readonly string[] = (() => {
    const names = getDisplayNames();
    const languages: string[] = [];

    for (let first = 97; first <= 122; first++) {
        for (let second = 97; second <= 122; second++) {
            const code = String.fromCharCode(first, second);

            if (names.of(code)) {
                languages.push(code);
            }
        }
    }

    return languages.sort((a, b) => (names.of(a) ?? a).localeCompare(names.of(b) ?? b));
})();
