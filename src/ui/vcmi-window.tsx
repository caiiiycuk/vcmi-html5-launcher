import { useEffect, useRef } from "preact/hooks";
import { VCMI_DATA, VCMI_MODULE } from "../util/store";

export function VCMIWindow() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const parent = canvas.parentElement!;
            const onResize = () => {
                const bounds = parent.getBoundingClientRect();
                const { width, height } = getSizeWithAspectRatio(bounds.width, bounds.height, canvas.width / canvas.height);
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
            
            VCMI_MODULE.FS.createPath("/", "Data")
            for (const next of Object.keys(VCMI_DATA)) {
                if (VCMI_DATA[next] !== null) {
                    VCMI_MODULE.FS.createDataFile("/Data/" + next, null, VCMI_DATA[next], true, true, true);
                }
            }

            VCMI_MODULE.run();
            VCMI_MODULE.callMain();
            return () => {
                observer.unobserve(parent);
            }
        }
    }, [canvasRef]);
    return <div class="w-full h-full relative">
        <canvas id="canvas" ref={canvasRef} />
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