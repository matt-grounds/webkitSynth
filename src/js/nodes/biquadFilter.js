function BiquadFilterNode() {
	this.node = audioContext.createBiquadFilter();
	this.gain = this.node.gain;
	this.frequency = this.node.frequency;
	this.Q = this.node.Q;
	this.hasExpander = true;
}

$.extend(BiquadFilterNode.prototype, {
	numberOfInputs: 1,
	numberOfOutputs: 1,
	numberOfParams: 3,

	getInput: function(index) {
		return this.node.getInput(index);
	},
	getOutput: function(index) {
		return this.node.getOutput(index);
	},
    getParam: function(index) {
        var info = null;
        switch (index) {
            case 0: info = { name: 'gain', param: this.gain };
                    break;
            case 1: info = { name: 'freq', param: this.frequency };
                    break;
            case 2: info = { name: 'Q', param: this.Q };
                    break;
        }
        return info;
    },
	
    populateBox: function(box) {
            var type_select = $('<select>');
            function addFilterType(name, value) {
                option = $('<option>').html(name).val(value);
                type_select.append(option);
            }
            addFilterType('Lowpass',   this.node.LOWPASS);
            addFilterType('Highpass',  this.node.HIGHPASS);
            addFilterType('Bandpass',  this.node.BANDPASS);
            addFilterType('Lowshelf',  this.node.LOWSHELF);
            addFilterType('Highshelf', this.node.HIGHSHELF);
            addFilterType('Peaking',   this.node.PEAKING);
            addFilterType('Notch',     this.node.NOTCH);
            addFilterType('Allpass',   this.node.ALLPASS);
			var filterNode = this.node;
            type_select.change(function() {
                filterNode.type = +type_select.val();
            });
            box.append(type_select);

			var self = this;
			makeKnob({
				'parent': box,
				'name': 'Frequency',
				'min': 0.0,
				'max': 10000.0,
				'initial': 0.0,
				'updateFunc': function(val) { self.frequency.linearRampToValueAtTime(val, later(0.01)); },
			});
			
			makeKnob({
				'parent': box,
				'name': 'Q',
				'min': 0.0,
				'max': 1.0,
				'initial': 0.4,
				'updateFunc': function(val) { self.Q.linearRampToValueAtTime(val, later(0.01)); },
			});
			
			makeKnob({
				'parent': box,
				'name': 'Gain',
				'min': -50.0,
				'max': 12.0,
				'initial': 0.0,
				'updateFunc': function(val) { self.gain.linearRampToValueAtTime(val, later(0.01)); },
			});
	},
});
