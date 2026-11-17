import { constants } from '../../../util/constants';
import { BaseSpeechProvider } from './BaseSpeechProvider';
import { Voice } from '../Voice.js';
import { log } from '../../../util/log.js';

const RESPONSIVE_VOICE_LIST = [
    ['UK English Female', 'en-GB'],
    ['UK English Male', 'en-GB'],
    ['US English Female', 'en-US'],
    ['US English Male', 'en-US'],
    ['Arabic Male', 'ar-SA'],
    ['Arabic Female', 'ar-SA'],
    ['Armenian Male', 'hy-AM'],
    ['Australian Female', 'en-AU'],
    ['Australian Male', 'en-AU'],
    ['Bangla Bangladesh Female', 'bn-BD'],
    ['Bangla Bangladesh Male', 'bn-BD'],
    ['Bangla India Female', 'bn-IN'],
    ['Bangla India Male', 'bn-IN'],
    ['Brazilian Portuguese Female', 'pt-BR'],
    ['Chinese Female', 'zh-CN'],
    ['Chinese Male', 'zh-CN'],
    ['Chinese (Hong Kong) Female', 'zh-HK'],
    ['Chinese (Hong Kong) Male', 'zh-HK'],
    ['Chinese Taiwan Female', 'zh-TW'],
    ['Chinese Taiwan Male', 'zh-TW'],
    ['Czech Female', 'cs-CZ'],
    ['Danish Female', 'da-DK'],
    ['Deutsch Female', 'de-DE'],
    ['Deutsch Male', 'de-DE'],
    ['Dutch Female', 'nl-NL'],
    ['Dutch Male', 'nl-NL'],
    ['Estonian Male', 'et-EE'],
    ['Filipino Female', 'fil-PH'],
    ['Finnish Female', 'fi-FI'],
    ['French Female', 'fr-FR'],
    ['French Male', 'fr-FR'],
    ['French Canadian Female', 'fr-CA'],
    ['French Canadian Male', 'fr-CA'],
    ['Greek Female', 'el-GR'],
    ['Hindi Female', 'hi-IN'],
    ['Hindi Male', 'hi-IN'],
    ['Hungarian Female', 'hu-HU'],
    ['Indonesian Female', 'id-ID'],
    ['Indonesian Male', 'id-ID'],
    ['Italian Female', 'it-IT'],
    ['Italian Male', 'it-IT'],
    ['Japanese Female', 'ja-JP'],
    ['Japanese Male', 'ja-JP'],
    ['Korean Female', 'ko-KR'],
    ['Korean Male', 'ko-KR'],
    ['Latin Male', 'la'],
    ['Nepali', 'ne-NP'],
    ['Norwegian Female', 'nb-NO'],
    ['Norwegian Male', 'nb-NO'],
    ['Polish Female', 'pl-PL'],
    ['Polish Male', 'pl-PL'],
    ['Portuguese Female', 'pt-BR'],
    ['Portuguese Male', 'pt-BR'],
    ['Romanian Female', 'ro-RO'],
    ['Russian Female', 'ru-RU'],
    ['Sinhala', 'si-LK'],
    ['Slovak Female', 'sk-SK'],
    ['Spanish Female', 'es-ES'],
    ['Spanish Latin American Female', 'es-MX'],
    ['Spanish Latin American Male', 'es-MX'],
    ['Swedish Female', 'sv-SE'],
    ['Swedish Male', 'sv-SE'],
    ['Tamil Female', 'hi-IN'],
    ['Tamil Male', 'hi-IN'],
    ['Thai Female', 'th-TH'],
    ['Thai Male', 'th-TH'],
    ['Turkish Female', 'tr-TR'],
    ['Turkish Male', 'tr-TR'],
    ['Ukrainian Female', 'uk-UA'],
    ['Vietnamese Female', 'vi-VN'],
    ['Vietnamese Male', 'vi-VN'],
    ['Afrikaans Male', 'af-ZA'],
    ['Albanian Male', 'sq-AL'],
    ['Bosnian Male', 'bs'],
    ['Catalan Male', 'ca-ES'],
    ['Croatian Male', 'hr-HR'],
    ['Esperanto Male', 'eo'],
    ['Icelandic Male', 'is-IS'],
    ['Latvian Male', 'lv-LV'],
    ['Macedonian Male', 'mk-MK'],
    ['Moldavian Female', 'md'],
    ['Montenegrin Male', 'me'],
    ['Serbian Male', 'sr-RS'],
    ['Serbo-Croatian Male', 'hr-HR'],
    ['Swahili Male', 'sw-KE'],
    ['Welsh Male', 'cy'],
    ['Fallback UK Female', 'en-GB']
];

class SpeechProviderResponsiveVoice extends BaseSpeechProvider {
    constructor() {
        super();
        this._startedSpeaking = false;
    }

    init() {}

    async speak(text, voice, options = {}) {
        let responsiveVoice = this._getResponsiveVoice();
        log.warn("speak", text, voice, responsiveVoice);
        if (!responsiveVoice || typeof responsiveVoice.speak !== 'function') {
            return;
        }
        responsiveVoice.speak(text, voice.name, {
            pitch: options.pitch ?? 1,
            rate: options.rate ?? 1
        });
        this._startedSpeaking = true;
    }

    async stop() {
        this._startedSpeaking = false;
        let responsiveVoice = this._getResponsiveVoice();
        if (responsiveVoice && typeof responsiveVoice.cancel === 'function') {
            responsiveVoice.cancel();
        }
    }

    async isSpeaking() {
        let responsiveVoice = this._getResponsiveVoice();
        return !!(
            this._startedSpeaking &&
            responsiveVoice &&
            typeof responsiveVoice.isPlaying === 'function' &&
            responsiveVoice.isPlaying()
        );
    }

    async getVoicesInternal() {
        return RESPONSIVE_VOICE_LIST.map(([name, lang]) => new Voice({
            id: name,
            name,
            lang,
            type: constants.VOICE_TYPE_RESPONSIVEVOICE,
            local: false
        }));
    }

    async validateSetup() {
        let responsiveVoice = this._getResponsiveVoice();
        return !!(
            responsiveVoice &&
            typeof responsiveVoice.speak === 'function' &&
            typeof responsiveVoice.cancel === 'function' &&
            typeof responsiveVoice.isPlaying === 'function'
        );
    }

    _getResponsiveVoice() {
        return typeof window !== 'undefined' ? window.responsiveVoice : null;
    }
}

export { SpeechProviderResponsiveVoice };
