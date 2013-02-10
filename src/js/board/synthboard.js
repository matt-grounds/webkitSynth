// initialized during WebkitSynth.start
var audioContext = null;

function now() { return audioContext.currentTime; }
function later(x) { return now() + x; }


SynthComponent = function(options) {
};

SynthComponentType = {};
SynthComponentType.values = ['Oscillator', 'Display', 'StereoOutput', 'BiquadFilter', 'Gain', 'Delay', 'Compressor', 'ADSR', 'Piano'];

/**
 * Declarative representation of the board
 */
SynthBoard = function(boardDef) {
    this.idCounts = {};
    this.components = {};
    this.views = {};
    
    this.loadConfig(boardDef);
    
    var self = this;
    $(document).keydown(function (event) {
        self.onKeyDown(event);
    });
    $(document).keyup(function (event) {
        self.onKeyUp(event);
    });
    $('#board-save').click(function (event) {
        self.onSaveClick();
    });
};

$.extend(SynthBoard.prototype, {
    onSaveClick: function() {
        var json = this.toJSON();
		var self = this;
        var configView = new ConfigView({
            config: $.toJSON(json),
			callback: function(conf) {self.loadConfigFromJSON(conf);},
        });
        configView.render();
    },
    
    toJSON: function() {
		var self = this;
		
        var componentDefs = $.map(this.components, function(component, id) {
            var def = {
                type: self.prettyName(component.constructor.name),
                id: id
            };
            if (component.getSettings) {
                def.settings = component.getSettings();
            }
            return def;
        });
        
        $.each(componentDefs, function (idx, def) {
            var view = self.views[def.id];
            if (view) {
                def.x = view.getX();
                def.y = view.getY();
				if(view.hasExpander)
				{
					def.expanded = view.isExpanded();
				}
            }
        });
        
        var connections = jsPlumb.getAllConnections().jsPlumb_DefaultScope;
        var connectionDefs = $.map(connections, function(connection, idx) {
            var sourceEndpoint = connection.endpoints[0];
            var targetEndpoint = connection.endpoints[1];
            return {
                source: {
                    component: sourceEndpoint.elementId,
                    endpoint: sourceEndpoint.name
                },
                target: {
                    component: targetEndpoint.elementId,
                    endpoint: targetEndpoint.name
                }
            };
        });
        
        return {
            components: componentDefs,
            connections: connectionDefs
        };
    },
    
    loadConfigFromJSON: function(configStr) {
        var boardDef = $.evalJSON(configStr);
        jsPlumb.detachAllConnections();
        this.closeAllComponents();
        this.loadConfig(boardDef);
    },
    
    closeAllComponents: function() {
        $.each(this.views, function(idx, view) {
            view.close();
        });
        this.views = {};
        this.components = {};
    },
    
    loadConfig: function(boardDef) {
		var self = this;
		
        $.each(boardDef.components, function(idx, componentDef) {
            self.createAudioComponent(
				componentDef.type,
				componentDef.settings,
				{'x': componentDef.x, 'y': componentDef.y, 'expanded': componentDef.expanded},
				componentDef.id);
        });

        $.each(boardDef.connections, function(idx, connectionDef) {
            var source = self.components[connectionDef.source.component];
            var target = self.components[connectionDef.target.component];
            jsPlumb.connect({
                source: source.endpoints[connectionDef.source.endpoint],
                target: target.endpoints[connectionDef.target.endpoint]
            });
        });
    },
    
    prettyName: function(name) {
        if (name.indexOf("Node") != -1) {
            name = name.substring(0, name.indexOf("Node"));
        }
        return name;
    },
    
    createAudioComponent: function(typeStr, settings, displaySettings, id) {
        var component = null;
        switch (typeStr)
        {
            case 'Oscillator': component =  new Oscillator(settings);
            break;
            case 'BiquadFilter': component =  new BiquadFilterNode();
            break;
            case 'StereoOutput': component =  new StereoOutputNode(settings);
            break;
            case 'Display': component =  new DisplayNode(settings);
            break;
            case 'Piano': component =  new Piano(settings);
            break;
            case 'Gain': component =  new GainNode();
            break;
            case 'Delay': component =  new DelayNode();
            break;
			case 'Compressor': component = new CompressorNode();
			break;
            case 'ADSR': component =  new ADSRNode();
            break;
        }
        if (component) {
            var view = this.createViewForAudioComponent(component, displaySettings, id);
            this.components[view.id] = component;
        }
        return component;
    },

    nextId: function(prefix) {
        prefix = this.prettyName(prefix);
        
        if (!(prefix in this.idCounts)) {
            this.idCounts[prefix] = 0;
        }
        var result = prefix + this.idCounts[prefix];
        // stuff might have persisted ID
        while ($("#" + result).get(0)) {
            ++this.idCounts[prefix];
            result = prefix + this.idCounts[prefix];
        }
        ++this.idCounts[prefix];
        return result;
    },

    createViewForAudioComponent: function (audioComponent, displaySettings, id) {
        var view;
        var type = audioComponent.constructor.name;
        id = id ? id : this.nextId(type);

		var self = this;
        var viewParams = {
            type: type,
            id: id,
            audioComponent: audioComponent,
            closeCallback: function(v) {self.componentClosed(v);},
            pos: [displaySettings.x, displaySettings.y],
			expanded: displaySettings.expanded,
        };
        view = new AudioComponentView(viewParams);
        view.render();
        $('#demo').append(view.viewElement);

        // gotta do this after its in the DOM too.
        if (view.pos != null) {
            view.viewElement.offset({left: view.pos[0], top: view.pos[1]});
        }
        
        view.plumb();  // must be called after view is put into the DOM

        this.views[id] = view;
        return view;
    },

    componentClosed: function(componentView) {
        console.log("removing component " + componentView.id);
        delete this.components[componentView.id];
        delete this.views[componentView.id];
    },

	// There's probably a nicer jQuery way of doing this for keyDown and keyUp events
    onKeyDown: function(event) {
		$.each(this.components, function(id, component) {
            if(component.onKeyDown)
			{
				component.onKeyDown(event);
			}
        });
    },

    onKeyUp: function(event) {
		$.each(this.components, function(id, component) {
            if(component.onKeyUp)
			{
				component.onKeyUp(event);
			}
        });
    },

});



