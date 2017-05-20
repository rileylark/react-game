import p2 from 'p2';

const levelDef = {
    walls: [
        { width: 102, height: 10, position: [0, -50] },
        { width: 102, height: 10, position: [0, 50] },
        { width: 10, height: 102, position: [-50, 0] },
        { width: 10, height: 102, position: [50, 0] },
    ]
};



// Create a physics world, where bodies and constraints live
var world = new p2.World({
    gravity: [0, 0]
});


// Create an empty dynamic body
var circleBody = new p2.Body({
    mass: 5,
    position: [10, 10]
});

const steelMaterial = new p2.Material();

// Add a circle shape to the body
var circleShape = new p2.Circle({ radius: 5, material: steelMaterial });
circleBody.addShape(circleShape);

// ...and add the body to the world.
// If we don't add it to the world, it won't be simulated.
world.addBody(circleBody);

// Create an infinite ground plane body

const walls = levelDef.walls.map((wallDef) => {
    const shape = new p2.Box({ width: wallDef.width, height: wallDef.height, material: steelMaterial });
    const body = new p2.Body({ mass: 0, position: wallDef.position });
    body.addShape(shape);
    return { shape, body };
});

walls.forEach((wall) => { world.addBody(wall.body) });

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
    // console.log("Animating !");
    // console.log(circleBody.interpolatedPosition);

    // Compute elapsed time since last render frame
    var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;

    // Move bodies forward in time
    world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // Render the circle at the current interpolated position
    // renderCircleAtPosition(circleBody.interpolatedPosition);
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
export function renderWorld() {
    return {
        ball: renderBody(circleBody)
    }
}

export function renderLevel() {
    return {
        walls: walls.map(renderWall)
    };
}

let currentControls = {
    up: false
};

const boosterForce = 200;

world.on('postStep', () => {
    if (currentControls.up) {
        circleBody.applyForceLocal([0, boosterForce]);
    }

    circleBody.angularVelocity = 0;
    if (currentControls.left) {
        circleBody.angularVelocity += 4;
    }

    if (currentControls.right) {
        circleBody.angularVelocity -= 4;
    }

    if (currentControls.down) {
        circleBody.applyForceLocal([0, -boosterForce]);
    }
});

export function mergeNewControls(newControls) {
    currentControls = {
        ...currentControls,
        ...newControls,
    };

    console.log("new controls");
    console.log(currentControls);
}