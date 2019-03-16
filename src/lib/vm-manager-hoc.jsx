import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsLoadingWithId,
    onLoadedProject,
    projectError
} from '../reducers/project-state';

/*
 * Higher Order Component to manage events emitted by the VM
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const vmManagerHOC = function (WrappedComponent) {
    class VMManager extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'loadProject'
            ]);
        }
        componentDidMount () {
            if (!this.props.vm.initialized) {
                this.audioEngine = new AudioEngine();
                this.props.vm.attachAudioEngine(this.audioEngine);
                this.props.vm.setCompatibilityMode(true);
                this.props.vm.initialized = true;
            }
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }

            //by yj
            if(Blockey.GUI_CONFIG.MODE=='Puzzle')this.props.vm.runtime.puzzle={};
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
            Blockey.Utils.requestSnapshot = ()=>{
                this.props.vm.renderer.requestSnapshot(dataURI => {
                    this.props.vm.postIOData('video', { forceTransparentPreview: false });
                    Blockey.Utils.setProjectSnapshot(dataURI);
                });
            };
        }
        componentDidUpdate (prevProps) {
            // if project is in loading state, AND fonts are loaded,
            // and they weren't both that way until now... load project!
            if (this.props.isLoadingWithId && this.props.fontsLoaded && //by yj fix safari can not load fonts
                (!prevProps.isLoadingWithId || !prevProps.fontsLoaded)) {
                this.loadProject();
            }
            // Start the VM if entering editor mode with an unstarted vm
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        requestSnapshot(){
            this.props.vm.renderer.requestSnapshot(dataURI => {
                this.props.vm.postIOData('video', { forceTransparentPreview: false });
                Blockey.Utils.setProjectSnapshot(dataURI);
            });
        }
        loadProject () {
            return this.props.vm.loadProject(this.props.projectData)
                .then(() => {
                    //by yj                    
                    if(Blockey.GUI_CONFIG.MODE=='Puzzle'){
                        this.onPuzzleLoaded();
                    }

                    this.props.onLoadedProject(this.props.loadingState, this.props.canSave);
                    // Wrap in a setTimeout because skin loading in
                    // the renderer can be async.
                    setTimeout(() => this.props.onSetProjectUnchanged());

                    // If the vm is not running, call draw on the renderer manually
                    // This draws the state of the loaded project with no blocks running
                    // which closely matches the 2.0 behavior, except for monitors–
                    // 2.0 runs monitors and shows updates (e.g. timer monitor)
                    // before the VM starts running other hat blocks.
                    if (!this.props.isStarted) {
                        // Wrap in a setTimeout because skin loading in
                        // the renderer can be async.
                        setTimeout(() => this.props.vm.renderer.draw());
                    }
                })
                .catch(e => {
                    this.props.onError(e);
                });
        }
        //by yj
        onPuzzleLoaded() {
            this.props.vm.setCompatibilityMode(true);
            this.props.vm.start();
            if (this.props.puzzleData) {
                var runtime = this.props.vm.runtime;
                runtime.puzzle = {
                    maxBlockCount: this.props.puzzleData.maxBlockCount,
                    attemptCount: 0,
                    stepInterval: this.props.puzzleData.stepInterval || 0.5,
                    setResolved: this.setPuzzleResolved.bind(this),
                    isRuning: false,
                    preventComplete: false,
                };
                var defaultSprite = this.props.puzzleData.defaultSprite;
                var target = runtime.getSpriteTargetByName(defaultSprite);
                if (!target) target = runtime.getTargetForStage();
                this.props.vm.setEditingTarget(target.id);
                //this.props.vm.emitWorkspaceUpdate();
                this.props.vm.resetPuzzle();
                this.props.vm.emit("PUZZLE_LOADED");
                this.setState({ loading: false });
            }
        }
        setPuzzleResolved() {
            if (this.props.vm.runtime.puzzle.preventComplete) return;
            this.props.vm.emit("PUZZLE_RESOLVED");
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                fontsLoaded,
                loadingState,
                isStarted,
                onError: onErrorProp,
                onLoadedProject: onLoadedProjectProp,
                onSetProjectUnchanged,
                projectData,
                /* eslint-enable no-unused-vars */
                isLoadingWithId: isLoadingWithIdProp,
                vm,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    isLoading={isLoadingWithIdProp}
                    vm={vm}
                    {...componentProps}
                />
            );
        }
    }

    VMManager.propTypes = {
        canSave: PropTypes.bool,
        cloudHost: PropTypes.string,
        fontsLoaded: PropTypes.bool,
        isLoadingWithId: PropTypes.bool,
        isPlayerOnly: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onError: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onSetProjectUnchanged: PropTypes.func,
        projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            fontsLoaded: state.scratchGui.fontsLoaded,
            isLoadingWithId: getIsLoadingWithId(loadingState),
            projectData: state.scratchGui.projectState.projectData,
            puzzleData: state.scratchGui.projectState.puzzleData,//by yj
            projectId: state.scratchGui.projectState.projectId,
            loadingState: loadingState,
            isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
            isStarted: state.scratchGui.vmStatus.started
        };
    };

    const mapDispatchToProps = dispatch => ({
        //by yj
        onOpenPuzzleResolved: () => dispatch(openPuzzleResolved()),

        onError: error => dispatch(projectError(error)),
        onLoadedProject: (loadingState, canSave) =>
            dispatch(onLoadedProject(loadingState, canSave, true)),
        onSetProjectUnchanged: () => dispatch(setProjectUnchanged())
    });

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(VMManager);
};

export default vmManagerHOC;
