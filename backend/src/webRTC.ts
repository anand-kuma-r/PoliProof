// websocketHandler.js
import { WebSocket, Server, Data } from 'ws';
import { TwoWayMap } from './customClasses';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

const tokenConnectionMap = new Map<string, WebSocket>(); 
const connectionTokenMap = new Map<WebSocket, string>();
const tokenConnections = new TwoWayMap<string>();
const connectionMap = new TwoWayMap<WebSocket>();

/*
 * How our connection system works (server side):
 * 1. Client A wants to find a match (handled by express server)
 * 2. Client A is matched with Client B, and is given a token (express response)
 * 3. Client A sends a websocket connection requrest with the token, so its connection request is mapped to the game
 * 4. Client B sends a websocket connection request with the token, so its connection request is mapped to the game
 * 5. Every time Client A / Client B sends a message to the server, the server sends the message to Client B / Client A
 * 6. When Client A / Client B disconnects, the server closes the connection, and deletes the connection entries from the tables.
 *
*/

/*
 * Current implemented flow:
 * 1. Client A and Client B must first send "/joinMatchmaking" POST request to join queue
 * 2. Client A and Client B must then send "/getToken" GET request to receive tokens, should be sent around every 1 second to stay valid
 * 3. Once Clients A and B receive a token, they then send a "/leaveMatchmaking" DELETE request to leave queue
 * 4. Once Clients A and B receive a token, they then initiate a websocket request with the token as a url parameter
 * 5. If it is a valid token, the server will either send a status "CONNECTION VALID" or "CONNECTION WAITING". If in connection waiting, 
 *    wait for the other client to join (when status "CONNECTION VALID" sent)
 * 6. Once one end tears down, close connections on one end or trigger endpoint for endGame to tear it down
*/

// Once both ends of the token connection are established, we can initiate the connection on the connectionMap
function initiateConnection(token1 : string, token2 : string) : boolean {
    try {
        const ws1 = tokenConnectionMap.get(token1);
        const ws2 = tokenConnectionMap.get(token2);
        if (!ws1 || !ws2) {
            console.error('One of the tokens is not connected');
            return false;
        }
        connectionMap.set(ws1, ws2);
        ws1.send(JSON.stringify({ status: "CONNECTION VALID" }));
        ws2.send(JSON.stringify({ status: "CONNECTION VALID" }));
        return true;
    } catch (error) {
        const ws1 = tokenConnectionMap.get(token1);
        const ws2 = tokenConnectionMap.get(token2);
        console.error('Failed to initiate connection', error);
        if (ws1) {
            connectionMap.remove(ws1);
        }
        if (ws2) {
            connectionMap.remove(ws2);
        }
        return false;
    }
}


/**
 * Generates a pair of tokens that are associated with each other in the token connection map
 * 
 * @returns A pair of tokens that are associated with each other
 */
function generateGame() : [ string, string ] {
    try {
        let token1 = uuidv4();
        let token2 = uuidv4();
        while ( tokenConnectionMap.has(token1) || tokenConnectionMap.has(token2) ) {
            token1 = uuidv4();
            token2 = uuidv4();
        }
        tokenConnections.set(token1, token2);
        return [ token1, token2 ];
    } catch (error) {
        console.error('Failed to generate game', error);
        return [ '', '' ];
    }
}

async function tearDown(token : string) {
    const mySocket = tokenConnectionMap.get(token);
    if (!mySocket) {
        console.error('Token is not connected to user');
        return false;
    }

    // First, get the paired token for the game
    const pairToken  = tokenConnections.get(token);
    mySocket.send(JSON.stringify({ message: "Game ended, connection will be closed" }), () => {
        mySocket.close();
    });
    tokenConnectionMap.delete(token);
    connectionTokenMap.delete(mySocket);


    // If there is an associated game, end the connections associated with the game
    if (pairToken) {
        const pairSocket = tokenConnectionMap.get(pairToken);
        if (pairSocket){
            pairSocket.send(JSON.stringify({ message: "Game ended, connection will be closed" }), () => {
                pairSocket.close();
            });
            tokenConnectionMap.delete(pairToken);
            connectionMap.remove(pairSocket);
        }  
        tokenConnections.remove(pairToken);
    }


    tokenConnections.remove(token);
    connectionMap.remove(mySocket);
    return true;
}

