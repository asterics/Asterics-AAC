<template>
    <div class="color-palette-picker-container mb-3">
        <div class="row align-items-center mb-1">
            <label class="col-sm-3 col-12 mb-1" :for="id">
                <span>{{ label | translate }}</span>
            </label>

            <div class="col-sm-7 col-9 d-flex align-items-center gap-2 mb-1">
                <!-- Botón de apertura de la tabla de colores -->
                <button type="button"
                        class="color-preview-btn d-flex align-items-center justify-content-between p-1 flex-grow-1"
                        :id="id"
                        @click="togglePalette"
                        :title="$t('selectColor')">
                    <span class="color-swatch-box me-2" :style="swatchStyle"></span>
                    <span class="color-hex-label me-1">{{ displayColorText }}</span>
                    <i :class="['fas', isOpen ? 'fa-chevron-up' : 'fa-chevron-down', 'ms-auto', 'text-muted']"></i>
                </button>

                <!-- Entrada oculta para selector nativo/personalizado -->
                <input ref="nativeColorInput"
                       type="color"
                       class="native-color-hidden"
                       :value="safeHexForNative(value)"
                       @input="onNativeInput" />

                <!-- Botón de edición personalizada -->
                <button type="button"
                        class="btn-edit-custom p-1"
                        @click="triggerNativePicker"
                        :title="$t('customColor')">
                    <i class="fas fa-palette"></i>
                </button>
            </div>

            <!-- Botón de limpiar / restablecer -->
            <div class="col-sm-2 col-3 mb-1 px-1" v-if="showClearButton">
                <button type="button"
                        class="btn btn-secondary btn-sm col-12"
                        :disabled="isDefaultValue"
                        @click="resetToDefault">
                    {{ $t('clear') }}
                </button>
            </div>
        </div>

        <!-- Panel desplegable con la tabla de colores preestablecidos y opciones de edición -->
        <div v-if="isOpen" class="palette-dropdown-panel p-3 mt-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="palette-header-title">
                    <i class="fas fa-th me-1"></i> {{ $t('presetColors') }}
                </span>
                <button type="button" class="btn-close-palette" @click="isOpen = false" :title="$t('close')">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Tabla de 50 colores preestablecidos (5 filas x 10 columnas con categorías) -->
            <div class="colors-table-grid mb-3">
                <div v-for="(row, rIdx) in preset50Colors" :key="'row-' + rIdx" class="colors-table-row-wrapper mb-2">
                    <div class="palette-row-category-name">{{ getRowLabel(rIdx) }}</div>
                    <div class="colors-table-row">
                        <button v-for="(col, cIdx) in row"
                                :key="'c-' + rIdx + '-' + cIdx"
                                type="button"
                                class="color-grid-cell"
                                :class="{ 'is-selected': isSelected(col) }"
                                :style="{ backgroundColor: col }"
                                :title="col"
                                @click="selectColor(col)">
                            <i v-if="isSelected(col)" :class="['fas', 'fa-check', isColorDark(col) ? 'text-white' : 'text-dark']"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Opción de color transparente (si está permitida, p.ej. fondo) -->
            <div v-if="allowTransparent" class="mb-3 d-flex align-items-center">
                <button type="button"
                        class="btn-transparent-option d-flex align-items-center gap-2 p-2"
                        :class="{ 'is-selected': isTransparent(value) }"
                        @click="selectColor('transparent')">
                    <span class="checkerboard-box"></span>
                    <span>{{ $t('transparent') }}</span>
                    <i v-if="isTransparent(value)" class="fas fa-check ms-auto text-primary"></i>
                </button>
            </div>

            <!-- Barra de edición y personalización de color -->
            <div class="custom-color-edit-bar d-flex align-items-center justify-content-between p-2">
                <div class="d-flex align-items-center gap-2">
                    <label class="mb-0 fw-bold">{{ $t('customColor') }}:</label>
                    <input type="color"
                           class="color-picker-input-inline"
                           :value="safeHexForNative(value)"
                           @input="onNativeInput" />
                    <input type="text"
                           class="hex-text-input"
                           maxlength="7"
                           :value="value"
                           @input="onHexTextInput"
                           placeholder="#000000" />
                </div>
                <button type="button" class="btn btn-sm btn-primary px-3" @click="isOpen = false">
                    <i class="fas fa-check me-1"></i> {{ $t('ok') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { i18nService } from '../../../js/service/i18nService.js';
import { fontUtil } from '../../../js/util/fontUtil.js';

const PRESET_50_COLORS = [
    // Fila 1: Escala de grises y neutros (10 colores)
    ['#000000', '#1f1f1f', '#3f3f3f', '#5f5f5f', '#7f7f7f', '#9f9f9f', '#bfbfbf', '#dfdfdf', '#f0f0f0', '#ffffff'],
    // Fila 2: Primarios y vivos estilo cómic (10 colores)
    ['#e53935', '#f4511e', '#fb8c00', '#ffb300', '#fdd835', '#7cb342', '#43a047', '#00acc1', '#1e88e5', '#8e24aa'],
    // Fila 3: Tonos pastel y claros (10 colores)
    ['#ffcdd2', '#ffe0b2', '#fff9c4', '#f0f4c3', '#c8e6c9', '#b2ebf2', '#bbdefb', '#d1c4e9', '#f8bbd0', '#e1bee7'],
    // Fila 4: Tonos intensos y profundos (10 colores)
    ['#b71c1c', '#e65100', '#f57f17', '#33691e', '#1b5e20', '#006064', '#0d47a1', '#311b92', '#880e4f', '#4e342e'],
    // Fila 5: Paleta cómic moderna / Pop Art (10 colores)
    ['#ffeaa7', '#fab1a0', '#ff7675', '#fd79a8', '#fdcb6e', '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#636e72']
];

export default {
    name: 'ColorPalettePicker',
    props: {
        id: { type: String, default: 'colorPicker' },
        label: { type: String, default: 'Color' },
        value: { type: String, default: '#ffffff' },
        defaultColor: { type: String, default: '#ffffff' },
        allowTransparent: { type: Boolean, default: false },
        showClearButton: { type: Boolean, default: true }
    },
    data() {
        return {
            isOpen: false,
            preset50Colors: PRESET_50_COLORS,
            i18nService: i18nService
        };
    },
    computed: {
        displayColorText() {
            if (this.isTransparent(this.value)) {
                return i18nService.t('transparent') || 'Transparente';
            }
            return (this.value || this.defaultColor || '').toUpperCase();
        },
        swatchStyle() {
            if (this.isTransparent(this.value)) {
                return {
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px',
                    border: '1px solid #ccc'
                };
            }
            return {
                backgroundColor: this.value || this.defaultColor || '#ffffff',
                border: '1px solid rgba(0,0,0,0.2)'
            };
        },
        isDefaultValue() {
            return this.value === this.defaultColor || (!this.value && this.defaultColor === 'transparent');
        }
    },
    methods: {
        togglePalette() {
            this.isOpen = !this.isOpen;
        },
        selectColor(color) {
            this.$emit('input', color);
            this.$emit('change', color);
        },
        resetToDefault() {
            this.selectColor(this.defaultColor);
        },
        triggerNativePicker() {
            if (this.$refs.nativeColorInput) {
                this.$refs.nativeColorInput.click();
            }
        },
        onNativeInput(e) {
            let color = e.target.value;
            this.selectColor(color);
        },
        onHexTextInput(e) {
            let color = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                this.selectColor(color);
            }
        },
        isTransparent(val) {
            return !val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)';
        },
        isSelected(color) {
            if (!this.value) return false;
            return this.value.toLowerCase() === color.toLowerCase();
        },
        isColorDark(hex) {
            try {
                return fontUtil.isHexDark(hex);
            } catch (e) {
                return false;
            }
        },
        getRowLabel(idx) {
            const keys = [
                'colorPaletteGrayscale',
                'colorPalettePrimary',
                'colorPalettePastel',
                'colorPaletteDeep',
                'colorPalettePopArt'
            ];
            let key = keys[idx];
            return (key && this.$t(key)) ? this.$t(key) : `${idx + 1}. Palette`;
        },
        safeHexForNative(val) {
            if (this.isTransparent(val) || !val || !val.startsWith('#') || val.length !== 7) {
                return '#ffffff';
            }
            return val;
        }
    }
};
</script>

