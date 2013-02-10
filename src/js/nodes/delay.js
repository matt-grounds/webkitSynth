function DelayNode() {
	this.normalDelayNode = audioContext.createDelayNode(2.1);
	this.delayTime = this.normalDelayNode.delayTime;
	this.hasExpander = true;
}

$.extend(DelayNode.prototype, {
	numberOfInputs: 1,
	numberOfOutputs: 1,

	getInput: function(index) {
		return this.normalDelayNode.getInput(index);
	},
	getOutput: function(index) {
		return this.normalDelayNode.getOutput(index);
	},

	populateBox: function(box) {
		var self = this;
		makeKnob({
			'parent': box,
			'name': 'Delay (s)',
			'min': 0.0,
			'max': 2.0,
			'initial': 0.0,
			'updateFunc': function(val) { self.delayTime.linearRampToValueAtTime(val, later(0.01)); },
		});
	},
});