/**
 * Some common jsPlumb configuration parameters
 */
SynthPlumb = {};

SynthPlumb.audioConnectorPaintStyle = {
    lineWidth:5,
    strokeStyle:"#99DD55",
    joinstyle:"round",
    outlineColor:"white",
    outlineWidth:7
};
// .. and this is the hover style.
SynthPlumb.audioConnectorHoverStyle = {
    lineWidth:7,
    strokeStyle:"#992222"
};

SynthPlumb.controlConnectorPaintStyle = {
    lineWidth:5,
    strokeStyle:"#5599DD",
    joinstyle:"round",
    outlineColor:"white",
    outlineWidth:7
};
// .. and this is the hover style.
SynthPlumb.controlConnectorHoverStyle = {
    lineWidth:7,
    strokeStyle:"#992222"
};

// the definition of source endpoints (the small blue ones)
SynthPlumb.sourceEndpoint = {
    endpoint:"Dot",
    paintStyle:{ fillStyle:"#558822",radius:7 },
    isSource:true,
    connector:["Bezier", { curviness:63 } ],
    connectorStyle:SynthPlumb.audioConnectorPaintStyle,
    hoverPaintStyle:SynthPlumb.audioConnectorHoverStyle,
    connectorHoverStyle:SynthPlumb.audioConnectorHoverStyle,
    maxConnections:-1,
    dragOptions:{},
    overlays:[
        [ "Label", {
            location:[0.5, 1.5],
            label:"output",
            cssClass:"endpointSourceLabel"
        } ]
    ]
};
// the definition of target endpoints (will appear when the user drags a connection)
SynthPlumb.targetEndpoint = {
    endpoint:"Dot",
    paintStyle:{ fillStyle:"#558822",radius:11 },
    hoverPaintStyle:SynthPlumb.audioConnectorHoverStyle,
    maxConnections:-1,
    dropOptions:{ hoverClass:"hover", activeClass:"active" },
    isTarget:true,
    overlays:[
        [ "Label", { location:[0.5, -0.5], label:"input", cssClass:"endpointTargetLabel" } ]
    ]
};
// the definition of param endpoints
SynthPlumb.paramEndpoint = {
    endpoint:"Dot",
    paintStyle:{ fillStyle:"#225588",radius:11 },
    hoverPaintStyle:SynthPlumb.controlConnectorHoverStyle,
    maxConnections:-1,
    dropOptions:{ hoverClass:"hover", activeClass:"active" },
    isTarget:true,
};

