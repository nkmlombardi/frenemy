var socket = io.connect('http://localhost:8080');

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function() {
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    // socket.emit('adduser', prompt("What's your name?"));
    socket.emit('adduser', 'Nick');
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function(username, data) {
    $('#conversation').append('<b>' + username + ':</b> ' + data + '<br>');
});

// listener, whenever the server emits 'updateGamelist', this updates the room the client is in
socket.on('updateGamelist', function(rooms, current_room) {
    console.log('Event: updateGamelist', rooms);
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
        if (value == current_room) {
            $('#rooms').append('<div>' + value + '</div>');
        } else {
            $('#rooms').append('<div><a href="#" onclick="joinGame(\'' + value + '\')">' + value + '</a></div>');
        }
    });
});

/**
 * Appends new Game objects onto the Gamelist
 * @param  {[array]}    rooms           array of Room objects
 */
socket.on('addGamesToGamelist', function(rooms) {
    console.log('Event: addGamesToGamelist', rooms);

    $.each(rooms, function(key, room) {
        $('#rooms').append('<div><a href="#" onclick="joinGame(\'' + room + '\')">' + room + '</a></div>');
    });
});

/**
 * Destroys the Playerlist and generates a new one from new one
 * @param  {[array]}    players         array of Player objects
 * @param  {[array]}    self            the client's Player object
 */
socket.on('updatePlayerlist', function(players, self) {
    console.log('Event: updatePlayerList', players);
    $('#players').empty();
    $.each(players, function(key, player) {
        if (player.id == self.id) {
            $('#players').append('<div id="' + player.id + '">' + player.name + '</div>');
        } else {
            $('#players').append('<div id="' + player.id + '"><a href="#" onclick="messagePlayer(\'' + player.id + '\')">' + player.name + '</a></div>');
        }
    });
});

/**
 * Appends new Player objects onto the Playerlist
 * @param  {[array]}    players         array of Player objects
 */
socket.on('addPlayersToPlayerlist', function(players) {
    console.log('Event: addPlayersToPlayerlist', players);

    $.each(players, function(key, player) {
        $('#players').append('<div id="' + player.id + '"><a href="#" onclick="messagePlayer(\'' + player.id + '\')">' + player.name + '</a></div>');
    });
});

/**
 * Deletes specified Player objects from the Playerlist
 * @param  {[array]}    players         array of Player objects
 */
socket.on('removeFromPlayerlist', function(players) {
    console.log('Event: removeFromPlayerlist', players);

    $.each(players, function(key, player) {
        $('#players #' + player.id).remove();
    });
});


function joinGame(room) {
    socket.emit('joinGame', room);
}

// on load of page
$(document).ready(function() {
    $('#startGame').hide();

    // when the client clicks SEND
    $('#datasend').click(function() {
        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', message);
    });

    $('#createGame').click(function() {
        socket.emit('createGame', socket.username);
        $(this).toggle();
        $('#startGame').toggle();
    });

    $('#startGame').click(function() {
        socket.emit('startGame');
        $(this).toggle();
    });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
        if (e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });
});
