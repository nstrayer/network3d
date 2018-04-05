class ProgressMessage {
  constructor(el){
    this.message = d3.select(el)
      .append('div')
      .html('<p> Calculating layout: step 0</p>')
      .style('background', 'white')
      .style('border-radius', '10px')
      .style('padding', '0px 15px')
      .style('box-shadow', '1px 1px 3px black')
      .style('position', 'fixed');

    // hide until the user has said they want message
    this.hide();
  }


  hide(){
    this.message
      .style('display', 'none')
      .style('top', -1000)
      .style('left', -1000);
  }

  update(iteration){
    this.message
      .style('display', 'block')
      .style('top', '10px')
      .style('left', '10px')
      .html(`<p> Calculating layout: step ${iteration}</p>`);
  }
}


module.exports = ProgressMessage;
