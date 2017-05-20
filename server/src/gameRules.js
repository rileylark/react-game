const initialGameState = {
    mode: 'playing',
    score: {
        blue: 0,
        red: 0,
    },
};


function step(previousState, nextEvent) {
    if (nextEvent.eventType === 'GOAL') {
        return {
            ...previousState,
            score: {
                ...previousState.score,
                [nextEvent.team]: previousState.score[nextEvent.team] + 1,
            }
        }
    } else if (nextEvent.eventType === 'TIME') {
        if (previousState.mode === 'playing') {

            if (nextEvent.time > previousState.endTime) {
                if (previousState.score.blue === previousState.score.red) {
                    // overtime!
                    return {
                        ...previousState,
                        currentTime: nextEvent.time,
                        endTime: previousState.endTime + 30 * 1000,
                    };
                } else {
                    return {
                        mode: 'gameover',
                        winner: previousState.score.blue > previousState.score.red ? 'blue' : 'red',
                        nextGameStartTime: nextEvent.time + 10 * 1000,
                        currentTime: nextEvent.time
                    };
                }
            } else {
                return {
                    ...previousState,
                    currentTime: nextEvent.time
                }
            }
        } else if (previousState.mode === 'gameover') {
            if (nextEvent.time > previousState.nextGameStartTime) {
                return { ...initialGameState, endTime: nextEvent.time + 60 * 1000, currentTime: nextEvent.time };
            } else {
                return { 
                    ...previousState,
                    currentTime: nextEvent.time
                }
            }
        }
    } else {
        throw new Error("Unknown event type " + JSON.stringify(nextEvent));
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