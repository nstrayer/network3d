class tooltip {
  constructor(el){
    this.offset = 15;

    this.tip = d3.select(el)
      .append('div')
      .attr('class', 'tooltip')
      .html('')
      .style('background', 'white')
      .style('border-radius', '10px')
      .style('padding', '0px 15px')
      .style('box-shadow', '1px 1px 3px black')
      .style('position', 'fixed')
      .style('display', 'none');
  }

  setOffset(offset){
    this.offset = offset;
  }

  hide(){
    this.tip
    .style('display', 'none')
    .style('top', -1000)
    .style('left', -1000);
  }

  update(body, mousePos){
    this.tip
      .html(body)
      .style('top',  `${mousePos.y + this.offset}px`)
      .style('left', `${mousePos.x + this.offset}px`)
      .style('display', 'block');
  }
}


module.exports = tooltip;
