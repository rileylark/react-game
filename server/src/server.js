import { Server } from 'uws';
import { animate, renderWorld } from './game';

const wss = new Server({ port: 3001 });
 
function onMessage(message) {
    console.log('received: ' + message);
}
 
const connections = [];

wss.on('connection', function(ws) {
    connections.push(ws);
    ws.on('message', onMessage);
    ws.send('something');
});

setInterval(() => animate(Date.now()), 250);

setInterval(() => {
    const message = JSON.stringify({
        messageType: 'renderedWorld',
        world: renderWorld()
    });

    connections.forEach((connection) => {
        connection.send(message);
    });
}, 250);
