<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" style="max-width: 500px">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('gridSettings') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <h2>{{ $t('size') }}</h2>
                        <div class="srow">
                            <label for="gridRows" class="seven columns">{{ $t('minimumNumberOfRows') }}</label>
                            <input id="gridRows" type="number" class="three columns" v-model.number="gridData.rowCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                        </div>
                        <div class="srow">
                            <label for="gridCols" class="seven columns">{{ $t('minimumNumberOfColumns') }}</label>
                            <input id="gridCols" type="number" class="three columns" v-model.number="gridData.minColumnCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                        </div>
                        <h2>{{ $t('boardBackgroundImage') }}</h2>
                        <div class="srow">
                            <label class="four columns">{{ $t('image') }}</label>
                            <button type="button" class="eight columns" @click="$refs.bgImageFileInput.click()">
                                <i class="fas fa-file-upload"/> <span>{{ $t('chooseFile') }}</span>
                            </button>
                            <input type="file" ref="bgImageFileInput" id="bgImageInput" style="display: none;" @change="onBgImageSelected" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"/>
                        </div>
                        <div class="srow">
                            <button type="button" class="offset-by-four eight columns" :disabled="!gridData.backgroundImage" @click="clearBgImage()">
                                <i class="fas fa-trash-alt"/> <span>{{ $t('clear') }}</span>
                            </button>
                        </div>
                        <div class="srow" v-if="gridData.backgroundImage">
                            <div class="offset-by-four eight columns" style="display: flex; align-items: center;">
                                <div style="border: 1px solid #dcdcdc; border-radius: 2px; padding: 4px; background: #f8f9fa;">
                                    <img :src="gridData.backgroundImage" style="max-width: 160px; max-height: 90px; display: block; object-fit: contain;" alt="Preview"/>
                                </div>
                            </div>
                        </div>
                        <div v-if="!isGlobalGrid">
                            <h2>{{ $t('globalGrid') }}</h2>
                            <div class="srow">
                                <input id="showGlobalGrid" type="checkbox" v-model="gridData.showGlobalGrid"/>
                                <label for="showGlobalGrid">{{ $t('showGlobalGrid') }}</label>
                            </div>
                            <div class="srow" v-if="false">
                                <label class="three columns" for="selectGlobalGrid">{{ $t('selectGlobalGrid') }}</label>
                                <select class="seven columns" id="selectGlobalGrid" v-model="gridData.globalGridId">
                                    <option :value="null">({{ $t('defaultGlobalGrid') }})</option>
                                    <option v-for="grid in allGrids" :value="grid.id">{{grid.label | extractTranslation}}</option>
                                </select>
                            </div>
                        </div>
                        <h2>{{ $t('keyboard') }}</h2>
                        <div class="srow mb-5">
                            <label class="four columns" for="keyboardMode">{{ $t('keyboardMode') }}</label>
                            <select class="six columns" id="keyboardMode" v-model="gridData.keyboardMode">
                                <option :value="null">({{ $t('automatic') }})</option>
                                <option v-for="mode in GridData.KEYBOARD_MODES" :value="mode">{{ $t(mode) }}</option>
                            </select>
                        </div>
                        <h2>{{ $t('TAB_APPEARANCE') }}</h2>
                        <div class="srow mb-5">
                            <label class="four columns" for="bgColor">{{ $t('customBackgroundColor') }}</label>
                            <input class="three columns" type="color" id="bgColor" v-if="gridData" v-model="gridData.backgroundColor"/>
                            <button class="three columns" :disabled="!gridData.backgroundColor" @click="gridData.backgroundColor = null;">{{ $t('clear') }}</button>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button @click="$emit('close')" :title="$t('keyboardEsc')" class="six columns">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" :title="$t('keyboardCtrlEnter')" class="six columns">
                                <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {dataService} from "../../js/service/data/dataService";
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';
    import { gridUtil } from '../../js/util/gridUtil';
    import { imageUtil } from '../../js/util/imageUtil';
    import { i18nService } from '../../js/service/i18nService';
    import { GridData } from '../../js/model/GridData';

    export default {
        props: ['gridDataParam', 'isGlobalGrid', 'undoService'],
        data: function () {
            return {
                gridData: JSON.parse(JSON.stringify(this.gridDataParam)),
                gridHeight: gridUtil.getHeight(this.gridDataParam),
                allGrids: [],
                gridLayoutUtil: gridLayoutUtil,
                GridData: GridData
            }
        },
        methods: {
            save() {
                this.gridData.rowCount = Math.min(this.gridData.rowCount, gridLayoutUtil.MAX_GRID_SIZE);
                this.gridData.minColumnCount = Math.min(this.gridData.minColumnCount, gridLayoutUtil.MAX_GRID_SIZE);
                localStorageService.saveLastGridDimensions({
                    rowCount: this.gridData.rowCount,
                    minColumnCount: this.gridData.minColumnCount
                });
                let promises = [];
                promises.push(this.undoService.updateGrid(this.gridData));
                Promise.all(promises).then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            },
            triggerFileInput() {
                if (this.$refs.bgImageFileInput) {
                    this.$refs.bgImageFileInput.click();
                }
            },
            async onBgImageSelected(event) {
                let file = event.target.files && event.target.files[0];
                if (!file) {
                    return;
                }
                let base64 = await imageUtil.getBase64FromInput(event.target);
                if (base64) {
                    let compressed = await imageUtil.compressToSize(base64, 1920, 1024).catch(() => base64);
                    this.$set(this.gridData, 'backgroundImage', compressed || base64);
                }
            },
            clearBgImage() {
                this.$set(this.gridData, 'backgroundImage', null);
                if (this.$refs.bgImageFileInput) {
                    this.$refs.bgImageFileInput.value = '';
                }
            }
        },
        async mounted() {
            this.allGrids = (await dataService.getGrids(false))
                .sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    h2 {
        margin-top: 2em;
    }
</style>