class Interpolator {
  private startValue: number = 0;
  private endValue: number = 1;
  private time: number = 0; // Time progressed through lerp
  private timeMax: number = 1; // Set lerp time
  private lerping: boolean = false;

  public lerp(start: number = 0, end: number = 1, lerpTime: number = 1) {
    this.startValue = start;
    this.endValue = end;

    this.timeMax = lerpTime;
    this.time = 0;
    this.lerping = true;
  }

  public tick(DeltaTime: number) {
    if (this.lerping) {
      this.time += DeltaTime;
      if (this.time >= this.timeMax) {
        this.lerping = false;
        this.time = this.timeMax;
      }
    }
  }

  public getValue(): number {
    const a = this.time / this.timeMax;
    return this.startValue * (1 - a) + this.endValue * a;
  }
}

export { Interpolator as default };