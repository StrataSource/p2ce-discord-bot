// We have to do this because canvasGif is super broken and there are no
// good alternatives besides the ones that would waste way more of my time!
// Seriously, everything in here is necessary to get it to compile

declare module 'gif-encoder-2';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GIFEncoder {}
