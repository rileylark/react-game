import { Server } from 'uws';

const wss = new Server({ port: 3001 });
 
function onMessage(message) {
    console.log('received: ' + message);
}
 
wss.on('connection', function(ws) {
    ws.on('message', onMessage);
    ws.send('something');
});