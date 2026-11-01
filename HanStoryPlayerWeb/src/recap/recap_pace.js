// Cuadros por segundo: si el aparato no llega, se baja antes que dar tirones.
export const FPS_STEPS=Object.freeze([30,24,15]);
export const nextFps=(fps,averageGapMs)=>averageGapMs>1400/fps?FPS_STEPS[FPS_STEPS.indexOf(fps)+1]||fps:fps;
