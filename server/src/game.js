import p2 from 'p2';

const levelDef = {
    walls: [
        { width: 102, height: 10, position: [0, -50] },
        { width: 102, height: 10, position: [0, 50] },
        { width: 10, height: 102, position: [-50, 0] },
        { width: 10, height: 102, position: [50, 0] },
        { width: 5, height: 30, position: [-25, 0] },
        { width: 5, height: 30, position: [25, 0] },
    ]
};



// Create a physics world, where bodies and constraints live
var world = new p2.World({
    gravity: [0, 0]
});

const steelMaterial = new p2.Material();

const walls = levelDef.walls.map((wallDef) => {
    const shape = new p2.Box({ width: wallDef.width, height: wallDef.height, material: steelMaterial });
    const body = new p2.Body({ mass: 0, position: wallDef.position });
    body.addShape(shape);
    return { shape, body };
});

walls.forEach((wall) => { world.addBody(wall.body) });

const currentPlayers = {}; // map from player ID to player

function makePlayer(playerId ) {
    const shape = new p2.Circle({ radius: 5, material: steelMaterial });
    var body = new p2.Body({
        mass: 5,
        position: [10, 10]
    });

    body.addShape(shape);
    return { shape, body, id: playerId, controls: {} };
}

function makeBall() {
    const shape = new p2.Circle({ radius: 2, material: steelMaterial });
    var body = new p2.Body({
        mass: 1,
        position: [0, 0],
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
        balls
    };
}

export function renderLevel() {
    return {
        walls: walls.map(renderWall)
    };
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

export function mergeNewControls(playerId, newControls) {
    const player = currentPlayers[playerId];
    player.controls = {
        ...player.controls,
        ...newControls,
    };
}