import Util from "./util";
import FontFaces from "./fontFaces";
import Images from "./images";

import Options from "./options.model";

export default class DomToImage {

    public toSvg(node: HTMLElement, options: Options) {
        options = options || {};
        return Promise.resolve(node)
            .then((node: HTMLElement) => {
                return this.cloneNode(node, options.filter, true);
            })
            .then(this.embedFonts)
            .then(this.inlineImages)
            .then((clone: HTMLElement) => this.applyOptions(clone, options))
            .then((clone: HTMLElement) => {
                return this.makeSvgDataUri(clone,
                    options.width || Util.width(node),
                    options.height || Util.height(node)
                );
            });
    }

    public applyOptions(node: HTMLElement, options: Options) {
        if (options.bgcolor) {
            node.style.backgroundColor = options.bgcolor;
        }
        if (options.width) {
            node.style.width = options.width + 'px';
        }
        if (options.height) {
            node.style.height = options.height + 'px';
        }
        if (options.style)
            Object.keys(options.style).forEach((property) => {
                node.style[property] = options.style[property];
            });
        return node;
    }

    public makeSvgDataUri(node: HTMLElement, width: number, height: number) {
        return Promise.resolve(node)
            .then((node: HTMLElement) => {
                node.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
                return new XMLSerializer().serializeToString(node);
            })
            .then(Util.escapeXhtml)
            .then((xhtml: string) => {
                return '<foreignObject x="0" y="0" width="100%" height="100%">' + xhtml + '</foreignObject>';
            })
            .then((foreignObject: string) => {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
                    foreignObject + '</svg>';
            })
            .then((svg: string) => {
                return 'data:image/svg+xml;charset=utf-8,' + svg;
            });
    }

    /**
     * @param {Node} node - The DOM Node object to render
     * @param {Object} options - Rendering options, @see {@link toSvg}
     * @return {Promise} - A promise that is fulfilled with a Uint8Array containing RGBA pixel data.
     **/
    public toPixelData(node: HTMLElement, options: Options) {
        return this.draw(node, options || {})
            .then((canvas: HTMLCanvasElement) => {
                return canvas.getContext("2d").getImageData(
                    0,
                    0,
                    Util.width(node),
                    Util.height(node)
                ).data;
            });
    }

    /**
    * @param {Node} node - The DOM Node object to render
    * @param {Object} options - Rendering options, @see {@link toSvg}
    * @return {Promise} - A promise that is fulfilled with a PNG image data URL
    **/
    public toPng(node: HTMLElement, options: Options) {
        return this.draw(node, options || {})
            .then((canvas: HTMLCanvasElement) => {
                return canvas.toDataURL();
            });
    }

    /**
    * @param {Node} node - The DOM Node object to render
    * @param {Object} options - Rendering options, @see {@link toSvg}
    * @return {Promise} - A promise that is fulfilled with a JPEG image data URL
    **/
    public toJpeg(node: HTMLElement, options: Options) {
        options = options || {};
        return this.draw(node, options)
            .then((canvas: HTMLCanvasElement) => {
                return canvas.toDataURL('image/jpeg', options.quality || 1.0);
            });
    }

    /**
    * @param {Node} node - The DOM Node object to render
    * @param {Object} options - Rendering options, @see {@link toSvg}
    * @return {Promise} - A promise that is fulfilled with a PNG image blob
    **/
    public toBlob(node: HTMLElement, options: Options) {
        return this.draw(node, options || {})
            .then(Util.canvasToBlob);
    }

    public draw(domNode: HTMLElement, options: Options) {
        return this.toSvg(domNode, options)
            .then(Util.makeImage)
            .then(Util.delay(100))
            .then((image: HTMLImageElement) => {
                let canvas: HTMLCanvasElement = this.newCanvas(domNode, options);
                canvas.getContext("2d").drawImage(image, 0, 0);
                return canvas;
            });
    }

