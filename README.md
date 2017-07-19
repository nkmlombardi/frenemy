# [Project Discontinued] Frenemy
*This project is no longer under development*

Intuitive, easy to pick up and play mobile game that allows players to test their wits against strangers for money.

## Setup
Clone the repository to your local machine. Make sure you have nodeJS and npm (package manager) installed on your machine. Run `npm install` while in the home directory of the project. This will install the project's dependencies. I also suggest install `nodemon` globally on your machine, which will automatically detect changes to the server file and restart the node process. Once the process is running access the page at `http://localhost:8080`.

## Mobile Setup
Navigate to the `ui/mobile` directory and run `npm install`. While the server & web layer are up and running (the mobile UI communicates with the server process), type `ionic serve`, which will start up the process and should open the web page for you. If not, then access it via `http://localhost:8100`.

## Screenshot
![screenshot](https://i.gyazo.com/ab2fa32deb872fd6a9ea664e8ef66cf2.png)

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
