window.addEventListener('DOMContentLoaded', () => {
    (function setupTranslation() {
        const DEFAULT_LANGUAGE = 'en';

        let currentLanguage;
        let currentMessages;

        function initLanguage() {
            const langCode = localStorage.getItem(Shared.STORAGE_KEYS.LANGUAGE);
            if (langCode && window.translatableTexts[langCode]) {
                currentLanguage = langCode;
            } else {
                console.warn(`No translation found for ${langCode}. Fall back to en-English.`);
                currentLanguage = DEFAULT_LANGUAGE;
                localStorage.setItem(Shared.STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE);
            }
            currentMessages = window.translatableTexts[currentLanguage] || {};
        };

        // function setLanguage(langCode) {
        //     if (window.translatableTexts[langCode]) {
        //         currentLanguage = langCode;
        //         currentMessages = window.translatableTexts[langCode];
        //         localStorage.setItem(Shared.STORAGE_KEYS.LANGUAGE, langCode);
        //         // TODO: Handle event
        //     } else {
        //         console.warn(`No translation found for ${langCode} found. Fall back to en-English.`);
        //     }
        // }

        function formatByOrder(template, values = []) {
            let index = 0;
            return template.replace(/\{[^}]+\}/g, () => values[index++] ?? 'not_given');
        };

        // Create proxy for taggedString
        window.taggedString = new Proxy({}, {
            get(_, prop) {
                const template = currentMessages[prop] ?? `{${prop}}`;
                return (...values) => formatByOrder(template, values);
            }
        });

        // TODO: Expose language controls
        //window.setLanguage = setLanguage;
        //window.getCurrentLanguage = () => currentLanguage;
        // function getCurrentLanguage() {
        //     let lang = localStorage.getItem(Shared.STORAGE_KEYS.LANGUAGE);
        //     if (!lang) {
        //         lang = 'en';
        //         localStorage.setItem(Shared.STORAGE_KEYS.LANGUAGE, lang);
        //     }
        //     return lang;
        // };
        // Initialize once
        initLanguage();
    })();
});