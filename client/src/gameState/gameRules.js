const initialGameState = {
    mode: 'playing',
    score: {
        blue: 0,
        red: 0,
    },
};

function stepInPlayingMode(previousState, action) {
    if (action.eventType === 'GOAL') {
        return {
            ...previousState,
            score: {
                ...previousState.score,
                [action.team]: previousState.score[action.team] + 1,
            }
        }
    } else if (action.eventType === 'TIME') {
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
    }

    return previousState;
}

function stepInGameoverMode(previousState, action) {
    if (action.eventType === 'TIME') {
        if (action.time > previousState.nextGameStartTime) {
            return { ...initialGameState, endTime: action.time + 60 * 1000, currentTime: action.time };
        } else {
            return {
                ...previousState,
                currentTime: action.time
            }
        }
    } 

    return previousState;
}

function step(previousState, nextEvent) {
    if (previousState.mode === 'playing') {
        return stepInPlayingMode(previousState, nextEvent);
    } else {
        return stepInGameoverMode(previousState, nextEvent);
    }
}

export function createGame() {
    let currentGameState = { ...initialGameState, currentTime: Date.now(), endTime: Date.now() + 60 * 1000 };

    return {
        dispatch(event) {
            currentGameState = step(currentGameState, event);
        },

        getCurrentState() {
            return { ...currentGameState };
        }
    };
}