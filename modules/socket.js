module.exports.emitSocketMessage = (message, eventType) => {
    //event type will be used later for a different purpose probably
    //dont need it right now but i want to leave it in the rest of the code for later
    websocketServer.emit('earnings', message);
};