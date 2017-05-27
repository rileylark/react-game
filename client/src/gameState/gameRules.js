const initialGameState = {
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
        gravityDisabledForPlayerIds: [],
    }
};

const actionHandlers = {};

actionHandlers['GOAL'] = (previousState, action) => {
    return {
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
    };
}

actionHandlers['TIME'] = (previousState, action) => {
    if (previousState.mode === 'playing') {
        if (action.time > previousState.endTime) {
            if (previousState.score.blue === previousState.score.red) {
                // overtime!
                return {
                    ...previousState,
                    currentTime: action.time,
                    endTime: previousState.endTime + 30 * 1000,
                };
            } else {
                return {
                    ...previousState,
                    mode: 'gameover',
                    winner: previousState.score.blue > previousState.score.red ? 'blue' : 'red',
                    nextGameStartTime: action.time + 10 * 1000,
                    currentTime: action.time
                };
            }
        } else {
            return {
                ...previousState,
                currentTime: action.time
            }
        }
    } else {
        if (action.time > previousState.nextGameStartTime) {
            return { ...initialGameState, endTime: action.time + 60 * 1000, currentTime: action.time };
        } else {
            return {
                ...previousState,
                currentTime: action.time
            }
        }
    }
};

actionHandlers['BALL_ENTERED_GRAVITY_WELL'] = (previousState, action) => {
    if (previousState.ballAttraction.inGravityWell.playerIds.indexOf(action.playerId) === -1) {
        return {
            ...previousState,
            ballAttraction: {
                ...previousState.ballAttraction,
                inGravityWell: {
                    ...previousState.ballAttraction.inGravityWell,
                    playerIds: previousState.ballAttraction.inGravityWell.playerIds.concat([action.playerId])
                }
            }
        };
    } else {
        return previousState;
    }
}

actionHandlers['BALL_LEFT_GRAVITY_WELL'] = (previousState, action) => {
    const index = previousState.ballAttraction.inGravityWell.playerIds.indexOf(action.playerId) !== -1;

    const gravityDisabledForPlayerId = previousState.ballAttraction.gravityDisabledForPlayerId === action.playerId ? null : previousState.ballAttraction.gravityDisabledForPlayerId;
    if (index) {
        return {
            ...previousState,
            ballAttraction: {
                ...previousState.ballAttraction,
                inGravityWell: {
                    ...previousState.ballAttraction.inGravityWell,
                    playerIds: previousState.ballAttraction.inGravityWell.playerIds.slice(index, index)
                },
                gravityDisabledForPlayerId
            }
        };
    } else {
        return previousState;
    }
}

actionHandlers['BALL_DISLODGED'] = (previousState, action) => {
        return {
        ...previousState,
        ballAttraction: {
            ...previousState.ballAttraction,
            lodgedInPlayer: null,
            gravityDisabledForPlayerId: previousState.ballAttraction.lodgedInPlayer,
        }
    };
}

actionHandlers['BALL_HIT_SHIP_CENTER'] = (previousState, action) => {
    return {
        ...previousState,
        ballAttraction: {
            ...previousState.ballAttraction,
            lodgedInPlayer: action.playerId,
        }
    }
}

function step(previousState, action) {
    const handler = actionHandlers[action.eventType];
    if (handler) {
        return handler(previousState, action);
    } else {
        return previousState;
    }
}

export function createGame() {
    let currentGameState = { ...initialGameState, currentTime: Date.now(), endTime: Date.now() + 60 * 1000 };
    const listeners = [];

    function broadcast(state) {
        listeners.forEach((listener) => {
            listener(state);
        });
    }

    return {
        dispatch(event) {
            currentGameState = step(currentGameState, event);
            broadcast(currentGameState)
        },

        getCurrentState() {
            return { ...currentGameState };
        },

        addListener(newListener) {
            listeners.push(newListener);
            newListener(currentGameState);
        },

        overrideState(newState) {
            currentGameState = newState;
        }
    };
}