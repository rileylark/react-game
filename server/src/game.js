import p2 from 'p2';

// Create a physics world, where bodies and constraints live
var world = new p2.World({
    gravity:[0, -9.82]
});

// Create an empty dynamic body
var circleBody = new p2.Body({
    mass: 5,
    position: [10, 10]
});

// Add a circle shape to the body
var circleShape = new p2.Circle({ radius: 1 });
circleBody.addShape(circleShape);

// ...and add the body to the world.
// If we don't add it to the world, it won't be simulated.
world.addBody(circleBody);

// Create an infinite ground plane body
var groundBody = new p2.Body({
    mass: 0 // Setting mass to 0 makes it static
});
var groundShape = new p2.Plane();
groundBody.addShape(groundShape);
world.addBody(groundBody);

// To animate the bodies, we must step the world forward in time, using a fixed time step size.
// The World will run substeps and interpolate automatically for us, to get smooth animation.
var fixedTimeStep = 1 / 60; // seconds
var maxSubSteps = 10; // Max sub steps to catch up with the wall clock
var lastTime;

// Animation loop
export function animate(time){
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
    }
}

export function renderWorld() {
    return {
        ball: renderBody(circleBody)
    }
}

let currentControls = {
    up: false
};

const boosterForce = 200;
world.on('postStep', () => {
    if (currentControls.up) {
        circleBody.applyForceLocal([0, boosterForce]);
    }
});

export function mergeNewControls(newControls) {
    currentControls = {
        ...currentControls,
        ...newControls,
    };
}