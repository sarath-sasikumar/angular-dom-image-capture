import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  public functionToUseBase64(base64:string){
    console.log(base64);
  }

  public emitCopyEvent($event:Event):void{
    const event: CustomEvent = new CustomEvent("copy", {bubbles: true});
    // FIXME: This is an ad-hoc fix until Angular gives us a web worker
    // compliant way to do the same!
    $event.currentTarget.dispatchEvent(event);
  }
}
