import { useEffect, useRef } from "preact/hooks";
import { VCMI_MODULE } from "../util/store";

export function VCMIWindow() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current !== null) {
            VCMI_MODULE.canvas = canvasRef.current;
            // VCMI_MODULE.preinitializedWebGLContext = VCMI_MODULE.canvas.getContext("webgl");
            VCMI_MODULE.run();
            VCMI_MODULE.callMain();
        }
    }, [canvasRef]);
    return <div class="flex flex-row h-full">
        <canvas id="canvas" ref={canvasRef} width={800} height={600} />
    </div>;
}