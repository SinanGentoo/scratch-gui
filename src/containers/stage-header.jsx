import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import {STAGE_SIZE_MODES} from '../lib/layout-constants';
import {setStageSize} from '../reducers/stage-size';
import {setFullScreen} from '../reducers/mode';

import {connect} from 'react-redux';

import StageHeaderComponent from '../components/stage-header/stage-header.jsx';

//by yj
//import PuzzleStageHeaderComponent from '../components/puzzle-stage-header/stage-header.jsx';
import {toggleGamepad} from '../reducers/gamepad';
import Slider from '../lib/puzzle-slider';

// eslint-disable-next-line react/prefer-stateless-function
class StageHeader extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            //by yj
            'setSlider',
            'syncSliderValue',
            'onPuzzleBlocksChanged',

            'handleKeyPress'
        ]);
        //by yj
        this.state = {
            preventComplete: false,
            blockCount: 0,
            maxBlockCount: 0,
        };
    }
    componentDidMount () {
        //by yj
        this.props.vm.addListener('PUZZLE_LOADED', this.syncSliderValue);
        this.props.vm.addListener('PUZZLE_BLOCKS_CHANGED', this.onPuzzleBlocksChanged);

        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount () {
        //by yj
        this.props.vm.removeListener('PUZZLE_LOADED', this.syncSliderValue);
        this.props.vm.removeListener('PUZZLE_BLOCKS_CHANGED', this.onPuzzleBlocksChanged);

        document.removeEventListener('keydown', this.handleKeyPress);
    }
    handleKeyPress (event) {
        if (event.key === 'Escape' && this.props.isFullScreen) {
            this.props.onSetStageUnFull(false);
        }
    }

    //by yj
    
    onPuzzleBlocksChanged(e) {
        let puzzle = this.props.vm.runtime.puzzle;
        this.setState({
            preventComplete: puzzle.preventComplete,
            blockCount: puzzle.blockCount,
            maxBlockCount: puzzle.maxBlockCount,
        })
    }
    syncSliderValue() {
        let puzzle = this.props.vm.runtime.puzzle;
        if (puzzle && this.stepIntervalSlider) {
            this.stepIntervalSlider.setValue(1 - Math.sqrt(puzzle.stepInterval / 1000));
        }
    }
    setSlider(slider) {
        if (slider) {
            var sliderSvg = $(slider).find(".slider-svg")[0];
            this.stepIntervalSlider = new Slider(10, 24, 130, sliderSvg, function (value) {
                if (this.props.vm.runtime.puzzle) {
                    this.props.vm.runtime.puzzle.stepInterval = 1000 * Math.pow(1 - value, 2);
                }
            }.bind(this));
            this.syncSliderValue();
        }
    }

    render () {
        const {
            ...props
        } = this.props;
        return (
            <StageHeaderComponent
                {...props}
                onKeyPress={this.handleKeyPress}
                //by yj
                setSlider={this.setSlider}
                preventComplete={this.state.preventComplete}
                blockCount={this.state.blockCount}
                maxBlockCount={this.state.maxBlockCount}
            />
        );
    }
}

StageHeader.propTypes = {
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    onSetStageUnFull: PropTypes.func.isRequired,
    showBranding: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    //by yj
    gamepadVisible: state.scratchGui.gamepad.gamepadVisible,

    stageSizeMode: state.scratchGui.stageSize.stageSize,
    showBranding: state.scratchGui.mode.showBranding,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly
});

const mapDispatchToProps = dispatch => ({
    //by yj
    onToggleGamepad: () => dispatch(toggleGamepad()),

    onSetStageLarge: () => dispatch(setStageSize(STAGE_SIZE_MODES.large)),
    onSetStageSmall: () => dispatch(setStageSize(STAGE_SIZE_MODES.small)),
    onSetStageFull: () => dispatch(setFullScreen(true)),
    onSetStageUnFull: () => dispatch(setFullScreen(false))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(StageHeader);
