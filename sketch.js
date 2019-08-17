var black = 0;
var white = 255;

var dimension;
var weight = 0.005;
var bigRadius = 0.35;
var littleRadius = 0.0905;

var velocity = [];
for(let n = 0; n < 7; n++) {
  velocity.push(0);
}

var notes = [];
var millisecond = 0;
var notePressed = -1;

function degToNdt(d) {
  switch(d) {
    default:
    case 1: return 0;
    case 2: return 2;
    case 3:	return 4;
    case 4: return 5;
    case 5: return 7;
    case 6: return 9;
		case 7: return 11;
  }
}

class Note {
  constructor(degree) {
    this.d = degree;
    this.n = degToNdt(degree);

    this.angle = PI/2 - this.n*PI/6;

    this.velocity = 0;

    this.button = new Clickable();
    this.button.color = 255;
    this.button.cornerRadius = 1000;
    this.button.stroke = black;
    this.button.text = '';

    this.updateText();
    this.textColor = black;

    var deg = this.d;

    this.button.onPress = function() {
      notePressed = deg-1;
    }

    this.button.onRelease = function() {
      if(notePressed > -1) {
        var note = notes[notePressed];
        notePressed = -1;
        var x = mouseX-width/2;
        var y = -(mouseY-height/2);
        var a = Math.atan(y/x);
        if(x < 0) {
          a += PI;
        }
        var min = (notes[(note.d+5)%7].n+1)%12;
        var max =  notes[(note.d  )%7].n;
        for(let n = min; n != max; n = (n+1)%12) {
          var da = PI/2 - n*PI/6 - a;
          while(da < 0)     {da += 2*PI;}
          while(da >= 2*PI) {da -= 2*PI;}
          if(da >= 2*PI - PI/12 || da < PI/12) {
            if(n != note.n) {
              note.n = n;
            }
          }
        }
        note.angle = PI/2 - note.n*PI/6;
        note.updateText();
        note.update();
      }
    }

    this.update();
  }

  updateText() {
    var text = '';
    switch(this.d) {
      default:
      case 1: text += 'C'; break;
      case 2: text += 'D'; break;
      case 3: text += 'E'; break;
      case 4: text += 'F'; break;
      case 5: text += 'G'; break;
      case 6: text += 'A'; break;
      case 7: text += 'B'; break;
    }
    switch(this.n-degToNdt(this.d)) {
      case -2: text += 'bb'; break;
      case -1: text += 'b';  break;
      case  0:               break;
      case  1: text += '#';  break;
      case  2: text += '##'; break;
      default: text += '?';
    }
    this.text = text;
  }

  update() {
    let vel = this.velocity;
    let r = (littleRadius-vel*weight/2)*dimension;
    this.button.resize(2*r,2*r);
    this.button.locate(width/2 +bigRadius*dimension*cos(this.angle)-r,
                       height/2-bigRadius*dimension*sin(this.angle)-r);
    this.button.strokeWeight = (1+vel)*weight*dimension;
  }

  move() {
    var x = mouseX-width/2;
    var y = -(mouseY-height/2);
    let r = sqrt(pow(x,2)+pow(y,2));
    if(r >= (bigRadius-littleRadius)*dimension &&
       r <  (bigRadius+littleRadius)*dimension) {
      var a = Math.atan(y/x);
      if(x < 0) {
        a += PI;
      }
      this.angle = a;//lerp(this.angle,a,0.8);
    }
    else {
      this.angle = PI/2 - this.n*PI/6;
      notePressed = -1;
    }
    this.update();
    this.draw();
  }

  drawText() {
    fill(this.textColor);
    textAlign(CENTER,CENTER);
    textSize(0.08*dimension);
    textFont(font);
    text(this.text,this.button.x+this.button.width/2,
                   this.button.y+this.button.height/2-0.01*dimension);
  }

  draw() {
    this.button.draw();
    this.drawText();
  }
}

function preload() {
  font = loadFont('nunito.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let d = 1; d <= 7; d++) {
    notes.push(new Note(d));
  }

  enableMidi();
}

