import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ResolvedModalComponent from '../components/puzzle-resolved-modal/resolved-modal.jsx';

import { closePuzzleResolved } from '../reducers/modals';
import { setProjectUnchanged } from '../reducers/project-changed';

class ResolvedModal extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleOK',
            'handleCancel',
        ]);

        /*this.state = {
            previewing: false
        };*/
    }
    handleOK() {
        this.props.onOK();
        var missions = this.props.puzzleData.missions;
        for (var i = 0; i < missions.length; i++) {
            if (missions[i].id == this.props.puzzleData.id) {
                missions[i].isSolved = true;
                if (i == missions.length - 1) {
                    this.props.onSetProjectUnchanged();
                    window.location = "/User/Missions";
                }
                else {
                    window.location.hash = "#" + missions[i + 1].id;
                }
                return;
            }
        }
    }
    handleCancel() {
        this.props.onCancel();
    }
    render() {
        return (
            <ResolvedModalComponent
                onCancel={this.handleCancel}
                onOK={this.handleOK}
                puzzleData={this.props.puzzleData}
            />
        );
    }
}

ResolvedModal.propTypes = {
    onOK: PropTypes.func,
    onCancel: PropTypes.func
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onOK: () => dispatch(closePuzzleResolved()),
    onCancel: () => dispatch(closePuzzleResolved()),
    onSetProjectUnchanged: () => dispatch(setProjectUnchanged()),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResolvedModal);
