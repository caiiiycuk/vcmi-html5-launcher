import { useEffect, useRef } from "preact/hooks";
import { VCMI_MODULE } from "../util/store";

const gameWidth = 800;
const gameHeight = 600;

export function VCMIWindow() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const parent = canvas.parentElement!;
            const onResize = () => {
                const bounds = parent.getBoundingClientRect();
                const { width, height } = getSizeWithAspectRatio(bounds.width, bounds.height, gameWidth / gameHeight);
                canvas.style.position = "absolute";
                canvas.style.top = (bounds.height / 2 - height / 2) + "px";
                canvas.style.left = (bounds.width / 2 - width / 2) + "px";
                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
            }
            onResize();
            const observer = new ResizeObserver(onResize);
            observer.observe(parent);

            VCMI_MODULE.canvas = canvas;
            // VCMI_MODULE.preinitializedWebGLContext = VCMI_MODULE.canvas.getContext("webgl");
            VCMI_MODULE.run();
            VCMI_MODULE.callMain();
            return () => {
                observer.unobserve(parent);
            }
        }
    }, [canvasRef]);
    return <div class="w-full h-full relative">
        <canvas id="canvas" ref={canvasRef} width={gameWidth} height={gameHeight} />
    </div>;
}

function getSizeWithAspectRatio(width: number, height: number, targetAspect: number):
    { width: number, height: number} {
    const screenAspect = width / height;
    if (screenAspect === targetAspect) {
        return { width, height };
    }
    const calculatedWidth = Math.round(height * targetAspect);
    if (calculatedWidth <= width) {
        return { width: calculatedWidth, height };
    }
    const calculatedHeight = Math.round(width / targetAspect);
    return { width, height: calculatedHeight };
}