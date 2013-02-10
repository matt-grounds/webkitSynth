NS_SVG = 'http://www.w3.org/2000/svg';

function DisplayNode() {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.2;
	this.displayType = 0;
}

$.extend(DisplayNode.prototype, {
    numberOfInputs: 1,
    numberOfOutputs: 1,

    getInput: function(index) { return this.analyser.getInput(index); },
    getOutput: function(index) { return this.analyser.getOutput(index); },

    populateBox: function(box) {
        var svg = document.createElementNS(NS_SVG, 'svg');
        this.graph = document.createElementNS(NS_SVG, 'path');
        this.graph.style.fill = 'none';
        this.graph.style.stroke = 'red';
        this.graph.style.strokeWidth = '2px';

		this.graphWidth = 256;
        svg.style.width = this.graphWidth + 'px';
        svg.style.height = '128px';
        this.graph.setAttributeNS('', 'transform', 'translate(0,128) scale(1,-1)');

        svg.appendChild(this.graph);
		var container = $('<div>');
        box.append(container);
        container.append(svg);

		var self = this;
        function update() {
			self["displayFunc" + self.displayType]();
        }

		// TODO remove interval when component is removed from board
        setInterval(update, 50);

		var toggle = $("<div>")
			.addClass('togglebutton')
			.button({ icons: { primary: "ui-icon-shuffle" }, text: false })
			.click(function() {self.displayType = (self.displayType + 1) % 2;});
		box.append(toggle);
	},

	displayFunc0: function() {
		// FFT Display
		
		var d = 'M';
		function pt(x,y) { d += ' ' + x + ',' + y; }

		var arr = new Float32Array(this.analyser.frequencyBinCount);
		this.analyser.getFloatFrequencyData(arr);

		pt(0,0);
		for (var i = 0, L = this.analyser.frequencyBinCount / 8; i < L; ++i) {
			var height = 127 + arr[i];
			pt(i / L * 256, height);
			pt((i+1) / L * 256, height);
		}
		pt(256,0);

		this.graph.setAttributeNS('', 'd', d);
	},

	displayFunc1: function() {
		// Waveform display
		var d = 'M';
		function pt(x,y) { d += ' ' + x + ',' + y; }

		var arr = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteTimeDomainData(arr);

		var L = this.analyser.frequencyBinCount / 8;

		// Find first zero crossing
		var zc = 0;
		for (var j=0; j < L; ++j) {
			if(arr[j]<=127 && arr[j+1]>127)
			{
				zc = j;
				break;
			}
		}

		pt(0,arr[zc]/2.0);
		for (var i = 0; i < L; ++i) {
			var height = arr[i+zc] / 2.0;
			pt(i / L * this.graphWidth, height);
			pt((i+1) / L * this.graphWidth, height);
		}
		pt(this.graphWidth,arr[L+zc-1]/2.0);

		this.graph.setAttributeNS('', 'd', d);
	},
});
