/**
 * Wrapper for Augment React
 * documentation at: https://developers.augment.com
 */
'use strict';

import React, { Component } from 'react';
import { NativeEventEmitter, NativeModules, requireNativeComponent, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';

/**
 * This is the Native class interface for javascript only parts
 */
var AugmentReact = NativeModules.AugmentReact;
// These are defined by the Native module and are main event sent by Augment SDK
// AugmentReact.AUGMENT_EVENT_LOADING_PROGRESS
// AugmentReact.AUGMENT_EVENT_LOADING_OVER

const AugmentEventEmitter = new NativeEventEmitter(AugmentReact);

/**
 * This is the Native View (Player) class that will be extended
 */
var AugmentReactPlayerNative = requireNativeComponent('AugmentReactPlayerNative', {
    name: 'AugmentReactPlayerNative',
    propTypes: {
        // loaderCallback((loaderObject: [progress: int, show: bool]) => void)
        loaderCallback: PropTypes.func,
        // onPlayerReady(player: AugmentReactPlayer, errorCallback: (error: [error: string]) => void)
        onPlayerReady: PropTypes.func,
        // include the default view properties
        ...ViewPropTypes
    },
});

/**
 * Extended version of the Player
 * That way we can enforce specifics behaviours
 */
class AugmentReactPlayer extends Component {
    constructor(props) {
        super(props);
        AugmentEventEmitter.addListener(
            AugmentReact.AUGMENT_EVENT_LOADING_PROGRESS,
            this.handleLoadingProgress.bind(this)
        );
        AugmentEventEmitter.addListener(
            AugmentReact.AUGMENT_EVENT_LOADING_OVER,
            this.handleLoadingOver.bind(this)
        );
    }

    handleLoadingProgress(args) {
        if (this.props.loaderCallback) {
            this.props.loaderCallback({"show": true, "progress": args.progress});
        }
    }

    handleLoadingOver(args) {
        if (this.props.loaderCallback) {
            this.props.loaderCallback({"show": false, "progress": 100});
        }
    }

    recenterProducts() {
        AugmentReact.recenterProducts()
        .catch((error) => {
            console.error(error);
        });
    }

    addProduct(product) {
        return AugmentReact.addProductToAugmentPlayer(product);
    }

    // Reminder, this is the React Component Lifecycle:
    // constructor()
    // componentWillMount()
    // render()
    // componentDidMount()
    componentDidMount() {
        // 1- A static callback/delegate mechanism has been initialized
        //    when `AugmentReact` on the native side has been created
        // 2- The `AugmentReactPlayerNative` native view has been instanciated thanks to `render()`
        // 3- Then here in `componentDidMount()` we call `start()` with two callbacks error/success
        // 4- When the `AugmentReactPlayerNative` view is ready on the native side
        //    it will call the callback/delegate [1] and then goes through our error/success callback [3]
        //    that way we are sure that the "player" is ready to be used and we return `this`
        AugmentReact.start()
        .then((success) => {
            this.props.onPlayerReady(this, null);
        })
        .catch((error) => {
            this.props.onPlayerReady(null, error);
        });
    }

    render() {
        return (
            <AugmentReactPlayerNative {...this.props} />
        );
    }
}

module.exports = {
    AugmentReact:       AugmentReact,
    AugmentReactPlayer: AugmentReactPlayer
};
