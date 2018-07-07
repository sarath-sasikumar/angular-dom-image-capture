import InLiner from "./inliner";
import Util from "./util";

const getCssRules = (styleSheets) => {
    let cssRules = [];
    styleSheets.forEach((sheet) => {
        try {
            Util.asArray(sheet.cssRules || []).forEach(cssRules.push.bind(cssRules));
        } catch (e) {
            console.log('Error while reading CSS rules from ' + sheet.href, e.toString());
        }
    });
    return cssRules;
}

const resolveAll = () => {
    return readAll(document)
        .then((webFonts) => {
            return Promise.all(
                webFonts.map((webFont) => {
                    return webFont.resolve();
                })
            );
        })
        .then((cssStrings) => {
            return cssStrings.join('\n');
        });
}

const newWebFont = (webFontRule) => {
    return {
        resolve: function resolve() {
            let baseUrl = (webFontRule.parentStyleSheet || {}).href;
            return InLiner.inlineAll(webFontRule.cssText, baseUrl);
        },
        src: function () {
            return webFontRule.style.getPropertyValue('src');
        }
    };
}

const readAll = (document) => {
    return Promise.resolve(Util.asArray(document.styleSheets))
        .then(getCssRules)
        .then(selectWebFontRules)
        .then((rules) => {
            return rules.map(newWebFont);
        });
}

const selectWebFontRules = (cssRules) => {
    return cssRules
        .filter((rule) => {
            return rule.type === CSSRule.FONT_FACE_RULE;
        })
        .filter((rule) => {
            return InLiner.shouldProcess(rule.style.getPropertyValue('src'));
        });
}

export default {
    resolveAll, readAll
}