//the definition of control master endpoints
SynthPlumb.masterEndpoint = {
    endpoint:"Dot",
    paintStyle:{ fillStyle:"#225588",radius:7 },
    isSource:true,
    connector:["Bezier", { curviness:63 } ],
    connectorStyle:SynthPlumb.controlConnectorPaintStyle,
    hoverPaintStyle:SynthPlumb.controlConnectorHoverStyle,
    connectorHoverStyle:SynthPlumb.controlConnectorHoverStyle,
    maxConnections:-1,
    dragOptions:{},
    overlays:[
        [ "Label", {
            location:[0.5, 1.5],
            label:"controller",
            cssClass:"endpointSourceLabel"
        } ]
    ],
    parameters: {
        control: true
    }
};



WebkitSynth = function() {

};

$.extend(WebkitSynth.prototype, {

    /*defaultBoard: {
		"components":[
			{"type":"Piano","id":"Piano0","x":235,"y":59},
			{"type":"DisplayNode","id":"DisplayNode0","x":791,"y":282},
			{"type":"StereoOutput","id":"StereoOutput0","x":1038,"y":402},
			{"type":"Oscillator","id":"Oscillator0","x":181,"y":412,"expanded":false},
			{"type":"Gain","id":"Gain0","x":356,"y":404,"expanded":true},
			{"type":"ADSR","id":"ADSR0","x":433,"y":263,"expanded":false},
			{"type":"Delay","id":"Delay0","x":1013,"y":69,"expanded":true}
			],
		"connections":[
			{"source":{"component":"DisplayNode0","endpoint":"output0"},
			 "target":{"component":"StereoOutput0","endpoint":"input0"}},
			{"source":{"component":"Piano0","endpoint":"controlOutput-freq"},
			 "target":{"component":"Oscillator0","endpoint":"param-freq"}},
			{"source":{"component":"Oscillator0","endpoint":"output0"},
			 "target":{"component":"Gain0","endpoint":"input0"}},
			{"source":{"component":"Gain0","endpoint":"output0"},
			 "target":{"component":"DisplayNode0","endpoint":"input0"}},
			{"source":{"component":"Piano0","endpoint":"controlOutput-gate"},
			 "target":{"component":"ADSR0","endpoint":"param-trigger"}},
			{"source":{"component":"ADSR0","endpoint":"controlOutput-controller"},
			 "target":{"component":"Gain0","endpoint":"param-gain"}}]
	},*/
    
	defaultBoard: {
		"components": [
			{"type":"Piano","id":"Piano0","x":117,"y":46},
			{"type":"Display","id":"Display0","x":583,"y":241},
			{"type":"StereoOutput","id":"StereoOutput0","x":936,"y":274},
			{"type":"Oscillator","id":"Oscillator0","x":147,"y":388,"expanded":false},
			{"type":"Gain","id":"Gain0","x":394,"y":447,"expanded":true},
			{"type":"ADSR","id":"ADSR0","x":343,"y":255,"expanded":false},
		],
		"connections": [
			{"source":{"component":"Display0","endpoint":"output0"},"target":{"component":"StereoOutput0","endpoint":"input0"}},
			{"source":{"component":"Piano0","endpoint":"controlOutput-freq"},"target":{"component":"Oscillator0","endpoint":"param-freq"}},
			{"source":{"component":"Oscillator0","endpoint":"output0"},"target":{"component":"Gain0","endpoint":"input0"}},
			{"source":{"component":"Gain0","endpoint":"output0"},"target":{"component":"Display0","endpoint":"input0"}},
			{"source":{"component":"Piano0","endpoint":"controlOutput-gate"},"target":{"component":"ADSR0","endpoint":"param-trigger"}},
			{"source":{"component":"ADSR0","endpoint":"controlOutput-controller"},"target":{"component":"Gain0","endpoint":"param-gain"}},
		],
	},
	
    start: function() {
        this.initializeJsPlumb();

        //
        // now let's try and get some Web Audio API stuff going
        //

        this.initializeBasicAudio();

        this.board = new SynthBoard(this.defaultBoard);

        $.each(SynthComponentType.values, function(idx, type) {
            createMenuItemForComponentType(type);
        });
		
		$("#menu").menu();
		
		var self = this;
		$("#menu").bind( "menuselect", function(event, ui) {
			self.board.createAudioComponent(ui.item[0].audioNodeType, {}, {'x': $('#menu').attr('x'), 'y': $('#menu').attr('y')});
		});
    },


    initializeJsPlumb: function() {
        jsPlumb.importDefaults({
            // default drag options
            DragOptions : { cursor: 'pointer', zIndex:2000 },
            // default to blue at one end and green at the other
            EndpointStyles : [{ fillStyle:'#225588' }, { fillStyle:'#558822' }],
            // blue endpoints 7 px; green endpoints 11.
            Endpoints : [ [ "Dot", {radius:7} ], [ "Dot", { radius:11 } ]],
            // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
            // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
            ConnectionOverlays : [
                [ "Arrow", { location:0.9 } ]
            ]
        });

        //
        // listen for clicks on connections, and offer to delete connections on click.
        //
        jsPlumb.bind("click", function(conn, originalEvent) {
            if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
                jsPlumb.detach(conn);
        });

        jsPlumb.bind("connectionDrag", function(connection) {
            console.log("connection " + connection.id + " is being dragged");
        });

        jsPlumb.bind("connectionDragStop", function(connection) {
            console.log("connection " + connection.id + " was dragged");
        });

        // Set up audio-related event handlers
        jsPlumb.bind("jsPlumbConnection",function(info) {
            // check if this is a control connection
            var sourceEndpoint = info.sourceEndpoint;
            var targetEndpoint = info.targetEndpoint;
            if (sourceEndpoint.type == 'controlOutput' && targetEndpoint.type == 'param')
            {
            	target = info.target[0].audioNode.getParam(targetEndpoint.index);
            	info.source[0].audioNode.getController(sourceEndpoint.index).add(target.param);
            	return;
            }
            else if (sourceEndpoint.type == 'controlOutput') {
                // TODO: reject connection, mismatched
                return;
            }

            // normal stream
			connectAudioOutputEndpoints(sourceEndpoint, targetEndpoint);
        });

        jsPlumb.bind("jsPlumbConnectionDetached",function(info) {
            // check if this is a control connection
            var sourceEndpoint = info.sourceEndpoint;
            var targetEndpoint = info.targetEndpoint;
            if (sourceEndpoint.type == 'controlOutput' && targetEndpoint.type == 'param')
            {
            	target = info.target[0].audioNode.getParam(targetEndpoint.index);
            	info.source[0].audioNode.getController(sourceEndpoint.index).remove(target.param);
            	return;
            }
            else if (sourceEndpoint.type == 'controlOutput') {
                // TODO: reject connection, mismatched
                return;
            }

            // normal stream
            var output = info.source[0].audioNode.getOutput(info.sourceEndpoint.index);
            output.node.disconnect(output.index);
			
			// because of limitations in underlying Web Audio API, reconnect any remaining connections
			var otherConnections = jsPlumb.getConnections({source: info.source[0].id});
			for (var i = 0, L = otherConnections.length; i < L; ++i) {
				var otherEndpoints = otherConnections[i].endpoints;
                connectAudioOutputEndpoints(otherEndpoints[0], otherEndpoints[1]);
            }
        });

    },

    initializeBasicAudio: function() {
        // this is a global
        audioContext = new webkitAudioContext();

        // Add getInput/getOutput methods to all AudioNodes

        // First we find the actual AudioNode constructor by walking the
        // prototype chain of an AudioNode object.  This is kind of a hack, but
        // it works.

        var AudioNode = Object.getPrototypeOf(audioContext.destination);
        while (AudioNode.constructor.name != 'AudioNode') {
            AudioNode = Object.getPrototypeOf(AudioNode);
        }
        AudioNode = AudioNode.constructor;

        // Now actually add the functions.
        AudioNode.prototype.getOutput = function(index) {
            return { node: this, index: index };
        };
        AudioNode.prototype.getInput = function(index) {
            return { node: this, index: index };
        };
    }

});

