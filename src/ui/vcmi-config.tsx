import { useDispatch } from "react-redux";
import { uiSlice } from "../util/store";
import { useT } from "../i18n";

export function VCMIConfig() {
    const dispatch = useDispatch();
    const t = useT();

    return <div class="flex flex-col">
        <button class="self-end" onClick={() => {
            dispatch(uiSlice.actions.step("STARTED"));
        }}>{t("start_the_game")}</button>
    </div>;
}