function draw() {
  background(255);

  noFill();
  stroke(black);
  strokeWeight(weight*dimension);
  circle(width/2,height/2,2*bigRadius*dimension,2*bigRadius*dimension);

  for(let n = 0; n < 12; n++) {
    let a = PI/2 - n*PI/6;
    let r = bigRadius*dimension;
    let dr = 0.65*littleRadius*dimension;
    line(width/2+(r+dr)*cos(a),height/2-(r+dr)*sin(a),
         width/2+(r-dr)*cos(a),height/2-(r-dr)*sin(a));
  }

  for(let n = 0; n < notes.length; n++) {
    var note = notes[n];
    if(velocity[n] || note.velocity) {
      note.velocity = lerp(note.velocity,velocity[n],0.75);
      note.update();
    }
    if(n != notePressed) {
      note.draw();
    }
  }

  if(notePressed > -1) {
    notes[notePressed].move();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let n = 0; n < notes.length; n++) {
    notes[n].update();
  }
}

//------------------------------------------------------------------------------
//                             MIDI
//------------------------------------------------------------------------------

function enableMidi() {
  midi = true;

  WebMidi.enable(function (err) {
    if (err) console.log("An error occurred", err);

    var liste = '';
    var taille = WebMidi.inputs.length;
    var i, num;
    var numStr = '0';

    for(let i = 0; i < taille; i++) {
      num = i+1;
      liste += '   ' + num.toString() + '   -   ' + WebMidi.inputs[i].name + '\n';
    }

    //console.log(liste);

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 3) {
      numStr = window.prompt("Write the number of the desired input device:\n\n"+liste);
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      disableMidi();
    }
    else {
      noteOnCounter = 0;
      var input = WebMidi.inputs[num-1];
      console.log('input : ',input.name);
      if(!input.hasListener('noteon', 'all', handleNoteOn)) {
        input.addListener('noteon', 'all', handleNoteOn);
        input.addListener('noteoff', 'all', handleNoteOff);
      }
      if(!input.hasListener('keyaftertouch', 'all', handleAftertouch)) {
        input.addListener('keyaftertouch', 'all', handleAftertouch);
        input.addListener('keyaftertouch', 'all', handleAftertouch);
      }
    }
  },true);
}

var pitchMinStr;

function handleNoteOn(e) {
  var deg;
  switch(e.note.number%12){
    case 0: deg = 0; break;
    //case 1:
    case 2: deg = 1; break;
    //case 3:
    case 4: deg = 2; break;
    case 5: deg = 3; break;
    //case 6:
    case 7: deg = 4; break;
    //case 8:
    case 9: deg = 5; break;
    //case 10:
    case 11: deg = 6; break;
    default: return;
  }

  velocity[deg] = 5*e.velocity;
}

function handleAftertouch(e) {
  var deg;
  switch(e.note.number%12){
    case 0: deg = 0; break;
    //case 1:
    case 2: deg = 1; break;
    //case 3:
    case 4: deg = 2; break;
    case 5: deg = 3; break;
    //case 6:
    case 7: deg = 4; break;
    //case 8:
    case 9: deg = 5; break;
    //case 10:
    case 11: deg = 6; break;
    default: return;
  }

  velocity[deg] = 6.5*e.value;
}

function handleNoteOff(e) {
  var deg;
  switch(e.note.number%12){
    case 0: deg = 0; break;
    //case 1:
    case 2: deg = 1; break;
    //case 3:
    case 4: deg = 2; break;
    case 5: deg = 3; break;
    //case 6:
    case 7: deg = 4; break;
    //case 8:
    case 9: deg = 5; break;
    //case 10:
    case 11: deg = 6; break;
    default: return;
  }

  velocity[deg] = 0;
}

function disableMidi() {
  midi = false;

  for(let i = 0; i < WebMidi.inputs.length; i++) {
    WebMidi.inputs[i].removeListener();
  }

  WebMidi.disable();

  refresh();
}
