export const initialGameState = {
    mode: 'playing',
    score: {
        blue: 0,
        red: 0,
    },
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
        currentPlayers: newPlayerThing
    }, []];
}

actionHandlers['CONTROL_CHANGE'] = (previousState, action) => {
    let player = { ...previousState.currentPlayers[action.playerId] };
    if (!player.controls) {
        console.error("WHAT THE HELL");
        console.error(action);
        console.error(player);
        console.error(previousState.currentPlayers);
    }

    const shouldSendForward = !player.controls.sendForward && action.controlUpdate.sendForward && previousState.ballAttraction.lodgedInPlayer === action.playerId;

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

    if (shouldSendForward) {
        newState = dislodgeBall(newState);
    }

    return [ newState, [] ];
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
            return [{ ...initialGameState, endTime: action.time + 60 * 1000, currentTime: action.time }, []];
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
        return [ previousState, []];
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