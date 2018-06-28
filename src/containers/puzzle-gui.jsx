import AudioEngine from 'scratch-audio';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import { openExtensionLibrary } from '../reducers/modals';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import { openPuzzleResolved, closePuzzleLoading } from '../reducers/modals';
import ScratchBlocks from 'scratch-blocks';

import PuzzleLoaderHOC from '../lib/puzzle-loader-hoc.jsx';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';

import GUIComponent from '../components/puzzle-gui/gui.jsx';

class GUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: !props.vm.initialized,
            loadingError: false,
            errorMessage: ''
        };
    }
    componentDidMount() {
        if (this.props.vm.initialized) return;
        this.audioEngine = new AudioEngine();
        this.props.vm.attachAudioEngine(this.audioEngine);

        //by yj
        this.props.vm.startPuzzle = function () {
            this.runtime.startHats('event_whenflagclicked');
            this.emit('PUZZLE_RUN_START');
        };
        this.props.vm.resetPuzzle = function () {
            this.stopAll();
            this.runtime.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: "@onInit"
            });
            this.emit('PUZZLE_RUN_RESET');
        };

        this.props.vm.loadProject(this.props.projectData)
            .then(() => {
                this.setState({ loading: false }, () => {
                    this.onProjectLoaded();
                });
            })
            .catch(e => {
                // Need to catch this error and update component state so that
                // error page gets rendered if project failed to load
                this.setState({ loadingError: true, errorMessage: e });
            });
        this.props.vm.initialized = true;
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.projectData !== nextProps.projectData) {
            this.setState({ loading: true }, () => {
                this.props.vm.loadProject(nextProps.projectData)
                    .then(() => {
                        this.onProjectLoaded();
                    })
                    .catch(e => {
                        // Need to catch this error and update component state so that
                        // error page gets rendered if project failed to load
                        this.setState({ loadingError: true, errorMessage: e });
                    });
            });
        }
    }
    onProjectLoaded() {
        this.props.vm.setCompatibilityMode(true);
        this.props.vm.start();
        if (this.props.puzzleData) {
            this.props.vm.runtime.puzzle = {
                maxBlockCount: this.props.puzzleData.maxBlockCount,
                attemptCount: 0,
                stepInterval: this.props.puzzleData.stepInterval,
                setResolved: this.setPuzzleResolved.bind(this),
                isRuning: false,
                preventComplete: false,
            };
            var defaultSprite = this.props.puzzleData.defaultSprite;
            var runtime = this.props.vm.runtime;
            var target = runtime.getSpriteTargetByName(defaultSprite);
            if (!target) target = runtime.getTargetForStage();
            this.props.vm.setEditingTarget(target.id);
            this.props.vm.resetPuzzle();
            this.props.vm.emit("PUZZLE_LOADED");
            this.setState({ loading: false });
        }
    }
    setPuzzleResolved() {
        if (this.props.vm.runtime.puzzle.preventComplete) return;

        var xmlText = ScratchBlocks.Xml.domToPrettyText(ScratchBlocks.Xml.workspaceToDom(ScratchBlocks.mainWorkspace));
        Blockey.Utils.ajax({
            url: "/Mission/SetResolved2",
            data: { id: this.props.puzzleData.id, answer: xmlText },
            success: (data) => {
                this.props.onOpenPuzzleResolved();
            }
        });
    }
    componentWillUnmount() {
        this.props.vm.stopAll();
    }
    render() {
        if (this.state.loadingError) {
            throw new Error(
                `Failed to load project from server [id=${window.location.hash}]: ${this.state.errorMessage}`);
        }
        const {
            children,
            fetchingProject,
            loadingStateVisible,
            projectData, // eslint-disable-line no-unused-vars
            puzzleData,
            vm,
            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || this.state.loading || loadingStateVisible}
                vm={vm}
                puzzleData={puzzleData}
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    ...GUIComponent.propTypes,
    fetchingProject: PropTypes.bool,
    importInfoVisible: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    previewInfoVisible: PropTypes.bool,
    projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    vm: PropTypes.instanceOf(VM)
};

GUI.defaultProps = GUIComponent.defaultProps;

const mapStateToProps = state => ({
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
    backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
    blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
    cardsVisible: state.scratchGui.cards.visible,
    costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
    costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
    importInfoVisible: state.scratchGui.modals.importInfo,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    loadingStateVisible: state.scratchGui.modals.loadingProject,
    previewInfoVisible: state.scratchGui.modals.previewInfo,
    targetIsStage: (
        state.scratchGui.targets.stage &&
        state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
    ),
    soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
    tipsLibraryVisible: state.scratchGui.modals.tipsLibrary,
    //by yj
    puzzleResolvedVisible: state.scratchGui.modals.puzzleResolved,
});

const mapDispatchToProps = dispatch => ({
    //by yj
    onOpenPuzzleResolved: () => dispatch(openPuzzleResolved()),

    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary())
});

const ConnectedGUI = connect(
    mapStateToProps,
    mapDispatchToProps,
)(GUI);

const WrappedGui = ErrorBoundaryHOC('Top Level App')(
    PuzzleLoaderHOC(vmListenerHOC(ConnectedGUI))
);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;
