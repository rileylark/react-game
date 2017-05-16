import { Server } from 'uws';
import { animate, renderWorld, pushUp } from './game';

const wss = new Server({ port: 3001 });
 
function onMessage(messageJson) {
    try {
        const message = JSON.parse(messageJson);
        if (message.messageType === 'pushUp') {
            pushUp();
        }
    } catch (e) {

    }
}
 
const connections = [];

wss.on('connection', function(ws) {
    connections.push(ws);
    ws.on('message', onMessage);
});

setInterval(() => animate(Date.now()), 1000/30);

setInterval(() => {
    const message = JSON.stringify({
        messageType: 'renderedWorld',
        world: renderWorld()
    });

    connections.forEach((connection) => {
        connection.send(message);
    });
}, 1000/30);
