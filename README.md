# Frenemy
Intuitive, easy to pick up and play mobile game that allows players to test their wits against strangers for money.

## Setup
Clone the repository to your local machine. Make sure you have nodeJS and npm (package manager) installed on your machine. Run `npm install` while in the home directory of the project. This will install the project's dependencies. I also suggest install `nodemon` globally on your machine, which will automatically detect changes to the server file and restart the node process. Once the process is running access the page at `http://localhost:8080`.

## Screenshot
![screenshot](https://i.gyazo.com/103cf9b2b06d717c10b8385528c958f1.png)

## Understanding Sockets
I found this information to be particularly helpful:

```
 // send to current request socket client
 socket.emit('message', "this is a test");

 // sending to all clients, include sender
 io.sockets.emit('message', "this is a test"); //still works
 //or
 io.emit('message', 'this is a test');

 // sending to all clients except sender
 socket.broadcast.emit('message', "this is a test");

 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');

 // sending to all clients in 'game' room(channel), include sender
 // docs says "simply use to or in when broadcasting or emitting"
 io.in('game').emit('message', 'cool game');

 // sending to individual socketid, socketid is like a room
 socket.broadcast.to(socketid).emit('message', 'for your eyes only');
 ```