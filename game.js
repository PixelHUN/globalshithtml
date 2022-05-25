function randomFromArray(array)
{
  return array[Math.floor(Math.random() * array.length)];
}

(function(){
  let playerId;
  let playerRef;
  let world;
  let players = {};
  let playerElements = {};
  let playerNames = [];

  let playerNum = 0;

  const gameContainer = document.querySelector(".game-container");

  let username = "";
  document.getElementById("name-button").onclick = function() {EnterName()};

  function EnterName()
  {
    username = document.getElementById("nameinput").value;
    firebase.auth().signInAnonymously().catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
      console.log(errorCoded, errorMessage);
    })

    firebase.auth().onAuthStateChanged((user) => {
      console.log(user)
      if(user)
      {
        // wooo van felhasználó

        playerId = user.uid;
        playerRef = firebase.database().ref(`players/${playerId}`);
        world = firebase.database().ref(`world`);

        document.querySelector(".give-name").style.display="none";
        document.querySelector(".character-name").innerText = "Dőlj hátra! Hamarosan kezdődik a játék.";

        playerRef.set({
          id: playerId,
          host: 0,
          uname: username,
          profile: "hetzmann-hont",
          money: 1
        })
        // N.America, S. America, Europe, Africa, Asia, Australia
        world.set({
          year: 2022,
          NAmerica: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          SAmerica: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Europe: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Asia: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Africa: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Australia: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          }
        })

        playerRef.onDisconnect().remove();

        initGame();
      }
      else
      {
        // nincs több felhasználó
      }
    })

    console.log(username);
  }

  function initGame(){
    const allPlayersRef = firebase.database().ref(`players`);
    const worldRef = firebase.database().ref(`world`);

    allPlayersRef.on("value", (snapshot) => {
      // érték változás
      players = snapshot.val() || {};
      playerNum = snapshot.numChildren();
      console.log("There are "+snapshot.numChildren()+" players");
      if(snapshot.numChildren()===1)
      {
        players[playerId].host = 2;
        playerRef.set(players[playerId]);
        var lobby = new Audio('./audio/lobby.mp3');
        lobby.loop = true;
        lobby.play();
      }
      if(snapshot.numChildren()===2 && players[playerId].host != 2)
      {
        players[playerId].host = 1;
        playerRef.set(players[playerId]);
      }

      if(players[playerId].host === 1)
      {
        document.getElementById("button-host").style.display = "";
      }
      else {
        document.getElementById("button-host").style.display = "none";
      }

      if(players[playerId].host === 2)
      {
        const index = playerNames.indexOf(snapshot.val().uname);
        if (index > -1) {
          playerNames.splice(index, 1);
        }
        document.querySelector(".character-name").innerText = playerNames;

        const changedPlayer = snapshot.val();
        if(changedPlayer.host != 1)
        {
          playerNames.push(changedPlayer.uname);
          document.querySelector(".character-name").innerText = changedNames;
        }
      }
    })

    allPlayersRef.on("child_added", (snapshot) => {
      // számomra új csomópontok
      if(players[playerId].host===2 && playerNum > 1)
      {
        var enter = new Audio('./audio/enter.mp3');
        enter.play();
        const addedPlayer = snapshot.val();
        if(addedPlayer.host != 1)
        {
          playerNames.push(addedPlayer.uname);
          document.querySelector(".character-name").innerText = playerNames;
        }
      }
    })

    allPlayersRef.on("child_removed", (snapshot) => {
      // csomópont eltünt :c
      if(players[playerId].host===2)
      {
        const index = playerNames.indexOf(snapshot.val().uname);
        if (index > -1) {
          playerNames.splice(index, 1);
        }
        document.querySelector(".character-name").innerText = playerNames;
      }
    })
  }

})();
