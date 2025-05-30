import { useDispatch, useSelector } from "react-redux";
import { useT } from "../i18n";
import { State, uiSlice } from "../util/store";

export function Auth() {
    const t = useT();
    const dispatch = useDispatch();
    const token = useSelector((state: State) => state.ui.token);
    const premium = useSelector((state: State) => state.ui.premium);
    const name = useSelector((state: State) => state.ui.name);


    if (name) {
        return <fieldset>
            <legend>{t("auth")}</legend>
            <div class="flex flex-col gap-2">
                <div class="flex flex-row items-baseline">
                    {t("hello")},&nbsp;<b>{name}</b>! (<div class="underline cursor-pointer" onClick={() => {
                        dispatch(uiSlice.actions.setToken(null));
                    }}>{t("exit")}</div>)
                </div>
                <span class="pt-2">{t("cloud_saves")}:</span>
                <div class="flex flex-row items-baseline gap-1">
                    <span class={(premium ? "text-green-500" : "text-red-500") + " font-bold text-lg"}>
                        {premium ? t("available") : t("not_available")}
                    </span>
                    {!premium &&
                        <span>(<a href="https://v8.js-dos.com/key" target="_blank">{t("fix")}</a>)</span>}
                </div>
            </div>
        </fieldset>;
    }

    return <fieldset>
        <legend>{t("auth")}</legend>
        <div class="field-row-stacked">
            <label for="">{t("key")}</label>
            <div class="field-row flex-row gap-2 items-baseline">
                {!name && <>
                    <input type="text" placeholder="-----" value={token ?? ""} onChange={(e) => {
                        dispatch(uiSlice.actions.setToken(e.currentTarget.value));
                    }} />
                    <a href="https://v8.js-dos.com/key" target="_blank">{t("get_key")}</a>
                </>}
            </div>
        </div>
    </fieldset>;
}
