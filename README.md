# ng-dom-image-capture

This is an Angular directive which can be used with any particular tag and make it convertable to its base64 image equivalent.

This has been inspired from the dom-to-image library.

## Setup

The first step is to install

```
npm i ng-dom-image-capture
```

Next is to import the `ImageModule` in the app module and use them in the `imports` and `providers`

```
import { ImageModule } from 'ng-dom-image-capture';
```

## Usage

The usage of the directive is as straightforward as it gets.

```
<node [capture]="'image/jpeg'" (onConvertComplete)="functionToUseBase64($event)">
  <!-- The node to be copied-->

</node>
```

The $event will contain the `base64` equivalent of the node. The onConvertComplete event is triggered only when the conversion to the image is complete.

## Triggering Conversion

The conversion of the node to the `base64` equivalent is to be triggered by a custom `copy` event. The html div on which the `capture` directive is applied will be listening to this custom `copy` event and on receiving this event it will convert the dom to the image equivalent.
This means that the element which triggers this event SHOULD be some child of the element on which the `capture` directive is applied.

For Ex: 
There is a button which is supposed to trigger the copy process

```
<node [capture]="'image/jpeg'" (onConvertComplete)="functionToUseBase64($event)">
  <!-- The node to be copied-->

  <button (click)="emitCopyEvent($event)">Copy</button>
</node>
```
This function will emit the custom `copy` event.
JavaScript provides ability to emit custom events.
https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events

So the `emitCopyEvent` should be something like:

```

  public emitCopyEvent($event:Event):void{
    const event: CustomEvent = new CustomEvent("copy", {bubbles: true});
    $event.currentTarget.dispatchEvent(event);
```

## captureExclude

It is possible that in certain scenarios, a particular element needs to be excluded from the image conversion procedure. This can be easily done by including a `captureExclude` attribute to the node that does not need to be copied.

```
<node [capture]="'image/jpeg'" (onConvertComplete)="functionToUseBase64($event)">
  <!-- The node to be copied-->
    <div captureExclude>

    </div>
</node>
```

## captureInclude

There is also a feature to mark all the nodes that need to be copied, with the `captureInclude` attribute so that only those nodes are copied.

If there is no such attribute attached to any node, then the whole node is as such copied.

> A very important note is that the node which is to be passed if its an angular node, then it definitely should have display property set, otherwise the library would be unable to get the node style properties.

> The performance of the dom conversion can be improved by running the conversion logic outside the Angular zone and this improvement will also be made available in the future commits
