export default {
    walls: [
        { width: 202, height: 2, position: [0, -200] },
        { width: 202, height: 2, position: [0, 200] },
        { width: 2, height: 402, position: [-100, 0] },
        { width: 2, height: 402, position: [100, 0] },
        { width: 60, height: 2, position: [0, -50] },
        { width: 60, height: 2, position: [0, 50] },

        // top goal:
        { width: 64, height: 2, position: [0, 171]},
        { width: 2, height: 24, position: [31, 160]},
        { width: 2, height: 24, position: [-31, 160]},

        // bottom goal:
        { width: 64, height: 2, position: [0, -171]},
        { width: 2, height: 24, position: [31, -160]},
        { width: 2, height: 24, position: [-31, -160]},
    ], 
    goals: [
        { width: 60, height: 20, position: [0, 160], team: 'blue' },
        { width: 60, height: 20, position: [0, -160], team: 'red' },
    ],
    spawnLocations: {
        red: [
            [-50, 50],
            [50, 50],
            [0, 100],
        ],
        blue: [
            [-50, -50],
            [50, -50],
            [0, -100],
        ]
    }
};