    private newCanvas(domNode: HTMLElement, options: Options) {
        let canvas = document.createElement('canvas');
        canvas.width = options.width || Util.width(domNode);
        canvas.height = options.height || Util.height(domNode);

        if (options.bgcolor) {
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = options.bgcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return canvas;
    }

    public cloneNode(node: HTMLElement, filter: any, root?: boolean) {
        if (!root && filter && !filter(node)) {
            return Promise.resolve({});
        }
        return Promise.resolve(node)
            .then(this.makeNodeCopy)
            .then((clone: HTMLElement) => {
                return this.cloneChildren(node, clone, filter);
            })
            .then((clone: HTMLElement) => {
                return this.processClone(node, clone);
            });

    }

    private processClone(original: HTMLElement, clone: HTMLElement) {
        if (!(clone instanceof Element)) {
            return clone;
        }
        return Promise.resolve()
            .then(() => {
                this.cloneStyle(original, clone)
            })
            .then(() => {
                this.clonePseudoElements(original, clone)
            })
            .then(() => {
                this.copyUserInput(original, clone)
            })
            .then(() => {
                this.fixSvg(clone)
            })
            .then(() => {
                return clone;
            });
    }

    private clonePseudoElements(original: HTMLElement, clone: HTMLElement) {
        [':before', ':after'].forEach((element) => {
            this.clonePseudoElement(element, original, clone);
        });
    }

    private clonePseudoElement(element: any, original: HTMLElement, clone: HTMLElement) {
        let style = window.getComputedStyle(original, element);
        let content = style.getPropertyValue('content');
        if (content === '' || content === 'none') {
            return;
        }
        let className = Util.uid();
        clone.className = clone.className + ' ' + className;
        let styleElement = document.createElement('style');
        styleElement.appendChild(this.formatPseudoElementStyle(className, element, style));
        clone.appendChild(styleElement);
    }

    private formatPseudoElementStyle(className: any, element: any, style: CSSStyleDeclaration) {
        let selector = '.' + className + ':' + element;
        let cssText = style.cssText ? this.formatCssText(style) : this.formatCssProperties(style);
        return document.createTextNode(selector + '{' + cssText + '}');
    }

    private formatCssText(style: CSSStyleDeclaration) {
        let content = style.getPropertyValue('content');
        return style.cssText + ' content: ' + content + ';';
    }

    private formatCssProperties(style: CSSStyleDeclaration) {
        return Util.asArray(style)
            .map((name: string) => {
                return name + ': ' +
                style.getPropertyValue(name) +
                (style.getPropertyPriority(name) ? ' !important' : '');
            })
            .join('; ') + ';';
    }

    private copyUserInput(original: HTMLElement, clone: HTMLElement) {
        if (original instanceof HTMLTextAreaElement) {
            clone.innerHTML = original.value;
        }
        if (original instanceof HTMLInputElement) {
            clone.setAttribute("value", original.value);
        }
    }

    private fixSvg(clone: HTMLElement) {
        if (!(clone instanceof SVGElement)) {
            return;
        }
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        if (!(clone instanceof SVGRectElement)) {
            return;
        }
        ['width', 'height'].forEach((attribute) => {
            let value = clone.getAttribute(attribute);
            if (!value) {
                return;
            }

            clone.style.setProperty(attribute, value);
        });
    }

    private cloneStyle(original: HTMLElement, clone: HTMLElement) {
        this.copyStyle(window.getComputedStyle(original), clone.style);
    }

    private copyStyle(source: CSSStyleDeclaration, target: CSSStyleDeclaration) {
        if (source.cssText) {
            target.cssText = source.cssText;
        } else {
            this.copyProperties(source, target);
        }
    }

    private copyProperties(source: CSSStyleDeclaration, target: CSSStyleDeclaration) {
        Util.asArray(source).forEach((name)=> {
            target.setProperty(
                name,
                source.getPropertyValue(name),
                source.getPropertyPriority(name)
            );
        });
    }

    private cloneChildren(original: HTMLElement, clone: HTMLElement, filter: any) {
        let children = original.childNodes;
        if (children.length === 0) {
            return Promise.resolve(clone);
        }
        return this.cloneChildrenInOrder(clone, Util.asArray(children), filter)
            .then(() => {
                return clone;
            });
    }

    private cloneChildrenInOrder(parent: HTMLElement, children: HTMLElement[], filter: any) {
        let done = Promise.resolve();
        children.forEach((child) => {
            done = done
                .then(() => {
                    return this.cloneNode(child, filter);
                })
                .then((childClone: HTMLElement) => {
                    if (childClone) parent.appendChild(childClone);
                });
        });
        return done;
    }

    private makeNodeCopy(node: HTMLElement) {
        if (node instanceof HTMLCanvasElement) return Util.makeImage(node.toDataURL());
        return node.cloneNode(false);
    }

    public embedFonts(clone: HTMLElement) {
        return FontFaces.resolveAll()
            .then((cssText: string) => {
                let styleNode = document.createElement("style");
                clone.appendChild(styleNode);
                styleNode.appendChild(document.createTextNode(cssText));
                return clone;
            });
    }

    public inlineImages(clone: HTMLElement) {
        return Images.inlineAll(clone)
            .then(() => {
                return clone;
            });
    }
}