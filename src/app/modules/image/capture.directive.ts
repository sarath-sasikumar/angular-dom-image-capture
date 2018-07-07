import {Directive, ElementRef, HostListener, Input, Output, EventEmitter} from "@angular/core";
import {Subject} from "rxjs/Subject";
import DomToImage from "./domToImage/domToImage";

import Event from "./event";

/**
 * This directive is used to capture the HTML and convert it into an image to be pasted
 * onto the scratchpad. The directive listens to the custom event "copy"
 * which is the custom event emitted whenever a paste button is clicked.
 * The directive has an input capture which is the format to which the HTML node is to be converted.
 *
 * ex: jpeg/png.
 *
 * The directive also emits an event (onConvertComplete) which has the base64 of the converted node
 * and it is emitted when the conversion is complete
 *
 * The nodes which are to be excluded from being converted to image have to be appended with
 * captureExclude attribute which acts as the filter to prevent that node from the final image
 *
 * The directive uses domtoimage which is a third party library for converting HTML nodes to image
 *
 * e.x usage
 * ```
 *  <node [capture]="'image/jpeg'" (onConvertComplete)="pasteToScratchpad($event)">
 * ``
 */
@Directive({
    selector: "[capture]"
})

export default class CaptureDirective {

    /**
     * The output fomat of the node to be captured
     */
    @Input("capture")
    public type: string;

    /**
     * Event emitted on conversion of the node which is the base64 of the converted node
     */
    @Output()
    public onConvertComplete: EventEmitter<string> = new EventEmitter();
    /**
      * Listenes to the paste button click event
      * There are two cases to be checked.
      *
      * If the captureInput attribute is found in the element then the elements marked with captureInclude
      * are to be all copied
      *
      * If no such input is specified then the node is as such copied.
      *
      * A very important note is that the node which is to be passed if its an angular node, then
      * it definitely should have display property set, otherwise the library would be unable to get the
      * node style properties.
      */

    constructor(private elementRef: ElementRef) {
    }

    @HostListener("copy", ["$event"])
    public onCopy(event: CustomEvent) {
        const node: Element = this.elementRef.nativeElement;

        // TODO : Provide typing for NodeList after migration to TS 2.3
        const elements: any | null = node.querySelectorAll("[captureInclude]");
        // In case there are captureInclude elements
        if (elements.length > 0) {
            // The array of promises of the base64 of all capture Include elements
            const captureArray: Array<Promise<string>> = new Array<Promise<string>>();
            elements.forEach((element: Element) => {
                const baseURL: Promise<string> = this.convertNodeToImage(element);
                captureArray.push(baseURL);
            });
            // The promises have to be resolved inside the promise array so that the order
            // in which the images are copied is preserved.
            Promise.all(captureArray).then((baseURLs: string[]) => {
                baseURLs.forEach((baseURL: string) => {
                    return this.emitBaseURL(baseURL);
                });
            });
        } else {
            // In case there is no captureInclude element
            this.convertNodeToImage(node).then((baseUrl: string) => {
                return this.emitBaseURL(baseUrl);
            });
        }
        Event.confine(event);
    }

    /**
     * Converts the node to image and emits the base64 of the image
     *
     * @param : the node which is to be converted to image
     */
    public convertNodeToImage(node: any): Promise<string | undefined> {
        if (this.type === "image/jpeg") {
            const domToImage=new DomToImage();
            return domToImage.toJpeg(node,
                {
                    filter: function (element: HTMLElement) {
                        if (element.getAttribute && element.getAttribute("captureExclude") === "") {
                            return false;
                        } else {
                            return true;
                        }
                    },
                    bgcolor: "white",
                    quality: 1
                });
        }
        return Promise.resolve(undefined);
    }

    /**
     * To emit the base64 URL
     *
     * @param: baseURL to be emittted
     */
    private emitBaseURL(base64: string) {
        this.onConvertComplete.emit(base64);
    }
}
