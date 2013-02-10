function StereoOutputNode(settings) {
    this.merger = audioContext.createChannelMerger(2);
    this.merger.connect(audioContext.destination);
}

$.extend(StereoOutputNode.prototype, {
    numberOfInputs: 2,
    numberOfOutputs: 0,

    getInput: function(index) {
        return { node: this.merger, index: index };
    },
    getOutput: function(index) {
        return null;
    },
});
