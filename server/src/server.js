import { Server } from 'uws';
import { animate, addPlayer, removePlayer, renderMovingThings, renderLevel, mergeNewControls } from './game';

const framerate = 60;

const wss = new Server({ port: 3001 });
 
function onMessage(userId, messageJson) {
    try {
        const message = JSON.parse(messageJson);
        if (message.messageType === 'controlChange') {
            mergeNewControls(userId, message.controls);
        }
    } catch (e) {

    }
}
 
const connections = [];

wss.on('connection', function(ws) {
    const userId = '' + Math.random();

    const connection = {
        userId,
        ws
    };

    connections.push(connection);

    addPlayer(userId);

    ws.on('message', (messageJson) => onMessage(userId, messageJson));
    
    const initialMessage = JSON.stringify({
        messageType: 'initialSetup',
        yourId: userId,
        level: renderLevel()
    });

    ws.on('close', () => {
        removePlayer(userId);
        const indexOfConnection = connections.indexOf(connection);
        connections.splice(indexOfConnection, 1);
    });

    ws.send(initialMessage);
});

setInterval(() => animate(Date.now()), 1000/framerate);

setInterval(() => {
    const message = JSON.stringify({
        messageType: 'renderedWorld',
        ...renderMovingThings()
    });

    connections.forEach((connection) => {
        connection.ws.send(message);
    });
}, 1000/framerate
);
