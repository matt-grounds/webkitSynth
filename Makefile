JS_LIBS = dependencies/jquery-1.8.2.min.js \
          dependencies/jquery.json-2.3.min.js \
		  dependencies/jquery-ui-1.9.0.custom.min.js \
		  dependencies/jquery.jsPlumb-1.3.16-all-min.js \
		  dependencies/knobRot-0.2.2.min.js

JS_SRC = src/js/board/synthboard.js \
         src/js/board/audiocomponentview.js \
         src/js/board/configview.js \
		 src/js/nodes/adsr.js \
		 src/js/nodes/biquadFilter.js \
		 src/js/nodes/compressor.js \
		 src/js/nodes/delay.js \
		 src/js/nodes/display.js \
		 src/js/nodes/gain.js \
		 src/js/nodes/oscillator.js \
		 src/js/nodes/piano.js \
		 src/js/nodes/stereoOutput.js \

CSS_SRC = src/css/jquery-ui-1.9.0.custom.css \
          src/css/jsPlumbDemo.css \
		  src/css/knobRot.css \
		  src/css/webkitSynth.css

all:
	mkdir -p build
	cp -r src/images build/
	cat $(JS_LIBS) > build/synthlibs.js
	cat $(JS_SRC) > build/synth.js
	cat $(CSS_SRC) > build/synth.css
	cp src/synth.html build/

minified:
	mkdir -p build
	cp -r src/images build/
	cat $(JS_LIBS) > build/synthlibs.js
	cat $(JS_SRC) \
	    | java -jar '$(YUIDIR)/yuicompressor-2.4.8pre.jar' --type js --nomunge --preserve-semi --disable-optimizations \
		> build/synth.js
	cat $(CSS_SRC) | java -jar '$(YUIDIR)/yuicompressor-2.4.8pre.jar' --type css > build/synth.css
	cp src/synth.html build/

clean:
	rm -rf build/images
	rm -f build/*.html
	rm -f build/*.js
	rm -f build/*.css
