import initDB from './init_db';

const greet = (name: string): string => {
    return `Hello, ${name}!`
}

console.log(greet("Ashish"))

initDB();