function connectAudioOutputEndpoints(sourceEndpoint, targetEndpoint) {
	var output = sourceEndpoint.element[0].audioNode.getOutput(sourceEndpoint.index);
	if (targetEndpoint.type == 'input')
	{
		target = targetEndpoint.element[0].audioNode.getInput(targetEndpoint.index);
		//console.log('connect', output.node, output.index, ' to input ', target.node, target.index);
		output.node.connect(target.node, output.index, target.index);
	}
	else if (targetEndpoint.type == 'param')
	{
		target = targetEndpoint.element[0].audioNode.getParam(targetEndpoint.index);
		//console.log('connect', output.node, output.index, ' to param ', target.param);
		output.node.connect(target.param, output.index);
	}
}

function makeKnob(options) {
	// options is an object where the following keys are valid:
	// parent, name, min, max, initial, updateFunc
	
	var knobInput = $("<input type='text' size='4' autocomplete='off'>");
	knobInput.attr('value', options.initial)
	options.parent.append(knobInput);
	knobInput.knobRot({
		'classes': ['circle'],
		'frameCount': 69,
		'detent': false,
		'minimumValue': options.min,
		'maximumValue': options.max,
		'dragMultiplier': (options.max - options.min) / 300.0,
	});
	knobInput.on('knobdrag', function() { options.updateFunc(knobInput.val()); });
	var knobName = $("<div>").addClass('knob_label').text(options.name);
	knobInput.after(knobName);
}

