class UIFrame {
  public alpha: number = 1;
  public color: string = '#ffffff';
  public colorHover: string = '#dddddd';
  public renderStyle: string = this.color;

  public borderThickness = 0.01;
  public borderColor: string = '#000000';
  public borderColorHover: string = '#000088';
  public borderRenderStyle: string = this.borderColor;

  public image: HTMLImageElement = null;
  public imageAlpha: number = 1;

  constructor(
    public cornerX: number,
    public cornerY: number,
    public width: number,
    public height: number,
    private onHoverEffects: boolean,
  ) {

  }

  public checkMouse(mouseX: number, mouseY: number): boolean {
    return (
      mouseX >= this.cornerX
      && mouseY >= this.cornerY
      && mouseX <= this.cornerX + this.width
      && mouseY <= this.cornerY + this.height
    );
  }

  public onHover(hovering: boolean) {
    if (!this.onHoverEffects) return;
    if (hovering) {
      this.renderStyle = this.colorHover;
      this.borderRenderStyle = this.borderColorHover;
    } else {
      this.renderStyle = this.color;
      this.borderRenderStyle = this.borderColor;
    }
  }

  public onClick() {
    if (this.onHoverEffects) {
      this.renderStyle = this.colorHover;
      this.borderRenderStyle = this.borderColorHover;
    }
  }
}

export { UIFrame as default };