import UIFrame from './UIFrame';

class UIHealthbar {
  private static POSX: number = 0.01;
  public POSY: number;
  private static WIDTH: number = 0.125;
  public static HEIGHT: number = 0.05;
  private static MAX_COLLAPSE_TIME: number = 2;

  public base: UIFrame;
  public bar: UIFrame;

  public healthPercentage: number = 1;
  private displayPerc: number;

  private collapseEffectTime: number = 0;
  private collapseDir: number = 0;
  public collapsing: boolean = false;

  constructor() {
    this.POSY = 0.925;

    this.base = new UIFrame(0, 0, 0, 0, false);
    this.base.renderStyle = '#876b48'; // Should this be an image texture?

    this.bar = new UIFrame(0, 0, 0, 0, false);
    this.bar.renderStyle = '#c9241e';

    this.reset();
    this.autoscale();
  }

  private autoscale() {
    this.bar.width = 0.975 * this.base.width;
    this.bar.height = 0.9 * this.base.height;

    this.bar.cornerX = this.base.cornerX + (this.base.width - this.bar.width) / 2;
    this.bar.cornerY = this.base.cornerY + (this.base.height - this.bar.height) / 2;

    this.bar.width *= this.displayPerc;
  }
  public reset() { // Resets position and scale of healthbar
    this.base.cornerX = UIHealthbar.POSX;
    this.base.cornerY = this.POSY;
    this.base.width = UIHealthbar.WIDTH;
    this.base.height = UIHealthbar.HEIGHT;

    this.collapsing = false;
    this.collapseEffectTime = 0;

    this.displayPerc = this.healthPercentage;
  }
  public tick(DeltaTime: number) { // Falls away upon player death
    if (this.collapsing) {
      this.collapseEffectTime += DeltaTime;
      this.base.cornerX = UIHealthbar.POSX + this.collapseEffectTime * this.collapseDir;
      this.base.cornerY = this.POSY - this.collapseEffectTime / 2 + (this.collapseEffectTime ** 2);
      this.base.width = UIHealthbar.WIDTH * (1 - this.collapseEffectTime / UIHealthbar.MAX_COLLAPSE_TIME);
    }

    const alph = Math.min(DeltaTime * 20, 1);
    this.displayPerc = this.displayPerc * (1 - alph) + this.healthPercentage * alph;

    this.autoscale();
  }
  public collapse() {
    this.collapsing = true;
    this.collapseDir = (Math.random() - 0.5);
  }
  public checkReset() {
    if (this.collapseEffectTime > UIHealthbar.MAX_COLLAPSE_TIME) {
      this.reset();
    }
  }
}

export { UIHealthbar as default };