import InLiner from "./inliner";
import Util from "./util";

const inlineBackground = (node) => {
    const background = node.style.getPropertyValue("background");
    if (!background) {
        return Promise.resolve(node);
    }
    return InLiner.inlineAll(background)
        .then((inlined) => {
            node.style.setProperty(
                "background",
                inlined,
                node.style.getPropertyPriority("background")
            );
        })
        .then(() => {
            return node;
        });
}

const inlineAll = (node) => {
    if (!(node instanceof Element)) {
        return Promise.resolve(node);
    }
    return inlineBackground(node)
        .then(() => {
            if (node instanceof HTMLImageElement)
                return inline(node);
            else {
                return Promise.all(
                    Util.asArray(node.childNodes).map((child) => {
                        return inlineAll(child);
                    })
                );
            }
        });
}

const inline = (element, get?) => {
    if (Util.isDataUrl(element.src)) {
        return Promise.resolve({});
    }
    return Promise.resolve(element.src)
        .then(get || Util.getAndEncode)
        .then((data) => {
            return Util.dataAsUrl(data, Util.mimeType(element.src));
        })
        .then((dataUrl) => {
            return new Promise((resolve, reject) => {
                element.onload = resolve;
                element.onerror = reject;
                element.src = dataUrl;
            });
        });
}

export default {
    inlineBackground,inlineAll,inline
}