import { Server } from 'uws';
import { makeInstance } from './game';
import hockeyMap from './hockeyMap';

const physicsFramerate = 30; // Hz
const networkUpdateFramerate = 10; // Hz

const wss = new Server({ port: 3001 });
 
function onMessage(userId, messageJson) {
    try {
        const message = JSON.parse(messageJson);
        if (message.messageType === 'controlChange') {
            gameInstance.mergeNewControls(userId, message.controls);
        }

        broadcast('newControls', { playerId: userId, newControls: gameInstance.renderControls(userId) });
    } catch (e) {
        console.error("ERROR");
        console.error(e);
    }
}
 
const connections = [];
const gameInstance = makeInstance(hockeyMap);

wss.on('connection', function(ws) {
    const userId = '' + Math.random();

    const connection = {
        userId,
        ws
    };

    connections.push(connection);

    gameInstance.addPlayer(userId);

    ws.on('message', (messageJson) => onMessage(userId, messageJson));
    
    const initialMessage = JSON.stringify({
        messageType: 'initialSetup',
        yourId: userId,
        level: hockeyMap
    });

    ws.on('close', () => {
        gameInstance.removePlayer(userId);
        const indexOfConnection = connections.indexOf(connection);
        connections.splice(indexOfConnection, 1);

        broadcast('playerLeft', { playerId: userId });
    });

    ws.send(initialMessage);
});

setInterval(() => gameInstance.animate(Date.now()), 1000/physicsFramerate);

setInterval(() => {
    const message = JSON.stringify({
        messageType: 'gameState',
        gameState: gameInstance.renderGameState()
    });

    connections.forEach((connection) => {
        connection.ws.send(message);
    });
}, 1000/2);

setInterval(broadcastMovingThings, 1000/networkUpdateFramerate);

function broadcastMovingThings() {
    const message = JSON.stringify({
        messageType: 'movingThingUpdate',
        ...gameInstance.renderMovingThings()
    });

    connections.forEach((connection) => {
        connection.ws.send(message);
    });
}

function broadcast(messageType, data) {
    const message = JSON.stringify({ messageType, data });
    connections.forEach((connection) => {
        connection.ws.send(message);
    });
}