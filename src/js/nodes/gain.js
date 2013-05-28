function GainNode() {
	this.normalGainNode = audioContext.createGainNode();
	this.gain = this.normalGainNode.gain;
	this.hasExpander = true;
}

$.extend(GainNode.prototype, {
	numberOfInputs: 1,
	numberOfOutputs: 1,
    numberOfParams: 1,

	getInput: function(index) {
		return this.normalGainNode.getInput(index);
	},
	getOutput: function(index) {
		return this.normalGainNode.getOutput(index);
	},

    getParam: function(index) {
        var info = null;
        switch (index) {
            case 0: info = { name: 'gain', param: this.gain };
                    break;
        }
        return info;
    },

	populateBox: function(box) {
		var self = this;
		makeKnob({
			'parent': box,
			'name': 'Gain (dB)',
			'min': -50.0,
			'max': 12.0,
			'initial': 0.0,
			'updateFunc': function(val) { self.gain.linearRampToValueAtTime(Math.pow(10.0, val/10.0), later(0.05)); },
		});
	},

});
