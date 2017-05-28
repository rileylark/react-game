const initialModeAndScore = {
    mode: 'playing',
    score: {
        blue: 0,
        red: 0,
    }
};

export const initialGameState = {
    ...initialModeAndScore,
    ballAttraction: {
        inGravityWell: {
            playerIds: []
        },
        lodgedInPlayer: null,
    },
    currentPlayers: {}
};

const actionHandlers = {};

actionHandlers['GOAL'] = (previousState, action) => {
    return [{
        ...previousState,
        score: {
            ...previousState.score,
            [action.team]: previousState.score[action.team] + 1,
        },
        ballAttraction: {
            ...previousState.ballAttraction,
            lodgedInPlayer: null,
            gravityDisabledForPlayerId: null,
        }
    }, []];
}

actionHandlers['ADD_PLAYER'] = (previousState, action) => {
    return [{
        ...previousState,
        currentPlayers: {
            ...previousState.currentPlayers,
            [action.playerId]: {
                controls: {}
            }
        }
    }, []];
}

actionHandlers['REMOVE_PLAYER'] = (previousState, action) => {
    const newPlayerThing = { ...previousState.currentPlayers };
    delete newPlayerThing[action.playerId];

    return [{
        ...previousState,
        currentPlayers: newPlayerThing,
        ballAttraction: removePlayerFromBallAttraction(previousState.ballAttraction, action.playerId),
    }, []];
}

function removePlayerFromBallAttraction(ballAttraction, playerId) {
    let gravityWellIds = ballAttraction.inGravityWell.playerIds;
    const playerIndex = gravityWellIds.indexOf(playerId);
    if (playerIndex !== -1) {
        gravityWellIds = gravityWellIds.slice(playerIndex, playerIndex);
    }

    const lodgedInPlayer = ballAttraction.lodgedInPlayer === playerId ? null : ballAttraction.lodgedInPlayer;

    return {
        inGravityWell: {
            playerIds: gravityWellIds,
        },
        lodgedInPlayer
    };
}


function checkForBallSends(state) {
    // does anyone have the ball?
    if (state.ballAttraction.lodgedInPlayer) {
        const lodgedInPlayer = state.currentPlayers[state.ballAttraction.lodgedInPlayer];

        // are they trying to shoot it?
        if (lodgedInPlayer.controls.sendForward) {
            return [
                dislodgeBall(state),
                [{
                    effectType: 'SEND_FORWARD',
                    fromPlayerId: state.ballAttraction.lodgedInPlayer
                }]
            ]
        }
    }

    // nothing interesting, just return default
    return [
        state,
        []
    ];
}

actionHandlers['CONTROL_CHANGE'] = (previousState, action) => {
    let player = { ...previousState.currentPlayers[action.playerId] };

    player = {
        ...player,
        controls: {
            ...player.controls,
            ...action.controlUpdate,
        }
    };

    let newState = {
        ...previousState,
        currentPlayers: {
            ...previousState.currentPlayers,
            [action.playerId]: player
        }
    };

    return checkForBallSends(newState);
}

actionHandlers['TIME'] = (previousState, action) => {
    if (previousState.mode === 'playing') {
        if (action.time > previousState.endTime) {
            if (previousState.score.blue === previousState.score.red) {
                // overtime!
                return [{
                    ...previousState,
                    currentTime: action.time,
                    endTime: previousState.endTime + 30 * 1000,
                }, []];
            } else {
                return [{
                    ...previousState,
                    mode: 'gameover',
                    winner: previousState.score.blue > previousState.score.red ? 'blue' : 'red',
                    nextGameStartTime: action.time + 10 * 1000,
                    currentTime: action.time
                }, []];
            }
        } else {
            return [{
                ...previousState,
                currentTime: action.time
            }, []];
        }
    } else {
        if (action.time > previousState.nextGameStartTime) {
            return [{ ...previousState, ...initialModeAndScore, endTime: action.time + 60 * 1000, currentTime: action.time }, []];
        } else {
            return [{
                ...previousState,
                currentTime: action.time
            }, []]
        }
    }
};

actionHandlers['BALL_ENTERED_GRAVITY_WELL'] = (previousState, action) => {
    if (previousState.ballAttraction.inGravityWell.playerIds.indexOf(action.playerId) === -1) {
        return [{
            ...previousState,
            ballAttraction: {
                ...previousState.ballAttraction,
                inGravityWell: {
                    ...previousState.ballAttraction.inGravityWell,
                    playerIds: previousState.ballAttraction.inGravityWell.playerIds.concat([action.playerId])
                }
            }
        }, []];
    } else {
        return [previousState, []];
    }
}

actionHandlers['BALL_LEFT_GRAVITY_WELL'] = (previousState, action) => {
    const index = previousState.ballAttraction.inGravityWell.playerIds.indexOf(action.playerId) !== -1;

    const gravityDisabledForPlayerId = previousState.ballAttraction.gravityDisabledForPlayerId === action.playerId ? null : previousState.ballAttraction.gravityDisabledForPlayerId;
    if (index) {
        return [{
            ...previousState,
            ballAttraction: {
                ...previousState.ballAttraction,
                inGravityWell: {
                    ...previousState.ballAttraction.inGravityWell,
                    playerIds: previousState.ballAttraction.inGravityWell.playerIds.slice(index, index)
                },
                gravityDisabledForPlayerId
            }
        }, []];
    } else {
        return [previousState, []];
    }
}

function dislodgeBall(previousState) {
    return {
        ...previousState,
        ballAttraction: {
            ...previousState.ballAttraction,
            lodgedInPlayer: null,
            gravityDisabledForPlayerId: previousState.ballAttraction.lodgedInPlayer,
        }
    };
}

actionHandlers['BALL_DISLODGED'] = (previousState, action) => {
    return [
        dislodgeBall(previousState), // action doesn't have extra data
        []
    ];
};

actionHandlers['BALL_HIT_SHIP_CENTER'] = (previousState, action) => {
    return [{
        ...previousState,
        ballAttraction: {
            ...previousState.ballAttraction,
            lodgedInPlayer: action.playerId,
        }
    }, []];
}

export function step(previousState, action) {
    const handler = actionHandlers[action.eventType];
    if (handler) {
        return handler(previousState, action);
    } else {
        return [previousState, []];
    }
}