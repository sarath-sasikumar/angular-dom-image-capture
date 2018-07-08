import { CaptureDirective } from './capture.directive';

describe('CaptureDirective', () => {
  it('should create an instance', () => {
    let elem;
    const directive = new CaptureDirective(elem);
    expect(directive).toBeTruthy();
  });
});
