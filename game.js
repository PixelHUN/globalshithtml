const choices = [
  {
    text: "Happy vagy Pénz?",
    aText: "Happy",
    bText: "Pénz",
    minBudget: 0,
    aOption: {
      CO: 0,
      Temperature: 0,
      Happyness: 1,
      Wealthyness: 0
    },
    bOption: {
      CO: 0,
      Temperature: 0,
      Happyness: 0,
      Wealthyness: 1
    }
  }
]

const profiles = [
  {
    name: "Mucsi Tamás Gábor",
    description: "Lakcím: Európa\nLeírás: 34 éves, politikus. Erősen jobb oldali. Onnan próbál pénzt szerezni ahonnan csak tud. Jelenleg egy bírósági eljárás folyik elene.",
    budget: 20,
    continent: "Europe"
  },
  {
    name: "Sévérine Anatole",
    description: "Lakcím: Európa\nLeírás: 78 éves, nyugdíjas. Könyveket írt és fordított, emiatt rengeteg könyvet el is olvasott. Rengeteg tudásra tett szert eddigi élete alatt.",
    budget: 20,
    continent: "Europe"
  }
]
function randomFromArray(array)
{
  return array[Math.floor(Math.random() * array.length)];
}

let players = {};

(function(){
  let isHost = false;
  let playerId;
  let playerRef;
  let world;
  let worldContainer = {};
  let playerElements = {};
  let playerNames = [];
  const allPacketsRef = firebase.database().ref(`buffer`);

  let countdownFinished = false;
  let playing = false;
  let waitType;

  let packetid = 0;

  let playerNum = 0;

  const gameContainer = document.querySelector(".game-container");

  let username = "";

  let curChoice;

  // gombok
  document.getElementById("name-button").onclick = function() {EnterName()};
  document.getElementById("button-host").onclick = function() {startGame()};

  document.getElementById("a-button").onclick = function() {choiceButton(false)};
  document.getElementById("b-button").onclick = function() {choiceButton(true)};

  function getContinentFromProfile(_world, _profile)
  {
    switch(_profile.continent)
    {
      case "NAmerica":
        return _world.NAmerica;
        break;
      case "SAmerica":
        return _world.SAmerica;
        break;
      case "Europe":
        return _world.Europe;
        break;
      case "Africa":
        return _world.Africa;
        break;
      case "Australia":
        return _world.Australia;
        break;
      case "Asia":
        return _world.Asia;
        break;
    }
  }

  function choiceButton(bButton)
  {
    var _world = {
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
    }

    if(!bButton)
    {
      getContinentFromProfile(_world, players[playerId].profile).CO += curChoice.aOption.CO;
      getContinentFromProfile(_world, players[playerId].profile).Happyness += curChoice.aOption.Happyness;
      getContinentFromProfile(_world, players[playerId].profile).Temperature += curChoice.aOption.Temperature;
      getContinentFromProfile(_world, players[playerId].profile).Wealthyness += curChoice.aOption.Wealthyness;
    }
    else
    {
      getContinentFromProfile(_world, players[playerId].profile).CO += curChoice.bOption.CO;
      getContinentFromProfile(_world, players[playerId].profile).Happyness += curChoice.bOption.Happyness;
      getContinentFromProfile(_world, players[playerId].profile).Temperature += curChoice.bOption.Temperature;
      getContinentFromProfile(_world, players[playerId].profile).Wealthyness += curChoice.bOption.Wealthyness;
    }
    SendToBuffer(_world);
    if(playing)
    {
      showChoice();
    }
  }

  function countdown(timeleft = 10)
  {
    var timer = setInterval(function(){
      if(timeleft <= 0){
        clearInterval(timer);
        document.querySelector(".countdown").innerText = "";
        countdownFinished = true;
      } else {
        var min;
        var sec;
        if(timeleft>10)
        {
          document.querySelector(".countdown").style.fontSize = "42px";
          min = Math.floor(timeleft/60);
          sec = timeleft-min*60;
          if(sec<10){
            document.querySelector(".countdown").innerText = min+":0"+sec;
          }else{
            document.querySelector(".countdown").innerText = min+":"+sec;
          }
        }
        else
        {
          document.querySelector(".countdown").style.fontSize = "64px";
          document.querySelector(".countdown").innerText = timeleft;
        }
      }
      timeleft -= 1;
    }, 1000);
  }

  function waitForCountdown()
  {
    console.log(countdownFinished);
    if(countdownFinished === false) {
      console.log("várok");
      window.setTimeout(waitForCountdown, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      /* do something*/
      switch (waitType) {
        case "game":
          playing = true;
          worldContainer.playing = playing;
          world.set(worldContainer);
          game();
          break;
        case "endgame":
          playing = false;
          worldContainer.playing = playing;
          world.set(worldContainer);
          document.getElementById("button-host").style.display = "";
          document.querySelector(".gamedata").style.display = "none";
          document.querySelector(".countdown").style.fontSize = "32px";
          document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
          if(isHost === true)
          {
            writeNames();
          }
          break;
      }
      countdownFinished = false;
      console.log("done? "+countdownFinished);
    }
  }

  function writeNames()
  {
    var _pntext = "";
    playerNames.forEach((item) => {
      if(item!=undefined){
        _pntext += item+", ";
        console.log(item);
      }
    });
    document.querySelector(".character-name").innerText = _pntext;
  }

  function startGame()
  {
    players.forEach((item, i) => {
      item.profile = worldContainer.profiles[i];
      worldContainer.profiles.splice(i,1);

      var setPlayer = firebase.database().ref('players/${item.uid}');

      setPlayer.set(item);
    })
    document.getElementById("button-host").style.display = "none";
    countdown(5);
    waitType="game";
    waitForCountdown();
  }

  // --játék--
  function game()
  {
    if(isHost === true)
    {
      allPacketsRef.remove();
      countdown(60);
      waitType="endgame";
      countdownFinished = false;

      waitForCountdown();

      //worldContainer.showinfo = true;
      worldRef.set(worldContainer);

      document.querySelector(".countdown").innerText = "START!";
      document.querySelector(".character-name").innerText = "Nézz a készülékedre!";
      document.getElementById("button-host").style.display = "none";
      document.querySelector(".gamedata").style.display = "";
    }
    else {
      document.querySelector(.playerinfo).innerText = player[playerId].profile.name+"\n"+player[playerId].profile.description;
      document.getElementById("clientui").style.display = "";
      document.querySelector(".character-name").style.display = "none";
      document.getElementById("nongameplay").style.display = "none";
      document.querySelector(".gamedata").style.display = "none";

      showChoice();
    }
  }

  function showChoice()
  {
    curChoice = randomFromArray(choices);

    if(curChoice.minBudget <= players[playerId].profile.budget)
    {
      document.getElementById("question").innerText = curChoice.text;
      document.getElementById("a-button").innerText = curChoice.aText;
      document.getElementById("b-button").innerText = curChoice.bText;
    } else
    {
      showChoice();
    }
  }

  // szerver buffer
  function SendToBuffer(_world){
    packetid += 1;
    var packet = firebase.database().ref(`buffer/${playerId}_${packetid}`);

    packet.set(_world);
  }

  // lista szortírozás?
  function sortListHappyness(ul){
    var new_ul = ul.cloneNode(false);

    // Add all lis to an array
    var lis = [];
    for(var i = ul.childNodes.length; i--;){
        if(ul.childNodes[i].nodeName === 'LI')
            lis.push(ul.childNodes[i]);
    }

    // Sort the lis in descending order
    var numlis = [worldContainer.NAmerica.Happyness,
                  worldContainer.SAmerica.Happyness,
                  worldContainer.Europe.Happyness,
                  worldContainer.Africa.Happyness,
                  worldContainer.Australia.Happyness,
                  worldContainer.Asia.Happyness];
    numlis.sort(function(a, b){
       return b - a;
    });

    var _list = [true, true, true, true, true, true];

    for (var i = 0; i < numlis.length; i++) {
      if(numlis[i]===worldContainer.NAmerica.Happyness && _list[0])
      {
        lis[i].innerHTML = "É. Amerika";
        _list[0] = false;
      }
      else if(numlis[i]===worldContainer.SAmerica.Happyness && _list[1])
      {
        lis[i].innerHTML = "D. Amerika";
        _list[1] = false;
      }
      else if(numlis[i]===worldContainer.Europe.Happyness && _list[2])
      {
        lis[i].innerHTML = "Európa";
        _list[2] = false;
      }
      else if(numlis[i]===worldContainer.Africa.Happyness && _list[3])
      {
        lis[i].innerHTML = "Afrika";
        _list[3] = false;
      }
      else if(numlis[i]===worldContainer.Australia.Happyness && _list[4])
      {
        lis[i].innerHTML = "Ausztrália";
        _list[4] = false;
      }
      else if(numlis[i]===worldContainer.Asia.Happyness && _list[5])
      {
        lis[i].innerHTML = "Ázsia";
        _list[5] = false;
      }
    }

    // Add them into the ul in order
    for(var i = 0; i < lis.length; i++)
    {
      //lis[i].innerHTML = numlis[i];
      new_ul.appendChild(lis[i]);
    }

    ul.parentNode.replaceChild(new_ul, ul);
  }

  function sortListWealthyness(ul){
    var new_ul = ul.cloneNode(false);

    // Add all lis to an array
    var lis = [];
    for(var i = ul.childNodes.length; i--;){
        if(ul.childNodes[i].nodeName === 'LI')
            lis.push(ul.childNodes[i]);
    }

    // Sort the lis in descending order
    var numlis = [worldContainer.NAmerica.Wealthyness,
                  worldContainer.SAmerica.Wealthyness,
                  worldContainer.Europe.Wealthyness,
                  worldContainer.Africa.Wealthyness,
                  worldContainer.Australia.Wealthyness,
                  worldContainer.Asia.Wealthyness];
    numlis.sort(function(a, b){
       return b - a;
    });

    var _list = [true, true, true, true, true, true];

    for (var i = 0; i < numlis.length; i++) {
      if(numlis[i]===worldContainer.NAmerica.Wealthyness && _list[0])
      {
        lis[i].innerHTML = "É. Amerika";
        _list[0] = false;
      }
      else if(numlis[i]===worldContainer.SAmerica.Wealthyness && _list[1])
      {
        lis[i].innerHTML = "D. Amerika";
        _list[1] = false;
      }
      else if(numlis[i]===worldContainer.Europe.Wealthyness && _list[2])
      {
        lis[i].innerHTML = "Európa";
        _list[2] = false;
      }
      else if(numlis[i]===worldContainer.Africa.Wealthyness && _list[3])
      {
        lis[i].innerHTML = "Afrika";
        _list[3] = false;
      }
      else if(numlis[i]===worldContainer.Australia.Wealthyness && _list[4])
      {
        lis[i].innerHTML = "Ausztrália";
        _list[4] = false;
      }
      else if(numlis[i]===worldContainer.Asia.Wealthyness && _list[5])
      {
        lis[i].innerHTML = "Ázsia";
        _list[5] = false;
      }
    }

    // Add them into the ul in order
    for(var i = 0; i < lis.length; i++)
        new_ul.appendChild(lis[i]);
    ul.parentNode.replaceChild(new_ul, ul);
  }

  // név megadás
  function EnterName()
  {
    if(document.getElementById("nameinput").value === "")
    {
      return;
    }
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
          host: false,
          uname: username,
          profile: profiles[0]
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
    if(!playing)
    {
      // N.America, S. America, Europe, Africa, Asia, Australia
      world.set({
        profiles: profiles,
        year: 2022,
        playing: false,
        showinfo: false,
        NAmerica: {
          CO: 0,
          Temperature: 0,
          Happyness: 5,
          Wealthyness: 6
        },
        SAmerica: {
          CO: 0,
          Temperature: 0,
          Happyness: 4,
          Wealthyness: 3
        },
        Europe: {
          CO: 0,
          Temperature: 0,
          Happyness: 3,
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
    }

    const allPlayersRef = firebase.database().ref(`players`);
    const worldRef = firebase.database().ref(`world`);

    worldRef.on("value", (snapshot) => {
      // világ változás
      worldContainer = snapshot.val() || {};

      // ha játékállapot változás történik kliens számára
      if(playing != worldContainer.playing && !isHost)
      {
        playing = worldContainer.playing;
        if(playing) {
          game();
        }
        else{
          document.getElementById("clientui").style.display = "none";
          document.getElementById("nongameplay").style.display = "";
          document.querySelector(".character-name").style.display = "";
        }
      }
      if(isHost)
      {
        sortListHappyness(document.getElementById("happyness"));
        sortListWealthyness(document.getElementById("wealthyness"));

        document.getElementById("na").style.opacity = worldContainer.NAmerica.CO/100;
        document.getElementById("sa").style.opacity = worldContainer.SAmerica.CO/100;
        document.getElementById("eu").style.opacity = worldContainer.Europe.CO/100;
        document.getElementById("af").style.opacity = worldContainer.Africa.CO/100;
        document.getElementById("au").style.opacity = worldContainer.Australia.CO/100;
        document.getElementById("as").style.opacity = worldContainer.Asia.CO/100;
      }
    })

    allPlayersRef.on("value", (snapshot) => {
      // érték változás
      if(!playing)
      {
        players = snapshot.val() || {};
        playerNum = snapshot.numChildren();
        console.log("There are "+snapshot.numChildren()+" players");
        if(snapshot.numChildren()===1)
        {
          players[playerId].host = true;
          playerRef.set(players[playerId]);
          document.querySelector(".character-name").innerText = "";
          /*var lobby = new Audio('./audio/lobby.mp3');
          lobby.loop = true;
          lobby.play();*/
        }

        if(players[playerId].host === true)
        {
          isHost = true;
          document.getElementById("button-host").style.display = "";
          document.querySelector(".bg").style.display = "";
          //document.querySelector(".gamedata").style.display = "";

          document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
        }
        else {
          isHost = false;
          document.getElementById("button-host").style.display = "none";
          document.querySelector(".bg").style.display = "none";
          document.querySelector(".gamedata").style.display = "none";
        }

        if(players[playerId].host === true)
        {
          const index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();

          const changedPlayer = snapshot.val();
          if(changedPlayer.host != true)
          {
            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_added", (snapshot) => {
      // számomra új csomópontok
      if(!playing)
      {
        console.log(players);
        console.log(playerId);
        if(isHost===true)
        {
          var enter = new Audio('./audio/enter.mp3');
          enter.play();
          const addedPlayer = snapshot.val();
          if(addedPlayer.host != 1)
          {
            playerNames.push(addedPlayer.uname);

            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_removed", (snapshot) => {
      // csomópont eltünt :c
      if(!playing)
      {
        if(isHost===true)
        {
          const index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();
        }
      }
    })



    // buffer feltöltődés
    allPacketsRef.on("child_added", (snapshot) => {
        if(isHost && playing)
        {
            var inPacket = snapshot.val();
            worldContainer.NAmerica = addToWorld(inPacket.NAmerica, worldContainer.NAmerica);
            worldContainer.SAmerica = addToWorld(inPacket.SAmerica, worldContainer.SAmerica);
            worldContainer.Europe = addToWorld(inPacket.Europe, worldContainer.Europe);
            worldContainer.Africa = addToWorld(inPacket.Africa, worldContainer.Africa);
            worldContainer.Asia = addToWorld(inPacket.Asia, worldContainer.Asia);
            worldContainer.Australia = addToWorld(inPacket.Australia, worldContainer.Australia);

            worldRef.set(worldContainer);
            //inPacket.remove();
        }
    })
  }

  function addToWorld(data, continent){
    console.log(worldContainer);
    var _CO = continent.CO + data.CO;
    var _Temper = continent.Temperature + data.Temperature;
    var _Happy = continent.Happyness + data.Happyness;
    var _Wealth = continent.Wealthyness + data.Wealthyness;
    var modified_data = {
        CO: _CO,
        Temperature: _Temper,
        Happyness: _Happy,
        Wealthyness: _Wealth
    }
    console.log(modified_data);
    return modified_data;
  }
})();
