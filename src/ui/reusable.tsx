import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useT } from "../i18n";
import { clients, State, uiSlice } from "../util/store";

export function ClientSelect() {
    const t = useT();
    const client = useSelector((state: State) => state.ui.client);
    const dispatch = useDispatch();
    const language = useSelector((state: State) => state.ui.lang);

    return <fieldset>
        <legend>{t("client")}</legend>
        <div class="field-row-stacked">
            <label for="client">{t("version")}</label>
            <select id="client" onChange={(e) => {
                dispatch(uiSlice.actions.setClient(e.currentTarget.value));
            }}>
                {clients.map(({ version }) => {
                    return <option value={version} selected={version === client} >{version}</option>;
                })}
            </select>
        </div>
        <div class="field-row-stacked">
            <label for="language">{t("language")}</label>
            <select id="language" onChange={(e) => {
                dispatch(uiSlice.actions.setLang(e.currentTarget.value as "ru" | "en"));
            }}>
                {["ru", "en"].map((lang) => {
                    return <option value={lang} selected={lang === language} >{lang === "ru" ? "Русский" : "English"}</option>;
                })}
            </select>
        </div>
    </fieldset>;
}

export function LanguageSelect() {
    const t = useT();
    const dispatch = useDispatch();

    return <fieldset>
        <legend>{t("language")}</legend>
    </fieldset>;
}
