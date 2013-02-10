function CompressorNode() {
	this.normalCompressorNode = audioContext.createDynamicsCompressor();
	this.threshold = this.normalCompressorNode.threshold;
	this.knee = this.normalCompressorNode.knee;
	this.ratio = this.normalCompressorNode.ratio;
	this.attack = this.normalCompressorNode.attack;
	this.release = this.normalCompressorNode.release;
	this.hasExpander = true;
}

$.extend(CompressorNode.prototype, {
	numberOfInputs: 1,
	numberOfOutputs: 1,

	getInput: function(index) {
		return this.normalCompressorNode.getInput(index);
	},

	getOutput: function(index) {
		return this.normalCompressorNode.getOutput(index);
	},

	populateBox: function(box) {
		var self = this;

		makeKnob({
			'parent': box,
			'name': 'Threshold',
			'min': -40.0,
			'max': 0.0,
			'initial': -24.0,
			'updateFunc': function(val) { self.threshold.linearRampToValueAtTime(val, later(0.01)); },
		});

		makeKnob({
			'parent': box,
			'name': 'Knee',
			'min': 10.0,
			'max': 40.0,
			'initial': 30.0,
			'updateFunc': function(val) { self.knee.linearRampToValueAtTime(val, later(0.01)); },
		});

		makeKnob({
			'parent': box,
			'name': 'Ratio',
			'min': 1.0,
			'max': 15.0,
			'initial': 12.0,
			'updateFunc': function(val) { self.ratio.linearRampToValueAtTime(val, later(0.01)); },
		});

		makeKnob({
			'parent': box,
			'name': 'Attack',
			'min': 0.0,
			'max': 0.03,
			'initial': 0.015,
			'updateFunc': function(val) { self.attack.linearRampToValueAtTime(val, later(0.01)); },
		});

		makeKnob({
			'parent': box,
			'name': 'Release',
			'min': 0.0,
			'max': 0.25,
			'initial': 0.15,
			'updateFunc': function(val) { self.release.linearRampToValueAtTime(val, later(0.01)); },
		});
	},

});
