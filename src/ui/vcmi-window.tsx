import { useEffect, useRef, useState } from "preact/hooks";
import { State } from "../util/store";
import { useSelector } from "react-redux";
import { VCMI_DATA, VCMI_MODULE } from "../util/module";
import { getFilesDB } from "../util/db";
import { parseResolution } from "./vcmi-config";

export function VCMIWindow() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const config = useSelector((state: State) => state.ui.config);
    const [version, setVersion] = useState<string>("");

    let [width, height] = parseResolution(config);
    if (width === null || height === null) {
        width = 800;
        height = 600;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const parent = canvas.parentElement!;
            const onResize = () => {
                const bounds = parent.getBoundingClientRect();
                const { width: cssWidth, height: cssHeight } = getSizeWithAspectRatio(
                    bounds.width, bounds.height, width / height);
                canvas.style.position = "absolute";
                canvas.style.top = (bounds.height / 2 - cssHeight / 2) + "px";
                canvas.style.left = (bounds.width / 2 - cssWidth / 2) + "px";
                canvas.style.width = cssWidth + "px";
                canvas.style.height = cssHeight + "px";
            };
            onResize();
            const observer = new ResizeObserver(onResize);
            observer.observe(parent);

            (async () => {
                VCMI_MODULE.canvas = canvas;
                for (const next of Object.keys(VCMI_DATA)) {
                    if (VCMI_DATA[next] !== null) {
                        VCMI_MODULE.fsWrite("/Data/" + next, VCMI_DATA[next]);
                        VCMI_DATA[next] = null;
                    }
                }

                const files = await getFilesDB();
                await files.forEach((file, value) => {
                    if (file.indexOf("settings.json") >= 0 || file.indexOf("modSettings.json") >= 0) {
                        return;
                    }
                    if (value.length > 0) {
                        VCMI_MODULE.fsWrite(file, value);
                    }
                });

                const encoder = new TextEncoder();
                VCMI_MODULE.fsWrite(
                    "/config/settings.json",
                    encoder.encode(config));

                VCMI_MODULE.fsWrite(
                    "/config/modSettings.json",
                    encoder.encode(modSettings));

                VCMI_MODULE.gameStarted = () => {
                    onResize();
                };

                VCMI_MODULE.run!();
                setVersion(VCMI_MODULE.getVCMIVersion());
                VCMI_MODULE.callMain!();
            })().catch(console.error);

            const preventDefault = (e: Event) => e.preventDefault();
            canvas.addEventListener("contextmenu", preventDefault);

            return () => {
                canvas.removeEventListener("contextmenu", preventDefault);
                observer.unobserve(parent);
            };
        }
    }, [canvasRef]);

    return <div class="w-full h-full relative flex items-center justify-center">
        <canvas id="canvas" class="absolute" ref={canvasRef} width={width} height={height}/>
        <span class="absolute top-4 text-slate-200 text-xs pointer-events-none">{version}</span>
    </div>;
}

function getSizeWithAspectRatio(width: number,
                                height: number, targetAspect: number): { width: number, height: number } {
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

const modSettings = `
{
    "activeMods" : {
        "extras" : {
            "active" : true
        },
        "vcmi" : {
            "active" : true,
            "checksum" : "abf49988",
            "validated" : true
        }
    },
    "core" : {
        "active" : true,
        "checksum" : "55b95539",
        "name" : "Original game files",
        "validated" : true
    }
}
`;