/**
 * Ends a game associated with a token, and closes the connections associated with the game.
 * 
 * @param token The token associated with the game to end
 * @returns A boolean indicating whether the game was successfully ended
 */
async function endGame(req : Request, res : Response){
    const { token } = req.body;
    const result = await tearDown(token);
    if (result) {
        res.status(200).send('Game ended');
    } else {
        res.status(400).send('Token not connected to user');
    }
    
}

const handleWebSocketConnection = (ws : WebSocket, req : Request) => {
    console.log('New WebSocket connection');

    if (!req){
        console.error('Request not found');
        ws.send(JSON.stringify({ error: "Request not found. Connection will be closed." }), () => {
            ws.close();
        });
        return;
    }

    if (!req.url) {
        console.error('URL not found in request');
        ws.send(JSON.stringify({ error: "URL not found in request. Connection will be closed." }), () => {
            ws.close();
        });
        return;
    }

    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const token = urlParams.get('token');

    if (!token) {
        console.error('Token not found in URL parameters');
        ws.send(JSON.stringify({ error: "Token not found in URL parameters. Connection will be closed." }), () => {
            ws.close();
        });
        return;
    }

    // Check if this token is associated with a game
    if (!tokenConnections.has(token) ){
        console.error('Invalid token not associated with a game');
        ws.send(JSON.stringify({ error: "Invalid token not associated with a game. Connection will be closed." }), () => {
            ws.close();
        });
        return;
    }

    // Check if token is already connected to a client. If not, add it to the map.
    if (!tokenConnectionMap.has(token)) {
        tokenConnectionMap.set(token, ws);
        connectionTokenMap.set(ws, token);

        // Get token pair and check if that token has been cashed in by a client.
        const pairToken = tokenConnections.get(token);
        if (!pairToken) {
            console.error('Token pair not found');
            tokenConnectionMap.delete(token);
            connectionTokenMap.delete(ws);
            ws.send(JSON.stringify({ error: "Token pair not found. Connection will be closed." }), () => {
                ws.close();
            });
            return;
        }

        console.log('Found token pair ' + pairToken);
        if (tokenConnectionMap.has(pairToken)) {
            console.log('Both users now connected');
            if (!initiateConnection(token, pairToken)) {
                ws.send(JSON.stringify({ error: "Failed to initiate connection." }));
                return;
            }
            // ws.send(JSON.stringify({ message: "Both users now connected" }));
        }
        else {
            ws.send(JSON.stringify({ status: "CONNECTION WAITING" }));
        }

    }
    else {
        if (tokenConnectionMap.get(token) !== ws) {
            console.log('Invalid token '+ token + ' already in use by another client '+ tokenConnectionMap.get(token));
            ws.send(JSON.stringify({ error: "Invalid token in use by another client. Connection will be closed." }), () => {
                ws.close();
            });
            return;
        }
        // Token is already connected to this client, continue as is
    }



  ws.on('message', (message : Data) => {

    const messageString = message instanceof Buffer 
    ? message.toString('utf-8') 
    : message;

    console.log('Received:', messageString);

    if (typeof messageString === 'string') {
        message = JSON.parse(messageString);
    }
    else {
        console.error('Message is not a string');
        return;
    }

    const pairClient = connectionMap.get(ws);
    if (pairClient) {
        pairClient.send(messageString);
    }
    else {
        console.log('No pair client found');
        ws.send(JSON.stringify({ error: "No pair client found. Connection will be closed." }), () => {
            ws.close();
        });
    }
  });

  // Handle WebSocket disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    ws.send(JSON.stringify({ message: "WebSocket connection closed" }));
    const pairClient = connectionMap.get(ws);
    if (pairClient) {
        pairClient.send(JSON.stringify({ message: "WebSocket connection closed from other end" }));
    }
    const token = connectionTokenMap.get(ws);
    if (token){
        console.log('Tearing down game for token ' + token);
        tearDown(token);
    }
    else {
        console.log('No token found');
    }
  });

};

export { handleWebSocketConnection, generateGame, endGame };
