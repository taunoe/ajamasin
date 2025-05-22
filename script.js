window.addEventListener("load", function() {
    var timerCanvas = document.querySelector(".timer");
    var context = timerCanvas.getContext("2d");
    var timerVideo = document.querySelector(".renderedTimer");
    //var blocksLogo = new Image();
    var peer = new Peer(null, {debug: 2});
    var openConnections = [];

    var endTime = null;
    var note = null;

    function parameter(parameter, url = new URL(window.location)) {
        if (!(url instanceof URL)) {
            url = new URL(url);
        }
    
        var searchParams = new URLSearchParams(url.search).get(parameter);
    
        return typeof(searchParams) === "string" ? decodeURIComponent(searchParams) : searchParams;
    }

    function writeText(text, x, y, size = 120, colour = "white") {
        context.font = `${size}px "space_monobold"`;
        context.fillStyle = colour;
        context.textBaseline = "middle";
        context.textAlign = "center";

        context.fillText(text, x, y);
    }

    function render() {
        var timeDisplay = "--:--";
        var currentTimeDisplay = new Date(Date.now() - (new Date().getTimezoneOffset() * 60_000)).toISOString().substring(11, 16);

        if (endTime != null) {
            var timeLeft = endTime - Date.now();
            var timeString = new Date(Math.abs(timeLeft >= 0 ? timeLeft + 1_000 : timeLeft)).toISOString().substring(14, 19);
        
            if (timeLeft >= 0) {
                timeDisplay = `-${timeString}`;
            } else {
                timeDisplay = `+${timeString}`;
            }
        }

        context.fillStyle = "black";
        
        context.fillRect(0, 0, timerCanvas.width, timerCanvas.height);
        
        //context.drawImage(blocksLogo, 5, 5, 5, 5 * (blocksLogo.height / blocksLogo.width));

        var timeColour = "white";

        if (timeLeft < 0) {
            timeColour = "#FA5050";
        } else if (timeLeft < 30_000) {
            timeColour = "#D5EA3B";
        }

        writeText(currentTimeDisplay, timerCanvas.width - 110, 52, 64);
        writeText(timeDisplay, timerCanvas.width / 2, timerCanvas.height / 2, 240, timeColour);
        writeText(note || "", timerCanvas.width / 2, timerCanvas.height - 64, 64);

        requestAnimationFrame(render);
    }

    function connect(peerId) {
        var connection = peer.connect(peerId);

        document.querySelector(".connectionMessage").textContent = "Connecting...";

        connection.on("open", function() {
            document.querySelector(".connectionMessage").textContent = "Connected to host!";

            openConnections.push(connection);
        });
    }

    function sync() {
        openConnections.forEach(function(connection) {
            connection.send({
                note,
                endTime: endTime != null ? endTime.getTime() : null
            });
        });
    }

    document.querySelector("#applyEndTimeButton").addEventListener("click", function() {
        endTime = new Date(document.querySelector("#endTime").value);

        sync();
    });

    document.querySelector("#applyNoteButton").addEventListener("click", function() {
        note = document.querySelector("#note").value;

        sync();
    });

    document.querySelector("#clearEndTimeButton").addEventListener("click", function() {
        endTime = null;

        sync();
    });

    document.querySelector("#clearNoteButton").addEventListener("click", function() {
        note = "";

        sync();
    });

    peer.on("open", function() {
        document.querySelector(".ownPeerId").textContent = `Own peer ID: ${peer.id}`;

        if (parameter("peerId") != null) {
            document.querySelector("#connectPeerId").value = parameter("peerId");
    
            connect(parameter("peerId"));
        } else {
            window.history.replaceState(null, document.title, `${window.location.href.split("?")[0]}?peerId=${encodeURIComponent(peer.id)}`);
        }
    });

    peer.on("error", function(error) {
        document.querySelector(".connectionMessage").textContent = error;
    });

    document.querySelector("#connectButton").addEventListener("click", function() {
        connect(document.querySelector("#connectPeerId").value);
    });

    peer.on("connection", function(connection) {
        document.querySelector(".connectionMessage").textContent = "Connected to controller!";

        connection.on("data", function(data) {
            endTime = data.endTime != null ? new Date(data.endTime) : null;
            note = data.note;
        });
    })

    //blocksLogo.src = "logo-white.svg";
    timerVideo.srcObject = timerCanvas.captureStream();

    document.querySelector("#endTime").value = new Date().toISOString().slice(0, 16);

    render();
});
