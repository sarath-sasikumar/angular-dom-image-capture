const delay = (ms: number) => {
    return (arg: any) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(arg);
            }, ms);
        });
    };
}

const asArray = (arrayLike: any) => {
    let array: any[] = [];
    let length: number = arrayLike.length;
    for (let i = 0; i < length; i++) array.push(arrayLike[i]);
    return array;
}

const uid = () => {
    let index = 0;
    return () => {
        return 'u' + ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4) + index++;
    };
}

const getAndEncode = (url: string) => {
    let TIMEOUT = 30000;

    return new Promise((resolve) => {
        let request = new XMLHttpRequest();

        request.onreadystatechange = done;
        request.ontimeout = timeout;
        request.responseType = 'blob';
        request.timeout = TIMEOUT;
        request.open("GET", url, true);
        request.send();

        function done() {
            if (request.readyState !== 4) return;

            if (request.status !== 200) {
                fail('cannot fetch resource: ' + url + ', status: ' + request.status);
                return;
            }

            let encoder = new FileReader();
            encoder.onloadend = function () {
                let content = encoder.result.split(/,/)[1];
                resolve(content);
            };
            encoder.readAsDataURL(request.response);
        }

        function timeout() {
            fail('timeout of ' + TIMEOUT + 'ms occured while fetching resource: ' + url);
        }

        function fail(message: string) {
            console.error(message);
            resolve('');
        }
    });
}

const makeImage = (uri: string) => {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.onerror = reject;
        image.src = uri;
    });
}

const resolveUrl =  (url: string, baseUrl: string) => {
    let doc = document.implementation.createHTMLDocument("");
    let base = doc.createElement('base');
    doc.head.appendChild(base);
    let a = doc.createElement('a');
    doc.body.appendChild(a);
    base.href = baseUrl;
    a.href = url;
    return a.href;
}

const canvasToBlob = (canvas: any) => {
    if (canvas.toBlob)
        return new Promise((resolve) => {
            canvas.toBlob(resolve);
        });

    return new Promise((resolve) => {
        let binaryString = window.atob(canvas.toDataURL().split(',')[1]);
        let length = binaryString.length;
        let binaryArray = new Uint8Array(length);

        for (let i = 0; i < length; i++)
            binaryArray[i] = binaryString.charCodeAt(i);

        resolve(new Blob([binaryArray], {
            type: 'image/png'
        }));
    });;
}

const isDataUrl = (url: string) => {
    return url.search(/^(data:)/) !== -1;
}

const dataAsUrl = (content: string, type: string) => {
    return 'data:' + type + ';base64,' + content;
}

const mimeType = (url: string) => {
    let extension: string = parseExtension(url).toLowerCase();
    return mimes()[extension] || '';

    function mimes() {
        /*
         * Only WOFF and EOT mime types for fonts are 'real'
         * see http://www.iana.org/assignments/media-types/media-types.xhtml
         */
        let WOFF = 'application/font-woff';
        let JPEG = 'image/jpeg';

        return {
            'woff': WOFF,
            'woff2': WOFF,
            'ttf': 'application/font-truetype',
            'eot': 'application/vnd.ms-fontobject',
            'png': 'image/png',
            'jpg': JPEG,
            'jpeg': JPEG,
            'gif': 'image/gif',
            'tiff': 'image/tiff',
            'svg': 'image/svg+xml'
        };
    }
}

const parseExtension = (url: string) => {
    let match = /\.([^\.\/]*?)$/g.exec(url);
    if (match) return match[1];
    else return '';
}

const escape = (str: string) => {
    return str.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}

const escapeXhtml = (str: string) => {
    return str.replace(/#/g, '%23').replace(/\n/g, '%0A');
}

const width = (node: HTMLElement) => {
    let leftBorder = px(node, 'border-left-width');
    let rightBorder = px(node, 'border-right-width');
    return node.scrollWidth + leftBorder + rightBorder;
}

const height = (node: HTMLElement) => {
    let topBorder = px(node, 'border-top-width');
    let bottomBorder = px(node, 'border-bottom-width');
    return node.scrollHeight + topBorder + bottomBorder;
}

const px = (node: HTMLElement, styleProperty: string) => {
    let value = window.getComputedStyle(node).getPropertyValue(styleProperty);
    return parseFloat(value.replace('px', ''));
}

export default {
    escape, parseExtension, mimeType, dataAsUrl, isDataUrl, canvasToBlob, resolveUrl,
    getAndEncode, uid, delay, asArray, escapeXhtml, makeImage, width, height
}