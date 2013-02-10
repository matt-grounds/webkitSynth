function Note(name, freq, octave) {
    this.name = name;
    this.freq = freq;
    this.octave = octave;
}

$.extend(Note.prototype, {
    changeOctave: function(adjustment) {
        if (adjustment == 0) {
            return this;
        }
        
        var freq = this.freq;
        if (adjustment > 0) {
            for (var i = 0; i < adjustment; i++) {
                freq *= 2.0;
            }
        }
        else {
            for (var i = 0; i > adjustment; i--) {
                freq /= 2.0;
            }
        }
        return new Note(this.name, freq, this.octave + adjustment);
    },
    
    display: function() {
        return this.name + this.octave;
    }
});

Note.load = function(notes) {
    for (name in notes) {
        this[name] = new Note(name, notes[name], 4); 
    }
};

Note.load({
    C: 261.626,
    Db: 277.183,
    D: 293.665,
    Eb: 311.127,
    E: 329.628,
    F: 349.228,
    Gb: 369.994,
    G: 391.995,
    Ab: 415.305,
    A: 440.000,
    Bb: 466.164,
    B: 493.883,

});


KeyCode = {
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    SEMICOLON: 186,
    EQUAL_SIGN: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
};

function keyCodeToStringKey(keyCode) {
	if(keyCode >= 48 && keyCode <= 90)
	{
		return String.fromCharCode(keyCode).toLowerCase();
	}
	
	for (var key in KeyCode) {
		if(KeyCode[key] == keyCode)
		{
			return key;
		}
	}
	
	return undefined;
}

function Piano(settings) {
	this.octaveAdjustment = 0;
	this.frequencyController = new ParamController('freq');
	this.gateController = new ParamController('gate');
	this.keyLayoutIndex = 0;
}

$.extend(Piano.prototype, {
        
    keyLayouts: [
	// key layout 1
	{
        'z': Note.C,
        'x': Note.D,
        'c': Note.E,
        'v': Note.F,
        'b': Note.G,
        'n': Note.A,
        'm': Note.B,
        COMMA: Note.C.changeOctave(1),
        PERIOD: Note.D.changeOctave(1),
        FORWARD_SLASH: Note.E.changeOctave(1),
        
        's': Note.Db,
        'd': Note.Eb,
        'g': Note.Gb,
        'h': Note.Ab,
        'j': Note.Bb,
        'l': Note.Db.changeOctave(1),
        SEMICOLON: Note.Eb.changeOctave(1),

        'q': Note.C.changeOctave(1),
        'w': Note.D.changeOctave(1),
        'e': Note.E.changeOctave(1),
        'r': Note.F.changeOctave(1),
        't': Note.G.changeOctave(1),
        'y': Note.A.changeOctave(1),
        'u': Note.B.changeOctave(1),
        'i': Note.C.changeOctave(2),
        'o': Note.D.changeOctave(2),
        'p': Note.E.changeOctave(2),
        
        '2': Note.Db.changeOctave(1),
        '3': Note.Eb.changeOctave(1),
        '5': Note.Gb.changeOctave(1),
        '6': Note.Ab.changeOctave(1),
        '7': Note.Bb.changeOctave(1),
        '9': Note.Db.changeOctave(2),
        '0': Note.Eb.changeOctave(2),
    },
    
	// key layout 2
    {
        'a': Note.C,
        's': Note.D,
        'd': Note.E,
        'f': Note.F,
        'g': Note.G,
        'h': Note.A,
        'j': Note.B,
        'k': Note.C.changeOctave(1),
        'l': Note.D.changeOctave(1),

        'w': Note.Db,
        'e': Note.Eb,
        't': Note.Gb,
        'y': Note.Ab,
        'u': Note.Bb,
        'o': Note.Db.changeOctave(1),
    }],
    
    numberOfInputs: 0,
    numberOfOutputs: 0,
    numberOfControlOutputs: 2,
    numberOfParams: 0,
    
	getController: function(index) {
        var info = null;
        switch (index) {
            case 0: return this.frequencyController; break;
            case 1: return this.gateController; break;
        }
        return info;
	},

    adjustOctaves: function(adjustment) {
        var newOctave = 4 + this.octaveAdjustment + adjustment;
        if (newOctave < 1 || newOctave > 9) {
            return;
        }
        
        this.octaveAdjustment += adjustment;
		var keyLayout = this.keyLayouts[this.keyLayoutIndex];
        for (var key in keyLayout) {
            note = keyLayout[key];
            keyLayout[key] = note.changeOctave(adjustment);
        }
        this.noteOff();
    },
    
    octaveDown: function() {
        this.adjustOctaves(-1);
    },
    
    octaveUp: function() {
        this.adjustOctaves(1);
    },
    
    setLayoutIndex: function(idx) {
        this.keyLayoutIndex = idx;
    },

    onKeyDown: function(event) {
        if (event.keyCode == KeyCode.RIGHT_ARROW) {
            return this.adjustOctaves(1);
        }
        else if (event.keyCode == KeyCode.LEFT_ARROW) {
            return this.adjustOctaves(-1);
        }
        
		var keyLayout = this.keyLayouts[this.keyLayoutIndex];
        var note = keyLayout[keyCodeToStringKey(event.keyCode)];
        if (!note || this.lastNote == note) {
            return;
        }
        this.noteOn(note);
    },

    onKeyUp: function(event) {
		var keyLayout = this.keyLayouts[this.keyLayoutIndex];
        var note = keyLayout[keyCodeToStringKey(event.keyCode)];
        if (this.lastNote != note) {
            return;
        }

        this.noteOff();
    },
    
    noteOn: function(note) {
        for (var i=0, L=this.frequencyController.controlledParams.length; i<L; i++) {
        	this.frequencyController.controlledParams[i].setValueAtTime(note.freq, now());
        }
        for (var i=0, L=this.gateController.controlledParams.length; i<L; i++) {
        	this.gateController.controlledParams[i].setValueAtTime(1.0, now());
        }
		this.pianoKeySpan.html(note.display());
        this.lastNote = note;
    },

    noteOff: function() {
        for (var i=0, L=this.gateController.controlledParams.length; i<L; i++) {
        	this.gateController.controlledParams[i].setValueAtTime(0, now());
        }
        this.lastNote = null;
    },

	populateBox: function(box) {
		box.append($('<p><strong><span id="piano-key">?</span></strong></p>'));
		box.append($('<p><a id="piano-octave-down">Octave down</a> <a id="piano-octave-up">Octave up</a></p>'));
		box.append($('<p><a id="piano-set-layout1">Layout 1</a> <a id="piano-set-layout2">Layout 2</a></p>'));
		
		this.pianoKeySpan = box.find('#piano-key');
		
		var self = this;
		box.find('#piano-octave-down').on("click", function() {self.octaveDown();});
		box.find('#piano-octave-up').on("click", function() {self.octaveUp();});
		box.find('#piano-set-layout1').on("click", function() {self.setLayoutIndex(0);});
		box.find('#piano-set-layout2').on("click", function() {self.setLayoutIndex(1);});
	},
});
