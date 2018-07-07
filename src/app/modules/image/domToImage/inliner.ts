import Util from "./util";

let URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

const shouldProcess = (str: string) => {
    return str.search(URL_REGEX) !== -1;
}

const readUrls = (str: string) => {
    let result = [];
    let match;
    while ((match = URL_REGEX.exec(str)) !== null) {
        result.push(match[1]);
    }
    return result.filter((url: string) => {
        return !Util.isDataUrl(url);
    });
}

const inline = (str: string, url: string, baseUrl: string, get: any) => {

    return Promise.resolve(url)
        .then((url: string) => {
            return baseUrl ? Util.resolveUrl(url, baseUrl) : url;
        })
        .then(get || Util.getAndEncode)
        .then((data: string) => {
            return Util.dataAsUrl(data, Util.mimeType(url));
        })
        .then((dataUrl: string) => {
            return str.replace(urlAsRegex(url), '$1' + dataUrl + '$3');
        });
}

const inlineAll = (str: string, baseUrl?: any, get?: any) => {
    if (nothingToInline(str)) {
        return Promise.resolve(str);
    }
    return Promise.resolve(str)
        .then(readUrls)
        .then((urls: any) => {
            let done = Promise.resolve(str);
            urls.forEach((url:any) => {
                done = done.then((str:string) => {
                    return inline(str, url, baseUrl, get);
                });
            });
            return done;
        });
}

const urlAsRegex = (url: string) => {
    return new RegExp('(url\\([\'"]?)(' + Util.escape(url) + ')([\'"]?\\))', 'g');
}

const nothingToInline = (str: string) => {
    return !shouldProcess(str);
}

export default {
    shouldProcess, readUrls, inline, inlineAll
}