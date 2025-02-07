declare module 'load-bmfont' {
    type Callback = (err: Error | null, font: any) => void;
  
    function loadFont(path: string, callback: Callback): void;
  
    export = loadFont;
  }