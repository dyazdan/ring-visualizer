console.debug('visualizer script loaded');

class Visualizer {

    #size = 150;                    // The shortest side of the visualization canvas in px, defaults to 150
    #color = 'rgb(0, 191, 255)';    // The visualization color in rgb(), defaults to a nice blue

    #isReady = false;       // True after successful initialization
    #isVisualizing = false; // True if the visualizer is currently animating

    #mediaElement;  // The audio/video DOM element the audio context relates to, identified by 'player'
    #audioContext;  // The audio context
    #audioSource;   // The audio source created from the media element

    #analyser;                  // The audio analyser node
    #analyserTimeDomainData;    // The array holding the analyser time domain data (typically ~127 when idle)
    #analyserFrequencyData;     // The array holding the analyser frequency data (in the 0-255 range)

    #canvas;        // The HTML canvas element the visualizer draws on
    #canvasContext; // The canvas' 2D context
    #domElement;    // The DOM element that is replaced by the visualizer, identified by 'visualizer'

    // Fire me up!
    constructor() {
        console.debug(`visualizer constructed`);
    }

    // Initializes the visualizer
    init() {

        // Locate the HTML element representing an audio source (i.e. player)
        this.#mediaElement = document.getElementById('player');
        if (!this.#mediaElement) throw 'media element not found';

        // Get the audio context
        this.#audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.#audioSource = this.#audioContext.createMediaElementSource(this.#mediaElement);
        if (!(this.#audioSource && this.#audioContext)) throw `couldn't set up audio source or context`;

        // Create and configure the analyzer
        this.#analyser = this.#audioContext.createAnalyser();
        this.#analyser.fftSize = 64;
        this.#analyser.minDecibels = -128;
        this.#analyser.maxDecibels = 0;
        this.#analyser.smoothingTimeConstant = 0.5;
        this.#analyser.connect(this.#audioContext.destination);
        this.#audioSource.connect(this.#analyser);
        this.#analyserTimeDomainData = new Uint8Array(this.#analyser.fftSize);
        this.#analyserFrequencyData = new Uint8Array(this.#analyser.frequencyBinCount);
        if (!(this.#analyser && this.#audioSource && this.#analyserFrequencyData && this.#analyserTimeDomainData)) {
            throw `couldn't set up analyzer`;
        }

        // Create the canvas
        this.#canvas = document.createElement('canvas');
        this.#canvas.id = 'visualizer-canvas';
        this.#canvas.width = this.#canvas.height = this.#size;
        this.#canvasContext = this.#canvas.getContext("2d");
        if (!(this.#canvas && this.#canvasContext)) {
            throw `couldn't set up canvas or canvas context`;
        }

        // Find the HTML DOM element to replace by the visualizer
        this.#domElement = document.getElementById('visualizer');
        if (!this.#domElement) {
            throw `couldn't set up DOM element`;
        }

        // Create the <div> container holding the canvas
        const container = document.createElement('div');
        container.append(this.#canvas);
        this.#domElement.replaceWith(container);
        container.id = 'visualizer';

        // Sneak into the computed CSS-styles; This is necessary to correctly size the canvas render area
        let domElementStyle = getComputedStyle(this.#canvas);
        const width = domElementStyle.getPropertyValue('width').replace('px', '');
        const height = domElementStyle.getPropertyValue('height').replace('px', '');
        const color = domElementStyle.getPropertyValue('color');
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#size = width > height ? height : width;
        this.#color = color;
        console.debug(`visualizer canvas derived ${this.#canvas.width}x${this.#canvas.height} from styles`);

        // If we're all done and nothing threw an error, let's go!
        this.#isReady = true;
        console.debug(`visualizer initialized:`);
        console.debug(this);
    }

    // Starts the visualization and animation loop
    start() {
        if (this.#isReady === true) {
            this.#isVisualizing = true;
            this.animate();
            console.debug(`visualizer started`);
        } else {
            console.error('visualizer not ready');
        }
    }

    // Stops the visualization
    stop() {
        if (this.#isVisualizing === true) {
            this.#isVisualizing = false;
            console.debug(`visualizer stopped`);
        } else {
            console.warn(`visualizer wasn't started, couldn't stop`);
        }
    }

    // The main animation method containing the animation loop
    animate() {
        console.debug('visualizer starting animation');
        const visualizer = this;
        const analyzer = visualizer.#analyser;
        const analyserTimeDomainData = visualizer.#analyserTimeDomainData;
        const analyserFrequencyData = visualizer.#analyserFrequencyData;
        const canvas = visualizer.#canvas;
        const canvasContext = visualizer.#canvasContext;

        // Realising the animation loop by defining a frame-drawing method, recursively requesting animation frames
        let frame = function () {

            // Not necessarily cool for performance, but fancy: Grab the current style info from the DOM
            let domElementStyle = getComputedStyle(visualizer.#canvas);
            visualizer.#color = domElementStyle.getPropertyValue('color');
            canvas.width = domElementStyle.getPropertyValue('width').replace('px', '');
            canvas.height = domElementStyle.getPropertyValue('height').replace('px', '');

            // Check whether the visualization should be running
            if (visualizer.#isVisualizing === true) {

                // Request the next animation frame
                requestAnimationFrame(frame);

                // Get the time domain and frequency data from the analyzer
                analyzer.getByteTimeDomainData(analyserTimeDomainData);
                analyzer.getByteFrequencyData(analyserFrequencyData);

                // Flush the canvas contents
                canvasContext.clearRect(0, 0, canvas.width, canvas.height);

                // The maximum radius the volume rings should have
                const maxRadius = (canvas.height / 2);

                // The volume controlled outer ring loop
                for (let i = 0; i < analyserTimeDomainData.length; i++) {
                    let radius = analyserTimeDomainData[i] * (maxRadius / 255);

                    // Calculate the opacity
                    let opacity = (1 / 255) * Math.abs(analyserTimeDomainData[i] - 127) * 2;

                    // Draw the current ring
                    canvasContext.beginPath();
                    canvasContext.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
                    canvasContext.strokeStyle = `${visualizer.#color.replace('rgb', 'rgba').replace(')', ','+ opacity + ')')}`;
                    canvasContext.stroke();
                }

                // Calculate the radian length of each visualizer segment
                let fftArcLength = (2 * Math.PI) / analyserFrequencyData.length;
                let radius = analyserTimeDomainData[0] * (maxRadius / 255);

                // The spectrum inner ring loop
                for (let i = 0; i < analyserFrequencyData.length; i++) {

                    // Grab the frequency domain data from the analyzer data array
                    let v = analyserFrequencyData[i];

                    // Set the starting point/center of the visualizer to 6 o' clock
                    let fftArcCenter = Math.PI * 0.5;

                    // Calculate the start- and end radians for the current data segment
                    let fftArcStart = fftArcCenter + fftArcLength * i / 2;
                    let fftArcEnd = fftArcCenter + fftArcLength * (i + 1) / 2;

                    // Set the line color and calculated opacity
                    canvasContext.strokeStyle = `${visualizer.#color.replace('rgb', 'rgba').replace(')', ', '+ (v / 128).toFixed(2) + ')')}`;

                    // Calculate the radius and line width to size the visualizer segments and make them bounce
                    let fftBoost = (v / 128) * radius * 0.25 // Substitute with 'Math.log2(v) * 2' for a less hectic look
                    let fftRadius = radius - fftBoost;
                    canvasContext.lineWidth = fftBoost * 2;

                    // Draw the clockwise arc segment
                    canvasContext.beginPath();
                    canvasContext.arc(canvas.width / 2, canvas.height / 2, fftRadius, fftArcStart, fftArcEnd, false);
                    canvasContext.stroke();

                    // Draw the counter-clockwise arc segment
                    canvasContext.beginPath();
                    canvasContext.arc(canvas.width / 2, canvas.height / 2, fftRadius, Math.PI - fftArcStart, Math.PI - fftArcEnd, true);
                    canvasContext.stroke();
                }

            } else {
                console.debug('visualizer performed last animation frame');
            }
        }
        frame();
    }

}

// Create a new visualizer instance
let visualizer = new Visualizer();

// Calls the init method from within this file
// Can be removed and called from outside (e.g. after restarting the audio context)
try {
    visualizer.init();
} catch (e) {
    console.error('visualizer init: ' + e);
}
