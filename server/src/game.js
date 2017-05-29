import p2 from 'p2';
import { initialGameState, step } from './gameRules';

export function makeInstance(levelDef) {

    const collisionBitNames = [
        'RED_PLAYER',
        'RED_PLAYER_GRAVITY_WELL',
        'BLUE_PLAYER',
        'BLUE_PLAYER_GRAVITY_WELL',
        'BALL',
        'LEVEL',
        'GOALIE',
    ];

    const collisionBits = {};
    collisionBitNames.forEach((name, index) => {
        collisionBits[name] = Math.pow(2, index);
    });

    const maxSecondsOfBoost = 1;
    const shotImpulse = 50;

    function makeCollisionMask(collisionBitNames) {
        return collisionBitNames.reduce((mask, name) => mask | collisionBits[name], 0);
    }

    // Create a physics world, where bodies and constraints live
    var world = new p2.World({
        gravity: [0, 0]
    });

    const steelMaterial = new p2.Material();

    setInterval(() => {
        dispatch({
            eventType: 'TIME',
            time: Date.now()
        });
    }, 1000);

    let currentGameState = { ...initialGameState, currentTime: Date.now(), endTime: Date.now() + 60 * 1000 };

    let currentBallLodgeConstraint = {
        playerId: null,
        p2Constraint: null,
    };

    const currentPlayers = {}; // map from player ID to player

    const gameBall = makeBall();
    world.addBody(gameBall.body);

    const currentGoalies = makeGoalies(levelDef.goals);

    function dispatch(action) {
        const [newState, pendingEffects] = step(currentGameState, action);

        currentGameState = newState;
        const currentLodgedPlayerId = currentGameState.ballAttraction.lodgedInPlayer;

        if (currentLodgedPlayerId !== currentBallLodgeConstraint.playerId) {
            // we need to change the constraint situation
            if (currentBallLodgeConstraint.p2Constraint) {
                world.removeConstraint(currentBallLodgeConstraint.p2Constraint);
                currentBallLodgeConstraint = {
                    playerId: null,
                    p2Constraint: null,
                };
            }

            // and possibly add a new one!
            if (currentLodgedPlayerId) {
                const newP2Constraint = new p2.DistanceConstraint(gameBall.body, currentPlayers[currentLodgedPlayerId].body, { distance: 0, maxForce: 750 });
                gameBall.body.position = [...currentPlayers[currentLodgedPlayerId].body.position];
                gameBall.body.velocity = [...currentPlayers[currentLodgedPlayerId].body.velocity];
                world.addConstraint(newP2Constraint);

                currentBallLodgeConstraint = {
                    playerId: currentLodgedPlayerId,
                    p2Constraint: newP2Constraint,
                };
            }
        }

        pendingEffects.forEach(doEffect);
    }

    function doEffect(effect) {
        if (effect.effectType === 'SEND_FORWARD') {
            sendGameBall(effect.fromPlayerId, [0, 1]);
        } else if (effect.effectType === 'SEND_LEFT') {
            sendGameBall(effect.fromPlayerId, [-1, 0]);
        } else if (effect.effectType === 'SEND_BACKWARD') {
            sendGameBall(effect.fromPlayerId, [0, -1]);
        } else if (effect.effectType === 'SEND_RIGHT') {
            sendGameBall(effect.fromPlayerId, [1, 0]);
        }
    }

    function sendGameBall(fromPlayerId, directionUnitVector) {
        const player = currentPlayers[fromPlayerId];
        gameBall.body.position = [...player.body.position];
        gameBall.body.velocity = [...player.body.velocity];


        const ballImpulse = [];
        p2.vec2.rotate(ballImpulse, directionUnitVector, player.body.angle);
        p2.vec2.scale(ballImpulse, ballImpulse, shotImpulse);

        const shipImpulse = [];
        p2.vec2.scale(shipImpulse, ballImpulse, -1);

        gameBall.body.applyImpulse(ballImpulse);
        player.body.applyImpulse(shipImpulse);
    }

    const walls = levelDef.walls.map((wallDef) => {
        const shape = new p2.Box({
            width: wallDef.width,
            height: wallDef.height,
            material: steelMaterial,
            collisionGroup: collisionBits['LEVEL'],
            collisionMask: makeCollisionMask(['BLUE_PLAYER', 'RED_PLAYER', 'BALL'])
        });

        const body = new p2.Body({ mass: 0, position: wallDef.position });
        body.addShape(shape);
        return { shape, body };
    });

    walls.forEach((wall) => { world.addBody(wall.body) });

    const goals = levelDef.goals.map((goalDef) => {
        const shape = new p2.Box({
            width: goalDef.width,
            height: goalDef.height,
            sensor: true,
            collisionGroup: collisionBits['LEVEL'],
            collisionMask: makeCollisionMask(['BLUE_PLAYER', 'RED_PLAYER', 'BALL'])
        });

        const body = new p2.Body({ mass: 0, position: goalDef.position });
        body.addShape(shape);

        return {
            shape,
            body,
            team: goalDef.team,
            goalieLines: goalDef.goalieLines,
        };
    });

    goals.forEach((goal) => { world.addBody(goal.body) });

    function getTeamCounts() {
        const [redCount, blueCount] = Object.keys(currentPlayers).reduce(([redCount, blueCount], playerId) => {
            const team = currentPlayers[playerId].team;

            if (team === 'red') {
                return [redCount + 1, blueCount];
            } else if (team === 'blue') {
                return [redCount, blueCount + 1];
            } else {
                return [redCount, blueCount];
            }

        }, [0, 0]);

        return {
            red: redCount, blue: blueCount
        };

    }

    function makePlayer(playerId) {
        const teamCounts = getTeamCounts();
        const team = teamCounts.red > teamCounts.blue ? 'blue' : 'red';
        const spawnLocation = levelDef.spawnLocations[team][teamCounts[team] % levelDef.spawnLocations[team].length];

        const shape = new p2.Circle({ radius: 3, material: steelMaterial });
        const gravityWellShape = new p2.Circle({
            radius: 6,
            sensor: true,
            collisionMask: makeCollisionMask(['BALL']),
        });

        if (team === 'blue') {
            shape.collisionGroup = collisionBits['BLUE_PLAYER'];
            shape.collisionMask = makeCollisionMask(['RED_PLAYER', 'LEVEL', 'GOALIE']);
            gravityWellShape.collisionGroup = collisionBits['BLUE_PLAYER_GRAVITY_WELL'];

        } else if (team === 'red') {
            shape.collisionGroup = collisionBits['RED_PLAYER'];
            shape.collisionMask = makeCollisionMask(['BLUE_PLAYER', 'LEVEL', 'GOALIE']);
            gravityWellShape.collisionGroup = collisionBits['RED_PLAYER_GRAVITY_WELL'];
        }

        var body = new p2.Body({
            mass: 5,
            position: spawnLocation,
            damping: 0.7,
            angle: team === 'red' ? Math.PI : 0,
        });

        body.addShape(shape);
        body.addShape(gravityWellShape);

        return {
            shape,
            body,
            gravityWellShape,
            id: playerId,
            controls: {},
            team: team,
            secondsOfBoostLeft: maxSecondsOfBoost,
        };
    }

    function makeBall() {
        const shape = new p2.Circle({
            radius: 2,
            material: steelMaterial,
            collisionGroup: collisionBits['BALL'],
            collisionMask: makeCollisionMask(['BLUE_PLAYER', 'RED_PLAYER', 'LEVEL', 'BLUE_PLAYER_GRAVITY_WELL', 'RED_PLAYER_GRAVITY_WELL', 'GOALIE']),
        });

        var body = new p2.Body({
            mass: 1,
            position: [0, 0],
            damping: 0.25,
        });

        body.addShape(shape);
        return { shape, body };
    }

    function makeGoalies(goals) {
        const goalies = {};

        goals.forEach((goal) => {
            goal.goalieLines.forEach((goalieLine) => {

                const shape = new p2.Circle({
                    radius: 5,
                    material: steelMaterial,
                    collisionGroup: collisionBits['GOALIE'],
                    collisionMask: makeCollisionMask(['BALL', 'RED_PLAYER', 'BLUE_PLAYER'])
                });

                var body = new p2.Body({
                    mass: 0,
                    position: goalieLine.initialGoaliePosition
                });

                body.addShape(shape);
                world.addBody(body);

                goalies[goalieLine.goalieId] = {
                    body,
                    shape,
                    goalieLine,
                    goalieId: goalieLine.goalieId,
                };
            });
        });

        return goalies;
    }

    // Create contact material between the two materials.
    // The ContactMaterial defines what happens when the two materials meet.
    // In this case, we use some restitution.
    world.addContactMaterial(new p2.ContactMaterial(steelMaterial, steelMaterial, {
        restitution: 1,
        stiffness: Number.MAX_VALUE // We need infinite stiffness to get exact restitution
    }));

    // To animate the bodies, we must step the world forward in time, using a fixed time step size.
    // The World will run substeps and interpolate automatically for us, to get smooth animation.
    var fixedTimeStep = 1 / 60; // seconds
    var maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    var lastTime;

    // Animation loop
    function animate(time) {
        // Compute elapsed time since last render frame
        var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;

        // Move bodies forward in time
        world.step(fixedTimeStep, deltaTime, maxSubSteps);

        // reduce boost
        Object.keys(currentPlayers).forEach((playerId) => {
            const player = currentPlayers[playerId];
            if (player.controls.boost && player.secondsOfBoostLeft > 0) {
                player.secondsOfBoostLeft -= deltaTime;
            }
        });

        // increase boost
        Object.keys(currentPlayers).forEach((playerId) => {
            const player = currentPlayers[playerId];
            if (!player.controls.boost) {
                player.secondsOfBoostLeft = Math.min(player.secondsOfBoostLeft + deltaTime / 6, maxSecondsOfBoost);
            }
        });

        lastTime = time;
    }

    function renderBody(body) {
        return {
            position: [body.interpolatedPosition[0], body.interpolatedPosition[1]],
            velocity: [body.velocity[0], body.velocity[1]],
            angle: body.angle,
        }
    }

    function renderWall(wall) {
        return {
            x: wall.body.position[0],
            y: wall.body.position[1],
            width: wall.shape.width,
            height: wall.shape.height,
        }
    }

    function renderGoal(goal) {
        return {
            x: goal.body.position[0],
            y: goal.body.position[1],
            width: goal.shape.width,
            height: goal.shape.height,
            team: goal.team,
            goalieLines: goal.goalieLines
        };
    }

    function addPlayer(playerId) {
        const player = makePlayer(playerId);
        currentPlayers[playerId] = player;
        world.addBody(player.body);

        dispatch({
            eventType: 'ADD_PLAYER',
            playerId
        });
    }

    function removePlayer(playerId) {
        const player = currentPlayers[playerId];
        world.removeBody(player.body);
        delete currentPlayers[playerId];

        dispatch({
            eventType: 'REMOVE_PLAYER',
            playerId
        });
    }

    function renderMovingThings() {
        const players = Object.keys(currentPlayers).map((playerId) => {
            const player = currentPlayers[playerId];
            return {
                body: renderBody(player.body),
                team: player.team,
                playerId,
                percentBoostLeft: player.secondsOfBoostLeft / maxSecondsOfBoost,
                controls: player.controls,
            };
        });

        const ball = {
            body: renderBody(gameBall.body)
        };

        const goalies = Object.keys(currentGoalies).map((goalieId) => {
            const goalie = currentGoalies[goalieId];

            return {
                body: renderBody(goalie.body),
                goalieId
            };
        });

        return {
            players,
            ball,
            goalies,
        };
    }

    function avg(vec1, vec2, bias) {
        return [(vec1[0] * bias + vec2[0] * (1 - bias)), (vec1[1] * bias + vec2[1] * (1 - bias))];
    }

    function applyAuthorativeGameStateUpdate(newGameState) {
        currentGameState = newGameState;
    }

    function applyAuthorativeMovingThingUpdate(update) {
        // first apply players
        update.players.forEach((remotePlayer) => {
            // copy remote player to local player
            let localPlayer = currentPlayers[remotePlayer.playerId];

            if (!localPlayer) {
                addPlayer(remotePlayer.playerId);
                localPlayer = currentPlayers[remotePlayer.playerId];
            }

            localPlayer.body.position = avg(remotePlayer.body.position, localPlayer.body.position, 0.3);
            localPlayer.body.velocity = remotePlayer.body.velocity;
            localPlayer.body.angle = remotePlayer.body.angle;
            localPlayer.controls = remotePlayer.controls;
            localPlayer.secondsOfBoostLeft = remotePlayer.percentBoostLeft * maxSecondsOfBoost;
            localPlayer.team = remotePlayer.team;
        });

        // then apply ball
        gameBall.body.position = avg(update.ball.body.position, gameBall.body.position, 0.3);
        gameBall.body.angle = update.ball.body.angle;
        gameBall.body.velocity = update.ball.body.velocity;

        // also goalies!
        update.goalies.forEach((remoteGoalie) => {
            let localGoalie = currentGoalies[remoteGoalie.goalieId];
            localGoalie.body.position = avg(remoteGoalie.body.position, localGoalie.body.position, 0.3);
            localGoalie.body.velocity = remoteGoalie.body.velocity;
            localGoalie.body.angle = remoteGoalie.body.angle;
        });
    }

    function renderLevel() {
        return {
            walls: walls.map(renderWall),
            goals: goals.map(renderGoal),
        };
    }

    function renderGameState() {
        return currentGameState;
    }

    const boosterForce = 200;

    function applyControls(player) {
        const { body, controls } = player;

        if (controls.up) {
            body.applyForceLocal([0, boosterForce]);
        }

        body.angularVelocity = 0;
        if (controls.left) {
            body.angularVelocity += 4;
        }

        if (controls.right) {
            body.angularVelocity -= 4;
        }

        if (controls.down) {
            body.applyForceLocal([0, -boosterForce]);
        }

        if (controls.boost && player.secondsOfBoostLeft > 0) {
            body.applyForceLocal([0, boosterForce]);
        }
    }

    // apply controls
    world.on('postStep', () => {
        Object.keys(currentPlayers).forEach((playerId) => {
            const player = currentPlayers[playerId];
            applyControls(player);
        });
    });

    // move goalies
    world.on('postStep', () => {
        Object.keys(currentGoalies).forEach((goalieId) => {
            const goalie = currentGoalies[goalieId];

            // first find where the ball is going on our goalie line
            const eventualPositionOfBall = [];
            p2.vec2.add(eventualPositionOfBall, gameBall.body.position, gameBall.body.velocity);

            const intersectionPoint = [];
            const intersects = p2.vec2.getLineSegmentsIntersection(intersectionPoint, goalie.goalieLine.start, goalie.goalieLine.end, gameBall.body.position, eventualPositionOfBall)

            if (intersects) {
                // move goalie towards that point!
                const directionToPoint = [];
                p2.vec2.subtract(directionToPoint, intersectionPoint, goalie.body.position);

                p2.vec2.normalize(directionToPoint, directionToPoint);
                p2.vec2.scale(directionToPoint, directionToPoint, 20);

                // TODO: if this would move the goalie past the point of intersection... well, don't!

                goalie.body.velocity = directionToPoint;
            } else {
                goalie.body.velocity = [0, 0];
            }
        });
    });

    // apply ball attraction
    world.on('postStep', () => {

        if (!!currentGameState.ballAttraction.lodgedInPlayer) {
            // If it's lodged in any player then we don't apply any gravity
            return;
        }

        const ballBody = gameBall.body;
        currentGameState.ballAttraction.inGravityWell.playerIds.forEach((playerId) => {
            if (currentGameState.ballAttraction.gravityDisabledForPlayerId === playerId) {
                return;
            }

            const playerBody = currentPlayers[playerId].body;

            const d2 = p2.vec2.squaredDistance(playerBody.position, ballBody.position);

            if (d2 > 16) {
                const forceMagnitude = 5000 / d2;

                const force = [];
                p2.vec2.subtract(force, playerBody.position, ballBody.position);
                p2.vec2.normalize(force, force);
                p2.vec2.scale(force, force, forceMagnitude);

                ballBody.applyForce(force);
                p2.vec2.scale(force, force, -1);
                playerBody.applyForce(force);
            } else {
                dispatch({
                    eventType: 'BALL_HIT_SHIP_CENTER',
                    playerId: playerId,
                });
            }
        });
    });

    // look for player bumps to dislodge balls
    world.on('beginContact', ({ shapeA, shapeB }) => {
        if (currentGameState.ballAttraction.lodgedInPlayer) {
            // the ball is lodged. Did we hit that player?
            const lodgedPlayer = currentPlayers[currentGameState.ballAttraction.lodgedInPlayer];
            if (shapeA === lodgedPlayer.shape || shapeB === lodgedPlayer.shape) {

                //is the thing that hit this player... another player?
                // Note: same-team players will not show up here because of collision masks
                forEachPlayer((anotherPlayer) => {
                    if (anotherPlayer.id !== lodgedPlayer.id) {
                        if (shapeA === anotherPlayer.shape || shapeB === anotherPlayer.shape) {
                            dispatch({
                                eventType: 'BALL_DISLODGED'
                            });
                        }
                    }

                })
            }

        }
    });

    function forEachPlayer(cb) {
        Object.keys(currentPlayers).forEach((playerId) => {
            cb(currentPlayers[playerId]);
        });
    }

    world.on('beginContact', ({ shapeA, shapeB }) => {
        const shapes = [shapeA, shapeB];
        [gameBall].forEach((ball) => {
            if (shapes.indexOf(ball.shape) === -1) {
                return;
            }

            // detect goals
            goals.forEach((goal) => {
                if (shapes.indexOf(goal.shape) !== -1) {
                    ball.body.position = [0, 0];
                    ball.body.velocity = [0, 0];
                    dispatch({
                        eventType: 'GOAL',
                        team: goal.team
                    });
                }
            });

            // detect gravityWells
            Object.keys(currentPlayers).forEach((playerId) => {
                const player = currentPlayers[playerId];
                if (shapes.indexOf(player.gravityWellShape) !== -1) {
                    dispatch({
                        eventType: 'BALL_ENTERED_GRAVITY_WELL',
                        team: player.team,
                        playerId: player.id
                    });
                }
            });
        })
    });

    world.on('endContact', ({ shapeA, shapeB }) => {
        const shapes = [shapeA, shapeB];
        [gameBall].forEach((ball) => {
            if (shapes.indexOf(ball.shape) === -1) {
                return;
            }

            // detect gravityWells
            Object.keys(currentPlayers).forEach((playerId) => {
                const player = currentPlayers[playerId];
                if (shapes.indexOf(player.gravityWellShape) !== -1) {
                    dispatch({
                        eventType: 'BALL_LEFT_GRAVITY_WELL',
                        team: player.team,
                        playerId: player.id
                    });
                }
            });
        })
    });

    function renderControls(playerId) {
        return currentPlayers[playerId].controls;
    }

    function mergeNewControls(playerId, newControls) {
        const player = currentPlayers[playerId];
        player.controls = {
            ...player.controls,
            ...newControls,
        };

        dispatch({
            eventType: 'CONTROL_CHANGE',
            playerId: playerId,
            controlUpdate: newControls,
        });
    }

    return {
        animate,
        addPlayer,
        applyAuthorativeMovingThingUpdate,
        applyAuthorativeGameStateUpdate,
        removePlayer,
        renderControls,
        renderMovingThings,
        renderGameState,
        renderLevel,
        mergeNewControls
    };
}