# ring-visualizer
![ring visualizer screenshot](https://github.com/dyazdan/ring-visualizer/blob/main/assets/screenshot.png)
>A ring shaped audio visualizer that uses and demos the ease of Web Audio API's analyzer node to generate its visuals.

I needed some kind of visual feedback for audio playback on a website in another project, so I created a small audio loop, fired up a browser-default player and started to fiddle around with the [Web Audio API](https://webaudio.github.io/web-audio-api/#audionode). As I found it to be pretty convenient to get something fancy looking up and running quite fast, I thought I'd drop it as a demo here.

## Usage
Pretty straightforward, too see it in action:
* Download, unzip, open in Chrome (other Chromium based browsers might work, too)

After that, you can pretty much copy the bits and pieces from the provided `index.html`:
* Have an `<audio>` element present with `id='player'`
* Have a `<div>` with `id='visualizer'` present (will be replaced)
* Drop the script right at the end of your `<body>`-section with: `<script src="visualizer.js" type="application/javascript"></script>`

That's about it. Should work on `<video>` elements, too. There's also a way to hook other players up (e.g. _video.js), by grabbing their child-`video`-element and passing it to the visualizer.
_Grab some bits from the code and remix it!_

## Caveats
Some minor things I noticed:
* Browsers are picky about video and audio autoplay. If you try to use this visualizer e.g. on a `<video>` element, you might get yourself into the situation having to manually resume the audio context. In that case, resume the audio context _before_ calling the visualizer's `initialize()` method (just kick it out of the _.js_ and call it manually).
* I ran into some trouble hooking up more than one analyzer node at the same time. Could be gone by now.

## Browser compatibility
The Web Audio API and the JS language level I targeted make browser compatibility a definitive issue: 
* I just fired this up in _Chrome 87_ and _Firefox 84_ and it worked, which was good enough for me
* I initially had the visualizer wrapped in a class making use of private fields, which I found to be cleaner, but removed it for Firefox compatibility
* Safari seems to silently ignore either the analyzers output, or has trouble connecting the input to the player element. Either way, it just draws a static ring.

## Miscellanous
If you like what I did, feel free to give me some credit, leave me a star at my [GitHub repo](https://github.com/dyazdan/ring-visualizer), visit my [homepage](https://dyaz.de) or hit me up on social media!
