import { useSelector } from "react-redux";
import { State } from "./util/store";

const translations: {[lang: string]: {[key: string]: string} } = {
    ru: {
        title: "Герои Меча и Магии III",
        confirm_legal_copy: "У меня есть легальная копия игры",
        legal: "Права",
        legal_text: "Игра онснована на движке с открытым исходныи кодом VCMI[1]. Что бы начать играть необходимо указать URL с данными оригинальной игры HoMM3[2], либо вы можете загрузить их. Вы не можете продолжить если Вы не приобретали оригинальную игру.",
        data_source: "Источник данных",
        data_directory: "Установленная игра",
        data_db: "Ранее загруженные",
        next: "Продолжить",
        back: "Назад",
        loading_data_title: "Загрузка данных...",
        error: "Ошибка",
        open_browser_logs: "Откройте лог браузера для подробной информации...",
        start_the_game: "Start the game",
    },
    en: {
        title: "Heroes Of Might And Magic III",
        confirm_legal_copy: "I confirm I have legal copy of this game.",
        legal: "Legal",
        legal_text: "The game based on opensource engine VCMI[1]. To play the game you need to provide URL to original HoMM3[2] game files, or you can upload them. You can't continue if you do not own the game",
        data_source: "Data source",
        data_directory: "Installed game",
        data_db: "Already uploaded",
        next: "Next",
        back: "Back",
        loading_data_title: "Downloading data...",
        error: "Error",
        open_browser_logs: "Open browser log for more info...",
        start_the_game: "Start the game",
    },
};

export function useT() {
    const lang = useSelector((state: State) => state.ui.lang);
    return (key: string) => {
        return (translations[lang] ?? translations.en)[key] ?? key;
    };
};