<style scoped>
.color-palette-picker-container {
    width: 100%;
    position: relative;
}

.color-preview-btn {
    height: 38px;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: border-color 0.2s, background-color 0.2s;
}

.color-preview-btn:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
}

.color-swatch-box {
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    box-shadow: inset 0 0 2px rgba(0,0,0,0.3);
}

.color-hex-label {
    font-weight: 600;
    color: #333;
}

.palette-badge {
    font-size: 0.78em;
    font-weight: 600;
    color: #2d7bb4;
    background-color: #eaf2f8;
    border: 1px solid #c0d8ec;
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
}

.palette-row-category-name {
    font-size: 0.82em;
    font-weight: 600;
    color: #546e7a;
    margin-bottom: 2px;
    text-align: left;
}

.native-color-hidden {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
}

.btn-edit-custom {
    height: 38px;
    width: 38px;
    background-color: #f0f4f8;
    border: 1px solid #ced4da;
    border-radius: 4px;
    color: #2d7bb4;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    transition: background-color 0.2s;
}

.btn-edit-custom:hover {
    background-color: #e2eaf2;
    border-color: #2d7bb4;
}

.palette-dropdown-panel {
    background-color: #ffffff;
    border: 1px solid #cfd9e0;
    border-radius: 6px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    width: 100%;
}

.palette-header-title {
    font-size: 0.95em;
    font-weight: bold;
    color: #37474f;
}

.btn-close-palette {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 1em;
    padding: 2px 6px;
    border-radius: 3px;
}

.btn-close-palette:hover {
    color: #333;
    background-color: #eee;
}

.colors-table-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background-color: #f7f9fa;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #e1e8ed;
}

.colors-table-row {
    display: flex;
    gap: 4px;
    justify-content: space-between;
}

.color-grid-cell {
    flex: 1 1 0;
    height: 28px;
    min-width: 20px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    padding: 0;
}

.color-grid-cell:hover {
    transform: scale(1.18);
    z-index: 3;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border-color: #333;
}

.color-grid-cell.is-selected {
    box-shadow: 0 0 0 2px #2d7bb4, inset 0 0 2px rgba(0,0,0,0.5);
    border-color: #fff;
    transform: scale(1.08);
}

.btn-transparent-option {
    width: 100%;
    background-color: #f8f9fa;
    border: 1px dashed #adb5bd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
}

.btn-transparent-option:hover {
    background-color: #e9ecef;
    border-color: #6c757d;
}

.btn-transparent-option.is-selected {
    border: 1px solid #2d7bb4;
    background-color: #eaf2f8;
}

.checkerboard-box {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    display: inline-block;
    background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px;
    border: 1px solid #adb5bd;
}

.custom-color-edit-bar {
    background-color: #f0f4f8;
    border-radius: 4px;
    border: 1px solid #dce4eb;
    font-size: 0.9em;
}

.color-picker-input-inline {
    width: 34px;
    height: 28px;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
}

.hex-text-input {
    width: 90px;
    height: 28px;
    padding: 2px 6px;
    font-size: 0.9em;
    font-family: monospace;
    border: 1px solid #ccc;
    border-radius: 3px;
}
</style>
