<template>
    <div class="container-fluid px-0">
        <!-- 1. Texto del bocadillo -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="inputLabel">{{ $t('bubbleText') }}</label>
            <div class="col-sm-10 col-12">
                <textarea rows="2" class="col-12 form-control" id="inputLabel" v-focus v-if="gridElement"
                          v-model="gridElement.label[currentLang]"
                          @input="onTextChange"
                          :placeholder="$t('enterBubbleTextPlaceholder')"></textarea>
            </div>
        </div>

        <!-- 2. Tipo de bocadillo -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="bubbleTypeSelect">{{ $t('bubbleType') }}</label>
            <div class="col-sm-10 col-12">
                <select class="col-12 form-control" id="bubbleTypeSelect" v-model="bubbleProps.bubbleType" @change="onBubbleTypeChange">
                    <option value="speech">💬 {{ $t('bubbleSpeech') }}</option>
                    <option value="thought">💭 {{ $t('bubbleThought') }}</option>
                    <option value="shout">💥 {{ $t('bubbleShout') }}</option>
                    <option value="whisper">🤫 {{ $t('bubbleWhisper') }}</option>
                    <option value="box">📜 {{ $t('bubbleBox') }}</option>
                </select>
            </div>
        </div>

        <!-- 3. Posición del rabillo -->
        <div class="row mb-2" v-if="bubbleProps.bubbleType !== 'box'">
            <label class="col-sm-2 col-12 fw-bold" for="tailPositionSelect">{{ $t('bubbleTail') }}</label>
            <div class="col-sm-10 col-12">
                <select class="col-12 form-control" id="tailPositionSelect" v-model="bubbleProps.tailPosition" @change="resetTestGrid">
                    <option value="bottom-left">↙ {{ $t('tailBottomLeft') }}</option>
                    <option value="bottom-center">↓ {{ $t('tailBottomCenter') }}</option>
                    <option value="bottom-right">↘ {{ $t('tailBottomRight') }}</option>
                    <option value="top-left">↖ {{ $t('tailTopLeft') }}</option>
                    <option value="top-right">↗ {{ $t('tailTopRight') }}</option>
                    <option value="left">← {{ $t('tailLeft') }}</option>
                    <option value="right">→ {{ $t('tailRight') }}</option>
                    <option value="none">⚪ {{ $t('tailNone') }}</option>
                </select>
            </div>
        </div>

        <!-- 4. Pronunciación -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="inputPronunciation">{{ $t('pronunciation') }}</label>
            <div class="col-sm-10 col-12" style="position: relative">
                <input type="text" class="col-12 form-control" id="inputPronunciation" v-if="gridElement"
                       v-model="gridElement.pronunciation[currentLang]"
                       :placeholder="getPronunciationPlaceholder(currentLang)"/>
                <button type="button" @click="speak(currentLang)" class="input-button" :title="$t('testPronunciation')">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-12 d-flex align-items-center gap-2">
                <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden" @change="resetTestGrid"/>
                <label for="inputHidden" class="mb-0 cursor-pointer">{{ $t('hideElement') }}</label>
            </div>
        </div>

        <!-- 5. OPCIONES AVANZADAS: TIPOGRAFÍA, GROSOR, CAJETÍN DE COLORES Y VISTA PREVIA -->
        <div class="srow">
            <accordion :acc-label="$t('advancedOptions')">
                <div class="row mb-2">
                    <label class="col-sm-3 col-12" for="fontFamilySelect">{{ $t('fontFamily') }}</label>
                    <div class="col-sm-9 col-12">
                        <select class="col-12 form-control" id="fontFamilySelect" v-model="bubbleProps.fontFamily" @change="resetTestGrid">
                            <option value='"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif'>{{ $t('fontComic') }}</option>
                            <option value='"Arial", "Helvetica", sans-serif'>{{ $t('fontArial') }}</option>
                            <option value='"Impact", "Arial Black", sans-serif'>{{ $t('fontImpact') }}</option>
                            <option value='"Caveat", "Comic Neue", cursive'>{{ $t('fontCaveat') }}</option>
                            <option value='"Courier New", monospace'>{{ $t('fontCourier') }}</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="col-sm-3 col-12">{{ $t('textAlignment') }}</label>
                    <div class="col-sm-9 col-12">
                        <select class="col-12 form-control" v-model="bubbleProps.textAlign" @change="resetTestGrid">
                            <option value="left">{{ $t('alignLeft') }}</option>
                            <option value="center">{{ $t('alignCenter') }}</option>
                            <option value="right">{{ $t('alignRight') }}</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="col-sm-3 col-12">{{ $t('textFormat') }}</label>
                    <div class="col-sm-9 col-12 d-flex align-items-center gap-4 flex-wrap">
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkBold" :checked="bubbleProps.fontWeight === 'bold'" @change="toggleBold"/>
                            <label for="chkBold" class="mb-0 cursor-pointer"><strong>{{ $t('bold') }}</strong></label>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkItalic" :checked="bubbleProps.fontStyle === 'italic'" @change="toggleItalic"/>
                            <label for="chkItalic" class="mb-0 cursor-pointer"><em>{{ $t('italic') }}</em></label>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkShadow" v-model="bubbleProps.comicShadow" @change="resetTestGrid"/>
                            <label for="chkShadow" class="mb-0 cursor-pointer">{{ $t('comicShadow') }}</label>
                        </div>
                    </div>
                </div>

                <slider-input label="fontSize" unit="%" id="fontSize" :show-clear-button="true" min="40" max="250" step="5" v-model.number="gridElement.fontSizePct" @input="onFontSizeChange"/>
                <slider-input label="bubbleLineWidth" unit="px" id="lineWidth" :show-clear-button="true" min="1" max="12" step="1" v-model.number="bubbleProps.borderWidth" @input="resetTestGrid"/>

                <!-- CAJETÍN DE COLORES DEL BOCADILLO (JUSTO DESPUÉS DE GROSOR DE LÍNEA) -->
                <div class="color-section-container p-3 my-3 rounded border bg-light">
                    <!-- 1. Color del trazo del bocadillo -->
                    <color-palette-picker
                        id="bubbleLineColor"
                        label="bubbleLineColor"
                        v-model="bubbleProps.borderColor"
                        default-color="#111111"
                        @input="resetTestGrid"
                        @change="resetTestGrid" />

                    <!-- 2. Color de relleno del bocadillo -->
                    <color-palette-picker
                        id="bubbleFillColor"
                        label="bubbleFillColor"
                        v-model="bubbleProps.fillColor"
                        default-color="#ffffff"
                        @input="resetTestGrid"
                        @change="resetTestGrid" />

                    <!-- 3. Color del texto -->
                    <color-palette-picker
                        id="fontColor"
                        label="fontColor"
                        v-model="bubbleProps.fontColor"
                        default-color="#111111"
                        @input="onFontColorChange"
                        @change="onFontColorChange" />

                    <!-- 4. Color de fondo de celda -->
                    <color-palette-picker
                        id="cellBgColor"
                        label="cellBackgroundColor"
                        v-model="bubbleProps.cellBgColor"
                        default-color="transparent"
                        :allow-transparent="true"
                        @input="onCellBgColorChange"
                        @change="onCellBgColorChange" />

                    <!-- Botones de guardar colores y aplicar a todos los bocadillos -->
                    <div class="row mt-3 g-2">
                        <div class="col-12 col-md-6">
                            <button type="button"
                                    class="btn-save-bubble-colors w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                                    @click="saveBubbleColors">
                                <i :class="['fas', saveSuccess ? 'fa-check' : 'fa-save']"></i>
                                <span>{{ saveSuccess ? $t('colorsSavedSuccess') : $t('saveBubbleColors') }}</span>
                            </button>
                        </div>
                        <div class="col-12 col-md-6">
                            <button type="button"
                                    class="btn-apply-all-colors w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                                    @click="openApplyAllConfirm">
                                <i :class="['fas', applyAllSuccess ? 'fa-check' : 'fa-layer-group']"></i>
                                <span>{{ applyAllSuccess ? $t('colorsAppliedToAllSuccess') : $t('applyColorsToAllInBoard') }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Diálogo de confirmación personalizado para aplicar a todos de este tipo -->
                    <div v-if="showConfirmApplyAll" class="custom-confirm-backdrop">
                        <div class="custom-confirm-card p-4">
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <div class="confirm-icon-bubble">
                                    <i class="fas fa-palette"></i>
                                </div>
                                <div>
                                    <h4 class="mb-1 text-dark fw-bold">{{ $t('applyColorsToAllTitle') }}</h4>
                                    <div class="text-muted small">{{ getCurrentBubbleTypeName() }}</div>
                                </div>
                            </div>

                            <div class="confirm-body-text mb-4">
                                {{ $t('applyColorsToAllBody') }} (<strong>"{{ getCurrentBubbleTypeName() }}"</strong>)
                                <br><br>
                                <strong>{{ $t('doYouWishToContinue') }}</strong>
                            </div>

                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-secondary px-3" @click="showConfirmApplyAll = false">
                                    <i class="fas fa-times me-1"></i> {{ $t('cancel') }}
                                </button>
                                <button type="button" class="btn btn-primary px-3" @click="confirmAndApplyToAll">
                                    <i class="fas fa-check me-1"></i> {{ $t('applyToAll') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="srow mt-3">
                    <input type="checkbox" id="inputAddToCollect" v-if="gridElement" v-model="gridElement.addToCollect" @change="onAddToCollectChange"/>
                    <label for="inputAddToCollect" class="ms-1">{{ $t('addElementToCollectElement') }}</label>
                </div>

                <!-- Vista previa en tiempo real -->
                <div class="srow mt-4 mb-2 text-center">
                    <label><strong>{{ $t('preview') }}</strong></label>
                </div>
                <app-grid-display class="testGrid" v-if="metadata && testGridData" :key="testGridData.id" style="max-width: 240px; height: 160px; margin: 0 auto; border: 1px dashed #ccc; border-radius: 6px;" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
            </accordion>
        </div>

        <!-- 6. TRADUCCIONES -->
        <div class="srow">
            <accordion :acc-label="$t('Translations')">
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translationLanguage">{{ $t('language') }}</label>
                    <div class="col-sm-5 col-6">
                        <select class="col-12 form-control" id="translationLanguage" v-model="chosenLocale">
                            <option v-for="lang in selectLanguages" :value="lang.code" :key="lang.code">
                                {{ lang | extractTranslationAppLang }} ({{ lang.code }})
                            </option>
                        </select>
                    </div>
                    <div class="col-sm-5 col-6 checkbox-container">
                        <input type="checkbox" id="selectAllLanguages" v-model="selectAllLanguages"/>
                        <label for="selectAllLanguages" class="checkbox-label-small">{{ $t('showAllLanguages') }}</label>
                    </div>
                </div>
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translatedLabel">{{ $t('bubbleText') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10 col-12">
                        <textarea rows="2" class="col-12 form-control" id="translatedLabel" v-model="gridElement.label[chosenLocale]" :placeholder="getLabelPlaceholder(chosenLocale)" @input="resetTestGrid"></textarea>
                    </div>
                </div>
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translatedPronunciation">{{ $t('pronunciation') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10 col-12" style="position: relative">
                        <input type="text" class="col-12 form-control" id="translatedPronunciation" v-model="gridElement.pronunciation[chosenLocale]" :placeholder="getPronunciationPlaceholder(chosenLocale)"/>
                        <button type="button" @click="speak(chosenLocale)" class="input-button" :title="$t('testPronunciation')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </accordion>
        </div>
    </div>
</template>

<script>
import { i18nService } from '../../js/service/i18nService';
import { speechService } from '../../js/service/speechService';
import { dataService } from '../../js/service/data/dataService';
import { localStorageService } from '../../js/service/data/localStorageService';
import { GridData } from '../../js/model/GridData';
import { GridElement } from '../../js/model/GridElement';
import Accordion from '../components/accordion.vue';
import SliderInput from './input/sliderInput.vue';
import ColorPalettePicker from './input/colorPalettePicker.vue';
import AppGridDisplay from '../grid-display/appGridDisplay.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    name: 'EditElementComicBubble',
    components: { Accordion, SliderInput, ColorPalettePicker, AppGridDisplay },
    props: ['gridElement', 'gridData'],
    data() {
        return {
            metadata: null,
            currentLang: i18nService.getContentLang(),
            chosenLocale: 'en',
            selectAllLanguages: false,
            allLanguages: i18nService.getAllLanguages(),
            gridLanguages: [],
            testGridData: null,
            saveSuccess: false,
            showConfirmApplyAll: false,
            applyAllSuccess: false
        };
    },
    computed: {
        bubbleProps() {
            if (!this.gridElement.additionalProps) {
                this.$set(this.gridElement, 'additionalProps', {});
            }
            if (!this.gridElement.additionalProps.comicBubble) {
                let saved = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS') || {};
                this.$set(this.gridElement, 'additionalProps', 'comicBubble', {
                    bubbleType: 'speech',
                    tailPosition: 'bottom-left',
                    text: '',
                    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                    fontSizePct: 100,
                    fontColor: saved.fontColor || '#111111',
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    borderColor: saved.borderColor || '#111111',
                    borderWidth: 3,
                    fillColor: saved.fillColor || '#ffffff',
                    cellBgColor: saved.cellBgColor || 'transparent',
                    comicShadow: true
                });
            }
            return this.gridElement.additionalProps.comicBubble;
        },
        selectLanguages() {
            if (this.selectAllLanguages) {
                return this.allLanguages;
            }
            return this.allLanguages.filter(l => this.gridLanguages.includes(l.code));
        }
    },
    watch: {
        gridElement: {
            deep: true,
            handler() {
                this.resetTestGrid();
            }
        }
    },
    methods: {
        onTextChange() {
            this.bubbleProps.text = this.gridElement.label[this.currentLang] || '';
            this.resetTestGrid();
        },
        onFontSizeChange() {
            this.bubbleProps.fontSizePct = this.gridElement.fontSizePct;
            this.resetTestGrid();
        },
        onFontColorChange(color) {
            this.bubbleProps.fontColor = color;
            this.gridElement.fontColor = color;
            this.resetTestGrid();
        },
        onCellBgColorChange(color) {
            this.bubbleProps.cellBgColor = color;
            this.gridElement.backgroundColor = (color === 'transparent' ? null : color);
            this.resetTestGrid();
        },
        onBubbleTypeChange() {
            let savedForType = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + this.bubbleProps.bubbleType)
                || localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS');
            if (savedForType) {
                if (savedForType.borderColor) this.bubbleProps.borderColor = savedForType.borderColor;
                if (savedForType.fillColor) this.bubbleProps.fillColor = savedForType.fillColor;
                if (savedForType.fontColor) {
                    this.bubbleProps.fontColor = savedForType.fontColor;
                    this.gridElement.fontColor = savedForType.fontColor;
                }
                if (savedForType.cellBgColor) {
                    this.bubbleProps.cellBgColor = savedForType.cellBgColor;
                    this.gridElement.backgroundColor = (savedForType.cellBgColor === 'transparent' ? null : savedForType.cellBgColor);
                }
            }
            this.resetTestGrid();
        },
        saveBubbleColors() {
            let colorsToSave = {
                borderColor: this.bubbleProps.borderColor || '#111111',
                fillColor: this.bubbleProps.fillColor || '#ffffff',
                fontColor: this.bubbleProps.fontColor || '#111111',
                cellBgColor: this.bubbleProps.cellBgColor || 'transparent'
            };
            localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS', colorsToSave);
            if (this.bubbleProps.bubbleType) {
                localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + this.bubbleProps.bubbleType, colorsToSave);
            }
            this.saveSuccess = true;
            setTimeout(() => {
                this.saveSuccess = false;
            }, 3000);
        },
        getCurrentBubbleTypeName() {
            let type = this.bubbleProps.bubbleType || 'speech';
            switch (type) {
                case 'thought': return this.$t('bubbleThought') || 'Pensamiento';
                case 'shout': return this.$t('bubbleShout') || 'Grito';
                case 'whisper': return this.$t('bubbleWhisper') || 'Susurro';
                case 'box': return this.$t('bubbleBox') || 'Cuadro de texto';
                case 'speech':
                default:
                    return this.$t('bubbleSpeech') || 'Diálogo';
            }
        },
        openApplyAllConfirm() {
            this.showConfirmApplyAll = true;
        },
        async confirmAndApplyToAll() {
            this.showConfirmApplyAll = false;
            let currentType = this.bubbleProps.bubbleType || 'speech';
            let colors = {
                borderColor: this.bubbleProps.borderColor || '#111111',
                fillColor: this.bubbleProps.fillColor || '#ffffff',
                fontColor: this.bubbleProps.fontColor || '#111111',
                cellBgColor: this.bubbleProps.cellBgColor || 'transparent'
            };

            // Guardar también como predeterminados para este tipo
            localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS', colors);
            localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + currentType, colors);

            if (this.gridData && this.gridData.gridElements && this.gridData.gridElements.length > 0) {
                for (let el of this.gridData.gridElements) {
                    if (el.type === GridElement.ELEMENT_TYPE_COMIC_BUBBLE) {
                        let elType = (el.additionalProps && el.additionalProps.comicBubble && el.additionalProps.comicBubble.bubbleType) || 'speech';
                        if (elType === currentType) {
                            if (!el.additionalProps) this.$set(el, 'additionalProps', {});
                            if (!el.additionalProps.comicBubble) this.$set(el.additionalProps, 'comicBubble', {});
                            this.$set(el.additionalProps.comicBubble, 'borderColor', colors.borderColor);
                            this.$set(el.additionalProps.comicBubble, 'fillColor', colors.fillColor);
                            this.$set(el.additionalProps.comicBubble, 'fontColor', colors.fontColor);
                            this.$set(el.additionalProps.comicBubble, 'cellBgColor', colors.cellBgColor);
                            this.$set(el, 'fontColor', colors.fontColor);
                            this.$set(el, 'backgroundColor', colors.cellBgColor === 'transparent' ? null : colors.cellBgColor);
                        }
                    }
                }
                await dataService.saveGrid(this.gridData);
            }

            this.applyAllSuccess = true;
            setTimeout(() => {
                this.applyAllSuccess = false;
            }, 3500);
        },
        toggleBold(e) {
            this.bubbleProps.fontWeight = e.target.checked ? 'bold' : 'normal';
            this.resetTestGrid();
        },
        toggleItalic(e) {
            this.bubbleProps.fontStyle = e.target.checked ? 'italic' : 'normal';
            this.resetTestGrid();
        },
        getPronunciationPlaceholder(locale) {
            let label = this.gridElement.label[locale] || '';
            let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
            if (label) {
                return `${i18nService.t('pronunciationOf', label)} (${langName})`;
            }
            return `${i18nService.t('pronunciation')} (${langName})`;
        },
        getLabelPlaceholder(locale) {
            let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
            return `${i18nService.t('bubbleText')} (${langName})`;
        },
        speak(locale) {
            let speakText = this.gridElement.pronunciation[locale] || this.gridElement.label[locale];
            if (!speakText) return;
            speechService.speak(speakText, {
                lang: locale,
                voiceLangIsTextLang: true
            });
        },
        resetTestGrid() {
            if (!this.gridElement) return;
            let elCopy = new GridElement(JSON.parse(JSON.stringify(this.gridElement)));
            elCopy.id = 'preview-el-' + Math.random().toString(36).substring(2, 9);
            elCopy.x = 0;
            elCopy.y = 0;
            elCopy.width = 1;
            elCopy.height = 1;
            this.testGridData = new GridData({
                id: 'preview-grid-' + Math.random().toString(36).substring(2, 9),
                gridElements: [elCopy],
                rowCount: 1,
                minColumnCount: 1
            });
        },
        onAddToCollectChange() {
            if (this.gridElement) {
                this.gridElement.dontCollect = !this.gridElement.addToCollect;
            }
        },
        findUsedLocales() {
            this.gridLanguages = gridUtil.getUsedLocales(this.gridData);
            this.selectAllLanguages = this.gridLanguages.length <= 1;
            let langs = this.gridLanguages.length > 1 ? this.gridLanguages : this.allLanguages.map(l => l.code);
            this.chosenLocale = langs.find(lang => lang !== this.currentLang) || 'en';
        }
    },
    created() {
        if (!this.gridElement) return;
        if (this.gridElement.addToCollect == null) {
            this.$set(this.gridElement, 'addToCollect', this.gridElement.dontCollect === false);
            if (this.gridElement.dontCollect == null) {
                this.$set(this.gridElement, 'dontCollect', true);
            }
        }
        if (!this.gridElement.label || typeof this.gridElement.label !== 'object') {
            this.$set(this.gridElement, 'label', {});
        }
        if (!this.gridElement.pronunciation || typeof this.gridElement.pronunciation !== 'object') {
            this.$set(this.gridElement, 'pronunciation', {});
        }
        if (!this.gridElement.additionalProps) {
            this.$set(this.gridElement, 'additionalProps', {});
        }
        if (!this.gridElement.additionalProps.comicBubble) {
            let saved = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS') || {};
            this.$set(this.gridElement.additionalProps, 'comicBubble', {
                bubbleType: 'speech',
                tailPosition: 'bottom-left',
                text: '',
                fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                fontSizePct: 100,
                fontColor: saved.fontColor || '#111111',
                fontWeight: 'bold',
                fontStyle: 'normal',
                textAlign: 'center',
                borderColor: saved.borderColor || '#111111',
                borderWidth: 3,
                fillColor: saved.fillColor || '#ffffff',
                cellBgColor: saved.cellBgColor || 'transparent',
                comicShadow: true
            });
        }
    },
    mounted() {
        if (!this.gridElement) return;
        if (this.gridElement.addToCollect == null) {
            this.$set(this.gridElement, 'addToCollect', this.gridElement.dontCollect === false);
            if (this.gridElement.dontCollect == null) {
                this.$set(this.gridElement, 'dontCollect', true);
            }
        }
        if (!this.gridElement.label || typeof this.gridElement.label !== 'object') {
            this.$set(this.gridElement, 'label', {});
        }
        if (!this.gridElement.pronunciation || typeof this.gridElement.pronunciation !== 'object') {
            this.$set(this.gridElement, 'pronunciation', {});
        }
        if (!this.gridElement.label[this.currentLang] && this.bubbleProps.text) {
            this.$set(this.gridElement.label, this.currentLang, this.bubbleProps.text);
        }
        if (this.gridElement.fontSizePct == null) {
            this.$set(this.gridElement, 'fontSizePct', this.bubbleProps.fontSizePct || 100);
        }
        this.resetTestGrid();
        this.findUsedLocales();
        dataService.getMetadata().then(metadata => {
            this.metadata = metadata;
        });
    }
};
</script>

<style scoped>
.row, .srow {
    margin-top: 0.6em;
}

.cursor-pointer {
    cursor: pointer;
}

.checkbox-label-small {
    font-size: 0.9em;
    font-weight: normal;
    margin: 0;
    line-height: 1;
}

.checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.input-button {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #266697;
}

.color-section-container {
    background-color: #f8fafc;
    border-color: #cbd5e1 !important;
}

.btn-save-bubble-colors {
    background-color: #0284c7;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s;
}

.btn-save-bubble-colors:hover {
    background-color: #0369a1;
}

.btn-apply-all-colors {
    background-color: #475569;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s;
}

.btn-apply-all-colors:hover {
    background-color: #334155;
}

.custom-confirm-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
}

.custom-confirm-card {
    background-color: #ffffff;
    border-radius: 8px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    animation: fadeInModal 0.2s ease;
}

.confirm-icon-bubble {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #e0f2fe;
    color: #0284c7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
}

.confirm-body-text {
    font-size: 0.95em;
    line-height: 1.5;
    color: #475569;
}

@keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
