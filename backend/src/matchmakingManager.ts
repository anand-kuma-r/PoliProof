import { generateGame } from "./webRTC";
/*
 * This class is our matchmaking manager. Each user joins the matchmaking queue is in a queue.
 *
 * The users are randomly made to wait (< 5 s) before joining queue to prevent purposeful sync (invisible to user).
 * 
 * Once two users are at the front of the queue, we kick them to "ready to match state" (the "pickup state").
 * 
 * We actually end up with an interesting async problem here: what if a user abandons their matchmaking request? Well at a certain point
 * we need to kick them from the queue. We can "patch" the problem here by doing a simple timestamp check for pings on the queue. Only move
 * to the "pickup state" if the user is still in the queue. 
 * 
 * When we move to pickup state, generate the token and place in map. So when the users come back to check, they pick up the token.
 * If a user leaves matchmaking, just pretend like they haven't pinged in a while. ON THE USER TO CALL END GAME IF WAITING TOO LONG.
 * 
 * We can use a simple fat array and a circular queue to implement the queue. Reject queue addition if queue is full.
*/
const MAX_QUEUE_SIZE = 500;
const MAX_WAITING_PAIRS = 10;
const TIME_INTERVAL = 100;
const RECENT_TIME_GAP = 5;
class MatchmakingManager {
    private usernameTokenMap: Map<string, string>;
    private qPointer: number;
    private qSize: number
    private q: Array<string>;
    private timestamps: Map<string, number>;
    private waitingPairs: number;
    

    constructor() {
        this.usernameTokenMap = new Map<string, string>();
        this.qPointer = 0;
        this.qSize = 0;
        this.q = new Array(MAX_QUEUE_SIZE);
        this.timestamps = new Map<string, number>();
        this.waitingPairs = 0;
    }

    // Returns if user is in queue (including if just added)
    addToQueue(username : string) : boolean {
        // If we have the user in timestamps it means the user is already in queue
        if (this.timestamps.has(username)) {
            this.setTime(username);
            return true;
        }
        // If queue is full, return false
        if (this.qSize >= MAX_QUEUE_SIZE) {
            return false;
        }
        this.setTime(username);

        // Add to queue
        this.q[this.qPointer] = username;
        this.qPointer = (this.qPointer + 1) % MAX_QUEUE_SIZE;
        this.qSize++;
        return true;
    }

    /**
     * Removes two users from the queue and generates a pair of tokens for a game associated with them.
     * If less than two users are in the queue, or if one of the users is invalid (i.e. not in usernamesToTokens),
     * the function returns false.
     * The function will also return false if the two users are invalid.
     * 
     * @returns A boolean indicating whether two users were successfully removed from the queue and a game generated
     */
    popQueue() : boolean {
        if ( this.waitingPairs > MAX_WAITING_PAIRS) {
            return false;
        }
        if ( this.qSize < 2) {
            return false;
        }
        let userArr = [];
        // First, we need to load in valid users
        while (this.qSize > 2 && userArr.length < 2) {
            const username = this.q[this.qPointer];
            if (this.isTimeRecent(username)) {
                userArr.push(username);
            }
            this.qPointer = (this.qPointer + 1) % MAX_QUEUE_SIZE;
            this.qSize--;
        }
        // If we only got one valid user drop them back in the queue
        if (userArr.length > 0) {
            const username = userArr.pop();
            if (username) {
                this.qPointer = (this.qPointer - 1) % MAX_QUEUE_SIZE;
                this.q[this.qPointer] = username;
            }
            return false;
        }

        // Generate token
        const [ token1, token2 ] = generateGame();
        if (!token1 || !token2) {
            while (userArr.length > 0) {
                const username = userArr.pop();
                if (username) {
                    this.qPointer = (this.qPointer - 1) % MAX_QUEUE_SIZE;
                    this.q[this.qPointer] = username;
                }
            }
            return false;
        }

        this.waitingPairs++;
        this.usernameTokenMap.set(userArr[0], token1);
        this.clearTime(userArr[0]);
        this.usernameTokenMap.set(userArr[1], token2);
        this.clearTime(userArr[1]);

        // Now, we can safely remove the two users
        return true;
    }

    userPing(username : string) : string | undefined {
        this.popQueue();
        const token = this.getToken(username);
        if (token) {
            console.log(`User ${username} pinged in and giving token ${token}`);
            return token;
        }
        this.setTime(username);
        return undefined;
    }

    getToken(username : string) : string | undefined{
        return this.usernameTokenMap.get(username);
    }

    clearToken(username : string) {
        this.usernameTokenMap.delete(username);
    }

    /**
     * Check if the time associated with the given username is recent (last 5 seconds)
     * @param username the username to check
     * @returns true if the username has been updated in the last 5 seconds, false otherwise
     */
    isTimeRecent(username : string) : boolean {
        const timestamp = this.timestamps.get(username);
        if (!timestamp) {
            return false;
        }
        const time = new Date().getTime();
        return ((time / TIME_INTERVAL - (timestamp as number)) < RECENT_TIME_GAP);
    }
    
    clearTime(username : string) {
        this.timestamps.delete(username);
        this.waitingPairs -= 0.5;
    }

    setTime(username : string) {
        const time = new Date().getTime();
        this.timestamps.set(username,  Math.round(time / TIME_INTERVAL));
    }

}

export { MatchmakingManager };