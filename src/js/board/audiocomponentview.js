AudioComponentView = function(options) {
	this.audioComponent = options.audioComponent;
	this.pos = options.pos;
	this.closeCallback = options.closeCallback;
	this.id = options.id;
	this.type = this.audioComponent.constructor.name;

	this.hasExpander = this.audioComponent.hasExpander;
	if(this.hasExpander)
	{
		this.expanded = options.expanded ? true : false;
	}
}

$.extend(AudioComponentView.prototype, {
   
    close: function() {
        jsPlumb.removeAllEndpoints(this.id);
        this.closeCallback(this);
        this.viewElement.remove();
    },
    
    expandToggle: function() {
		var containingView = this;
        this.viewElement.find('.nodeContent').slideToggle({
			'duration': 500,
			'step': function() {
				jsPlumb.repaint($(this).parent().attr("id"));
			},
			'complete': function() {
				// Animation completed...
				jsPlumb.repaint($(this).parent().attr("id"));
				if($(this).is(":visible"))
				{
					containingView.setExpanded(true);
				}
				else
				{
					containingView.setExpanded(false);
				}
			},
		});
    },
    
    render: function() {
		this.viewElement = $('<div>').addClass('window').attr('id', this.id);

		var self = this;
		this.viewElement.append($("<div>").addClass("closebutton").on("click", function() {self.close();}));
		this.viewElement.append($("<div>").addClass("nodeNameContainer").text(this.id));
		this.viewElement.append($("<div>").addClass("nodeContent"));
		this.viewElement.append($("<div>").addClass("expandbutton").on("click", function() {self.expandToggle();}));

		// set up jQueryUI buttons
		this.viewElement.find('.closebutton').button({ icons: { primary: "ui-icon-close" }, text: false });
		this.viewElement.find('.expandbutton').button({ text: false });
		if(!this.hasExpander)
		{
			this.viewElement.find('.expandbutton').hide();
		}
		
        // see if we can take this out now
        this.viewElement[0].audioNode = this.audioComponent;

        // sooooo hax.  should have individual component views.  oh well.
        if (this.audioComponent.populateBox != null)
            this.audioComponent.populateBox(this.viewElement.find('.nodeContent'));

		if(this.hasExpander)
		{
			this.setExpanded(this.expanded);
		}
			
        this.viewElement.addClass(this.type);
        
        return this;
    },
    
    /**
     * Must be called *after* render and after element is put into DOM.  jsPlumb expects the div
     * to be in the DOM
     * @param div
     * @param component
     */
    plumb: function() {
        var div = this.viewElement[0];
        var component = this.audioComponent;
        component.endpoints = {};

        for (var i = 0, L = component.numberOfInputs; i < L; ++i) {
            var pos = (i + 1) / (L + 1);
            this.attachEndpoint(div, component, 'input', i, SynthPlumb.targetEndpoint, [0,pos,-1,0]);
        }
        for (var i = 0, L = component.numberOfOutputs; i < L; ++i) {
            var pos = (i + 1) / (L + 1);
            this.attachEndpoint(div, component, 'output', i, SynthPlumb.sourceEndpoint, [1,pos,1,0]);
        }
        if (component.numberOfParams) {
            for (var i = 0, L = component.numberOfParams; i < L; ++i) {
                var name = component.getParam(i).name;
                var pos = (i + 1) / (L + 1);
                var overlay = [ "Label", { location:[0.5, -0.5], label: name, cssClass:"endpointParamLabel" } ];
                this.attachEndpoint(div, component, 'param', i, SynthPlumb.paramEndpoint, [pos,0,0,0], overlay, name);
            }
        }
        if (component.numberOfControlOutputs) {
            for (var i = 0, L = component.numberOfControlOutputs; i < L; ++i) {
				var name = component.getController(i).name;
                var pos = (i + 1) / (L + 1);
                var overlay = [ "Label", { location:[0.5, 1.5], label: name, cssClass:"endpointParamLabel" } ];
                this.attachEndpoint(div, component, 'controlOutput', i, SynthPlumb.masterEndpoint, [pos,1,0,0], overlay, name);
            }
        }

        jsPlumb.draggable(div);
		
		// Allow knobs to be manipulated without dragging the containing window
		$(div).draggable( "option", "cancel", "input,textarea,button,select,option,.rot-knob-base" );
    },

    attachEndpoint: function(div, component, type, index, endpointDef, anchor, overlay, name) {
        var options = {anchor: anchor};
        if (overlay) {
            options.overlays = [overlay];
        }
        var endpoint = jsPlumb.addEndpoint(div, endpointDef, options);
        endpoint.index = index;
        endpoint.type = type;
        if (name) {
            endpoint.name = endpoint.type + "-" + name;
        }
        else {
            endpoint.name = endpoint.type + endpoint.index;
        }
        //console.log("creating endpoint " + endpoint.name + " for component " + component.id);
        endpoint.component = component;
        component.endpoints[endpoint.name] = endpoint;
        return endpoint;
    },

    getX: function() {
        return this.viewElement.offset().left;
    },

    getY: function() {
        return this.viewElement.offset().top;
    },

    isExpanded: function() {
        return this.expanded;
    },
	
	setExpanded: function(expanded) {
		this.expanded = expanded;
		if(expanded)
		{
			this.viewElement.find('.expandbutton').button( "option", "icons", { primary: "ui-icon-arrowthickstop-1-n" } );
			this.viewElement.find('.nodeContent').show();
		}
		else
		{
			this.viewElement.find('.expandbutton').button( "option", "icons", { primary: "ui-icon-arrowthickstop-1-s" } );
			this.viewElement.find('.nodeContent').hide();
		}
	},
});
