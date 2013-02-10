ConfigView = function(options) {
	this.config = options.config;
	this.callback = options.callback;
}

$.extend(ConfigView.prototype, {
    render: function() {
		this.viewElement = $('<div>')
		var form = $('<form>');
		
		var textArea = $('<textarea rows="20" cols="50">').addClass('configText').text(this.config);
		form.append(textArea);

		var self = this;
		var para = $('<p><br/></p>');
		para.append($('<a>').text("Load").on("click", function() {self.load();}));
		para.append($('<a>').text("Close").on("click", function() {self.close();}));
		form.append(para);
		
		this.viewElement.append(form);

        this.viewElement.dialog({
            title: "Your Board",
            height: 500,
            width: 460
        });
    },
    
    load: function() {
        var config = this.viewElement.find('.configText').val();
        this.callback(config);
        this.close();
    },
    
    close: function() {
        this.viewElement.dialog('close');
        this.viewElement.remove();
    }
});
