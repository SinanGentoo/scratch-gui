import classNames from 'classnames';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import Controls from '../../containers/controls.jsx';
import { getStageDimensions } from '../../lib/screen-utils';
import { STAGE_SIZE_MODES } from '../../lib/layout-constants';

import fullScreenIcon from './icon--fullscreen.svg';
import largeStageIcon from './icon--large-stage.svg';
import smallStageIcon from './icon--small-stage.svg';
import unFullScreenIcon from './icon--unfullscreen.svg';

//by yj
import Gamepad from '../gamepad/gamepad.jsx';
import gamepadIcon from './icon--gamepad.svg';

import styles from './stage-header.css';

const messages = defineMessages({
    largeStageSizeMessage: {
        defaultMessage: 'Switch to large stage',
        description: 'Button to change stage size to large',
        id: 'gui.stageHeader.stageSizeLarge'
    },
    smallStageSizeMessage: {
        defaultMessage: 'Switch to small stage',
        description: 'Button to change stage size to small',
        id: 'gui.stageHeader.stageSizeSmall'
    },
    fullStageSizeMessage: {
        defaultMessage: 'Enter full screen mode',
        description: 'Button to change stage size to full screen',
        id: 'gui.stageHeader.stageSizeFull'
    },
    unFullStageSizeMessage: {
        defaultMessage: 'Exit full screen mode',
        description: 'Button to get out of full screen mode',
        id: 'gui.stageHeader.stageSizeUnFull'
    },
    fullscreenControl: {
        defaultMessage: 'Full Screen Control',
        description: 'Button to enter/exit full screen mode',
        id: 'gui.stageHeader.fullscreenControl'
    }
});