function ParamController(name) {
	this.name = name;
	this.controlledParams = [];
}

$.extend(ParamController.prototype, {
    add: function(audioParam) {
        this.controlledParams.push(audioParam);
    },

    remove: function(audioParam) {
		var idx = this.controlledParams.indexOf(audioParam);
		if(idx != -1) this.controlledParams.splice(idx, 1);
    },
});

function createMenuItemForComponentType(nodeType) {
    var li = $('<li>').html("<a href=\"#\">" + nodeType + "</a>")
    li[0].audioNodeType = nodeType;
    $('#createmenu').append(li);
}

function showMenu(event) {
     /*  check whether the event is a right click
       *  because different browser (ahem IE) assign different numbers to the keys to
       *  your mouse buttons and different values to the event, you'll have to do some evaluation
       */
     var rightclick; //will be set to true or false
     if (event.button) {
          rightclick = (event.button == 2);
     } else if (event.button) {
          rightclick = (event.which == 3);
     }

     if(rightclick) { //if the secondary mouse botton was clicked
          var menu = document.getElementById('menu');
          menu.style.display = "block"; //show menu
          
          var x = event.clientX; //get X and Y coordinance for menu position
          var y = event.clientY;

          $('#menu').attr({'x': x, 'y': y});

          //position the menu
          menu.style.position = "fixed"; // use fixed or it will not work when the window is scrolled
          menu.style.top = y + "px";
          menu.style.left= x + "px";
     }
}

function clearMenu() { //used to make the menu disappear
     //this function should be used at the beginning of any function that is called from the menu
     var menu = document.getElementById('menu');
     menu.style.display = "none"; //don't show menu
}

// this runs when document is ready
$(function() {
    // chrome fix.
    document.onselectstart = function() {
        return false;
    };

    // explanation div is draggable
    $("#explanation,.renderMode").draggable();
    jsPlumb.setRenderMode(jsPlumb.SVG);

    // keep it global just in case we want to reuse it
    synth = new WebkitSynth();
    synth.start();

    function attach_tooltip(event) {
        var element = $(event.currentTarget);
        if (element.data('tooltip')) {
            // don't want to reattach these all the time, woah nelly
            return false;
        }
        var tooltip = element.tooltip({
            events : {
                def : ",",
                tooltip : "click, mouseleave"
            },
            position : "bottom center",
            offset : [ -310, 0 ]
        });
        tooltip.click(function() {
            var tip = $(this).data("tooltip");
			if(tip) // seems to be necessary to prevent errors, not sure why
			{
				if (tip.isShown(true))
					tip.hide();
				else
					tip.show();
			}
        });

        if (tooltip.hasClass('Oscillator')) {

        } else if (tooltip.hasClass('BiquadFilterNode')) {
            tooltip.children("input[name=range]").change(
                    function() {
                        $this = $(this);
                        tooltip.children("span").html(
                                $this.attr('value'));
                    })
        }

    }

    // dynamically associate tooltips to windows
    $("#demo").on("hover", ".window.tooltipped", attach_tooltip);

});
