import p2 from 'p2';
import { createGame } from './gameRules';

const levelDef = {
    walls: [
        { width: 102, height: 2, position: [0, -100] },
        { width: 102, height: 2, position: [0, 100] },
        { width: 2, height: 202, position: [-50, 0] },
        { width: 2, height: 202, position: [50, 0] },
        { width: 30, height: 2, position: [0, -25] },
        { width: 30, height: 2, position: [0, 25] },

        // top goal:
        { width: 34, height: 2, position: [0, 86]},
        { width: 2, height: 14, position: [16, 80]},
        { width: 2, height: 14, position: [-16, 80]},

        // bottom goal:
        { width: 34, height: 2, position: [0, -86]},
        { width: 2, height: 14, position: [16, -80]},
        { width: 2, height: 14, position: [-16, -80]},
    ], 
    goals: [
        { width: 30, height: 10, position: [0, 80], team: 'blue' },
        { width: 30, height: 10, position: [0, -80], team: 'red' },
    ]
};



// Create a physics world, where bodies and constraints live
var world = new p2.World({
    gravity: [0, 0]
});

const game = createGame();
setInterval(() => {
    game.dispatch({
        eventType: 'TIME',
        time: Date.now()
    });
}, 1000);

const steelMaterial = new p2.Material();

const walls = levelDef.walls.map((wallDef) => {
    const shape = new p2.Box({ width: wallDef.width, height: wallDef.height, material: steelMaterial });
    const body = new p2.Body({ mass: 0, position: wallDef.position });
    body.addShape(shape);
    return { shape, body };
});

walls.forEach((wall) => { world.addBody(wall.body) });

const goals = levelDef.goals.map((goalDef) => {
    const shape = new p2.Box({ width: goalDef.width, height: goalDef.height, sensor: true });
    const body = new p2.Body({ mass: 0, position: goalDef.position });
    body.addShape(shape);

    return { shape, body, team: goalDef.team };
});

goals.forEach((goal) => { world.addBody(goal.body) });

const currentPlayers = {}; // map from player ID to player


function makePlayer(playerId ) {
    const shape = new p2.Circle({ radius: 3, material: steelMaterial });
    var body = new p2.Body({
        mass: 5,
        position: [10, 10],
        damping: 0.7
    });

    body.addShape(shape);
    return { shape, body, id: playerId, controls: {} };
}

function makeBall() {
    const shape = new p2.Circle({ radius: 2, material: steelMaterial });
    var body = new p2.Body({
        mass: 1,
        position: [0, 0],
        damping: 0.25,
    });

    body.addShape(shape);
    return { shape, body };
}

const gameBall = makeBall();
world.addBody(gameBall.body);

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
export function animate(time) {
    // Compute elapsed time since last render frame
    var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;

    // Move bodies forward in time
    world.step(fixedTimeStep, deltaTime, maxSubSteps);

    lastTime = time;
}

function renderBody(body) {
    return {
        x: body.interpolatedPosition[0],
        y: body.interpolatedPosition[1],
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
    };
}

export function addPlayer(playerId) {
    const player = makePlayer(playerId);
    currentPlayers[playerId] = player;
    world.addBody(player.body);
}

export function removePlayer(playerId) {
    const player = currentPlayers[playerId];
    world.removeBody(player.body);
    delete currentPlayers[playerId];
}

export function renderMovingThings() {
    const players = Object.keys(currentPlayers).map((playerId) => {
        const player = currentPlayers[playerId];
        return {
            ...renderBody(player.body),
            playerId,
        };
    });

    const balls = [renderBody(gameBall.body)];

    return {
        players,
        balls,
    };
}

export function renderLevel() {
    return {
        walls: walls.map(renderWall),
        goals: goals.map(renderGoal),
    };
}

export function renderGameState() {
    return game.getCurrentState();
}

const boosterForce = 200;

function applyControls(body, controls) {
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
}

world.on('postStep', () => {
    Object.keys(currentPlayers).forEach((playerId) => {
        const player = currentPlayers[playerId];
        applyControls(player.body, player.controls);
    });
});

world.on('beginContact', ({shapeA, shapeB}) => {
    const shapes = [shapeA, shapeB];
    [gameBall].forEach((ball) => {
        goals.forEach((goal) => {
            if (shapes.indexOf(ball.shape) !== -1 && shapes.indexOf(goal.shape) !== -1) {
                ball.body.position=[0,0];
                ball.body.velocity=[0,0];
                game.dispatch({
                    eventType: 'GOAL',
                    team: goal.team
                });
            }
        });
    })
});

export function mergeNewControls(playerId, newControls) {
    const player = currentPlayers[playerId];
    player.controls = {
        ...player.controls,
        ...newControls,
    };
}