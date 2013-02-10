// Helper class for ADSR which pretends to be a param
function ADSRFakeParam(owner) {
	this.owner = owner;
}

$.extend(ADSRFakeParam.prototype, {
	setValueAtTime: function(value, time) {
		this.owner.trigger(value != 0);
	}
});

function ADSRNode() {
    this.attack = 0.25;
    this.decay = 0.25;
    this.sustain = 1.0;
    this.release = 0.25;

	this.controller = new ParamController('controller');
	this.fakeParam = new ADSRFakeParam(this);

	this.hasExpander = true;
}

$.extend(ADSRNode.prototype, {
    numberOfInputs: 0,
    numberOfOutputs: 0,
	numberOfParams: 1,
    numberOfControlOutputs: 1,

    getParam: function(index) {
        var info = null;
        switch (index) {
            case 0: info = { name: 'trigger', param: this.fakeParam };
                    break;
        }
        return info;
    },

	getController: function(index) {
        var info = null;
        switch (index) {
            case 0: return this.controller; break;
        }
        return info;
	},
	
    trigger: function(bOn) {
    	if(bOn)
    	{
    		//console.log("ADSR trigger attack and decay phases");
    		for (var i = 0; i < this.controller.controlledParams.length; i++) {
    			var currentParam = this.controller.controlledParams[i];
				currentParam.cancelScheduledValues(now());
    			currentParam.setValueAtTime(currentParam.value, now());
    			currentParam.linearRampToValueAtTime(1.0, later(this.attack));
    			currentParam.linearRampToValueAtTime(this.sustain, later(this.attack + this.decay));
			}
    	}
    	else
    	{
    		//console.log("ADSR trigger release phase");
    		for (var i = 0; i < this.controller.controlledParams.length; i++) {
    			var currentParam = this.controller.controlledParams[i];
    			currentParam.cancelScheduledValues(now());
				currentParam.setValueAtTime(currentParam.value, now());
    			currentParam.linearRampToValueAtTime(0.0, later(this.release));
			}
    	}
    },
	
    populateBox: function(box) {
		var self = this;
		makeKnob({
			'parent': box,
			'name': 'Attack',
			'min': 0.0,
			'max': 1.0,
			'initial': 0.25,
			'updateFunc': function(val) { self.attack = parseFloat(val); },
		});
		makeKnob({
			'parent': box,
			'name': 'Decay',
			'min': 0.0,
			'max': 1.0,
			'initial': 0.25,
			'updateFunc': function(val) { self.decay = parseFloat(val); },
		});
		makeKnob({
			'parent': box,
			'name': 'Sustain',
			'min': 0.0,
			'max': 1.0,
			'initial': 1.0,
			'updateFunc': function(val) { self.sustain = parseFloat(val); },
		});
		makeKnob({
			'parent': box,
			'name': 'Release',
			'min': 0.0,
			'max': 1.0,
			'initial': 0.25,
			'updateFunc': function(val) { self.release = parseFloat(val); },
		});
	},
});
