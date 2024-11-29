import { useDispatch, useSelector } from "react-redux";
import { defaultConfig, getScreenResolution, State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";

const resolutions = [
    [0, 0], [800, 600], [1024, 768], [1280, 720], [1280, 1024], [1440, 900],
];
const widhtRegex = new RegExp("\"width\"\\s*:\\s*(\\d+)");
const heightRegex = new RegExp("\"height\"\\s*:\\s*(\\d+)");

export function VCMIConfig() {
    const dispatch = useDispatch();
    const t = useT();
    const config = useSelector((state: State) => state.ui.config);
    const [index, setIndex] = useState<number>();

    useEffect(() => {
        const wMatch = config.match(widhtRegex);
        const hMatch = config.match(heightRegex);

        if (wMatch && hMatch) {
            const w = Number.parseInt(wMatch[1]);
            const h = Number.parseInt(hMatch[1]);
            const index = resolutions.findIndex((r) => r[0] === w && r[1] === h);
            if (index !== -1) {
                setIndex(index);
                return;
            }
        }

        dispatch(uiSlice.actions.setConfig(updateConfigResolution(config, 0)));
    }, []);

    return <div class="flex flex-col gap-2">
        <div class="field-row-stacked">
            <label for="resolution">{t("resolution")}</label>
            <select id="resolution" onChange={(e) => {
                const index = Number.parseInt(e.currentTarget.value);
                if (index >= 0 && index < resolutions.length) {
                    setIndex(index);
                    dispatch(uiSlice.actions.setConfig(updateConfigResolution(config, index)));
                }
            }}>
                {resolutions.map(([w, h], i) => {
                    const [screenWidth, screenHeight] = getScreenResolution();
                    const text = i === 0 ? t("fit_screen") + " — " + screenWidth + "x" + screenHeight :
                        w + "x" + h;
                    return <option value={i} selected={index === i} >{text}</option>;
                })}
            </select>
        </div>
        <div class="field-row-stacked w-full">
            <label for="config-text">{t("config")}</label>
            <textarea id="config-text" rows={8} value={config}
                onChange={(e) => dispatch(uiSlice.actions.setConfig(e.currentTarget.value))}></textarea>
        </div>

        <div class="flex flex-row justify-between">
            <button onClick={() => {
                setIndex(0);
                dispatch(uiSlice.actions.setConfig(defaultConfig()));
            }}>{t("reset")}</button>

            <button onClick={() => {
                dispatch(uiSlice.actions.step("STARTED"));
            }}>{t("start_the_game")}</button>
        </div>
    </div>;
}


function updateConfigResolution(config: string, index: number) {
    const [w, h] = index === 0 ? [innerWidth, innerHeight] : resolutions[index];
    return config
        .replace(widhtRegex, "\"width\": " + w)
        .replace(heightRegex, "\"height\": " + h);
}
