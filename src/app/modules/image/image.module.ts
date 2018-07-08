import { NgModule } from '@angular/core';
import { CaptureDirective } from './capture.directive';

@NgModule({
  declarations: [
    CaptureDirective
  ],
  exports:[
    CaptureDirective
  ]
})
export class ImageModule { }
