function Oscillator(settings) {
    this.node = audioContext.createOscillator();
    if (this.node.noteOn)
        this.node.noteOn(0);

	if (settings && (settings.frequency != undefined)) {
        this.node.frequency = settings.frequency;
    }

    this.frequency = this.node.frequency;
    this.detune = this.node.detune;
	
	this.hasExpander = true;
}

$.extend(Oscillator.prototype, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    numberOfParams: 2,

    getInput: function(index) {
        return this.node.getInput(index);
    },
    getOutput: function(index) {
        return this.node.getOutput(index);
    },
    getParam: function(index) {
        var info = null;
        switch (index) {
            case 0: info = { name: 'freq', param: this.frequency };
                    break;
            case 1: info = { name: 'detune', param: this.detune };
                    break;
        }
        return info;
    },

    populateBox: function(box) {
		var form = $("<form>").addClass('signal_choice').attr('id', 'signal_choice_form_'+name);
		box.append(form);

		var signalList = $('<ul>');
		form.append(signalList);
		
		var element = this;
		function addSignalType(name, value) {
			li = $('<li>');
			input = $('<input type="radio" name="signal_type">');
			li.append(input, name);
			input.change(function(evt) {
				element.type = value;
			});
			signalList.append(li);
		}
		addSignalType('Sine', this.node.SINE);
		addSignalType('Triangle', this.node.TRIANGLE);
		addSignalType('Square', this.node.SQUARE);
		addSignalType('Sawtooth', this.node.SAWTOOTH);

		makeKnob({
			'parent': box,
			'name': 'Frequency',
			'min': 0.0,
			'max': 10000.0,
			'initial': 440.0,
			'updateFunc': function(val) { element.frequency.linearRampToValueAtTime(val, later(0.01)); },
		});

		$('div.signal_choice input').change(function(){
			$(this).parents('form').submit();
		});
    },
});

Object.defineProperty(Oscillator.prototype, 'type', {
    get: function() {
        return this.node.type;
    },
    set: function(v) {
        this.node.type = v;
    },
    enumerable: true,
    configurable: false,
});