const StageHeaderComponent = function (props) {
    const {
        //by yj
        onToggleGamepad,
        setSlider,
        puzzleData,

        isFullScreen,
        isPlayerOnly,
        onKeyPress,
        onSetStageLarge,
        onSetStageSmall,
        onSetStageFull,
        onSetStageUnFull,
        stageSizeMode,
        vm
    } = props;

    let header = null;

    //by yj
    let isPuzzleMode = Blockey.GUI_CONFIG.MODE=='Puzzle';
    let puzzle=null,blockError=null,slider=null,blocksInfo=null;
    if(isPuzzleMode){
        puzzle = vm.runtime.puzzle || {
            blockCount: 0,
            maxBlockCount: puzzleData.maxBlockCount,
        };
        blockError = puzzle.maxBlockCount > 0 && puzzle.blockCount > puzzle.maxBlockCount;
        slider = (
            <Box className={styles.slider} componentRef={setSlider}>
                <svg className={"slider-svg"} xmlns="http://www.w3.org/2000/svg" width="150" height="32">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                        <clipPath id="slowClipPath">
                            <rect width="26" height="12" x="5" y="14" /></clipPath>
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                        <clipPath id="fastClipPath">
                            <rect width="26" height="16" x="120" y="10" />
                        </clipPath>
                    </svg>
                </svg>
            </Box>
        );
        blocksInfo = (
            <div className={classNames(styles.blockCount, blockError ? styles.error : "")}>
                <span>{puzzle.blockCount + "/" + (puzzle.maxBlockCount > 0 ? puzzle.maxBlockCount : "∞")}</span>
            </div>
        );
    }

    if (isFullScreen) {
        const stageDimensions = getStageDimensions(null, true);
        header = (
            <Box className={styles.stageHeaderWrapperOverlay}>
                <Box
                    className={styles.stageMenuWrapper}
                    style={{ width: stageDimensions.width }}
                >
                    {Blockey.GUI_CONFIG.MODE!='Puzzle'?(
                        <Controls vm={vm} />
                    ):null}
                    <Button
                        className={styles.stageButton}
                        onClick={onSetStageUnFull}
                        onKeyPress={onKeyPress}
                    >
                        <img
                            alt={props.intl.formatMessage(messages.unFullStageSizeMessage)}
                            className={styles.stageButtonIcon}
                            draggable={false}
                            src={unFullScreenIcon}
                            title={props.intl.formatMessage(messages.fullscreenControl)}
                        />
                    </Button>
                    {Blockey.GUI_CONFIG.MODE=='Puzzle'?(
                        <Controls vm={vm} />
                    ):null}
                </Box>
            </Box>
        );
    } else {
        const stageControls =
            isPlayerOnly ? (
                []
            ) : (
                    <div className={styles.stageSizeToggleGroup}>
                        <div>
                            <Button
                                className={classNames(
                                    styles.stageButton,
                                    styles.stageButtonLeft,
                                    (stageSizeMode === STAGE_SIZE_MODES.small) ? null : styles.stageButtonToggledOff
                                )}
                                onClick={onSetStageSmall}
                            >
                                <img
                                    alt={props.intl.formatMessage(messages.smallStageSizeMessage)}
                                    className={styles.stageButtonIcon}
                                    draggable={false}
                                    src={smallStageIcon}
                                />
                            </Button>
                        </div>
                        <div>
                            <Button
                                className={classNames(
                                    styles.stageButton,
                                    styles.stageButtonRight,
                                    (stageSizeMode === STAGE_SIZE_MODES.large) ? null : styles.stageButtonToggledOff
                                )}
                                onClick={onSetStageLarge}
                            >
                                <img
                                    alt={props.intl.formatMessage(messages.largeStageSizeMessage)}
                                    className={styles.stageButtonIcon}
                                    draggable={false}
                                    src={largeStageIcon}
                                />
                            </Button>
                        </div>
                    </div>
                );
        header = (
            <Box className={styles.stageHeaderWrapper}>
                <Box className={styles.stageMenuWrapper}>
                    {Blockey.GUI_CONFIG.MODE!='Puzzle'?(
                        <Controls vm={vm} />
                    ):null}
                    <div className={styles.stageSizeRow}>
                        {Blockey.GUI_CONFIG.MODE!='Puzzle'? stageControls:null}
                        <div>
                            {Blockey.GUI_CONFIG.IS_MOBILE ? (
                                <img
                                    alt="游戏键盘"
                                    className={classNames(styles.gamepadIcon, {
                                        [styles.isActive]: props.gamepadVisible
                                    })}
                                    draggable={false}
                                    src={gamepadIcon}
                                    onClick={onToggleGamepad}
                                    title="游戏键盘"
                                />
                            ) : (
                                    <Button
                                        className={styles.stageButton}
                                        onClick={onSetStageFull}
                                    >
                                        <img
                                            alt={props.intl.formatMessage(messages.fullStageSizeMessage)}
                                            className={styles.stageButtonIcon}
                                            draggable={false}
                                            src={fullScreenIcon}
                                            title={props.intl.formatMessage(messages.fullscreenControl)}
                                        />
                                    </Button>
                                )}
                        </div>
                    </div>
                    {slider}
                    {blocksInfo}
                    {Blockey.GUI_CONFIG.MODE=='Puzzle'?(
                        <Controls vm={vm} />
                    ):null}
                </Box>
                {props.gamepadVisible ? (
                    <Gamepad vm={vm} />
                ) : null}
            </Box>
        );
    }

    return header;
};

const mapStateToProps = state => ({
    //by yj
    gamepadVisible: state.scratchGui.gamepad.gamepadVisible,

    // This is the button's mode, as opposed to the actual current state
    stageSizeMode: state.scratchGui.stageSize.stageSize
});

StageHeaderComponent.propTypes = {
    intl: intlShape,
    isFullScreen: PropTypes.bool.isRequired,
    isPlayerOnly: PropTypes.bool.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onSetStageFull: PropTypes.func.isRequired,
    onSetStageLarge: PropTypes.func.isRequired,
    onSetStageSmall: PropTypes.func.isRequired,
    onSetStageUnFull: PropTypes.func.isRequired,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    vm: PropTypes.instanceOf(VM).isRequired
};

StageHeaderComponent.defaultProps = {
    stageSizeMode: STAGE_SIZE_MODES.large
};

export default injectIntl(connect(
    mapStateToProps
)(StageHeaderComponent));
