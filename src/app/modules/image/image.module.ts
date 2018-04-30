import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import CaptureDirective from './capture.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    CaptureDirective
  ],
  exports:[
    CaptureDirective
  ]
})
export class ImageModule { }
