// What if you'd work now?
let choices = [];

let profiles;
fetch("./gamedata/profiles.json")
.then(res => res.json())
.then(data => profiles = data)
.then(() => console.log(choices));

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
  let playing = 0;
  let waitType;

  let packetid = 0;

  let playerNum = 0;

  const gameContainer = document.querySelector(".game-container");

  let username = "";

  let curChoice;

  let playerUIDs = [];

  let lobby;
  let playingmusic = false;

  // gombok
  document.getElementById("name-button").onclick = function() {EnterName()};
  document.getElementById("button-host").onclick = function() {startGame()};

  document.getElementById("a-button").onclick = function() {choiceButton(false)};
  document.getElementById("b-button").onclick = function() {choiceButton(true)};

  function playRandomLobby()
  {
    if(playing === 0)
    {
      playingmusic = true;
      var playArray = ['./audio/lobby_sine.mp3','./audio/lobby_epiano.mp3','./audio/lobby_organ.mp3']
      lobby = new Audio(randomFromArray(playArray));
      lobby.play();
      lobby.addEventListener('ended', function() {
        this.currentTime = 0;
        playingmusic = false;
        playRandomLobby();
      }, false);
    }
  }

  function initGame(){
    if(playing === 0)
    {
      // N.America, S. America, Europe, Africa, Asia, Australia
      world.set({
        profiles: profiles,
        year: 2022,
        playing: 0,
        showinfo: false,
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
        if(playing === 1) {
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
        if(playing === 0)
        {
          if(!playingmusic)
            playRandomLobby();
        }
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
      console.log("value change!");
      players = snapshot.val() || {};
      console.log(players);
      if(playing === 0)
      {
        playerNum = snapshot.numChildren();
        console.log("There are "+snapshot.numChildren()+" players");
        if(snapshot.numChildren()===1)
        {
          players[playerId].host = true;
          playerRef.set(players[playerId]);
          document.querySelector(".character-name").innerText = "";
          document.getElementById("qrcode").innerHTML = "";
          document.getElementById("urlholder").innerText = window.location.href;
          var qrcode = new QRCode(document.getElementById("qrcode"), {
          	text: window.location.href,
          	width: 212,
          	height: 212,
          	colorDark : "#233296",
          	colorLight : "#ffffff",
          	correctLevel : QRCode.CorrectLevel.M
          });
          if(!playingmusic)
            playRandomLobby();
        }

        console.log(playerId);
        if(players[playerId].host === true)
        {
          isHost = true;
          document.getElementById("button-host").style.display = "";
          document.getElementById("qr").style.display = "";
          document.querySelector(".bg").style.display = "";
          document.getElementById("makers").style.display = "";
          //document.querySelector(".gamedata").style.display = "";

          document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
        }
        else {
          isHost = false;
          document.getElementById("button-host").style.display = "none";
          document.querySelector(".bg").style.display = "none";
          document.getElementById("qr").style.display = "none";
          document.querySelector(".gamedata").style.display = "none";
        }

        if(players[playerId].host === true)
        {
          var index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();

          var changedPlayer = snapshot.val();
          if(changedPlayer.host != true)
          {
            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_added", (snapshot) => {
      // számomra új csomópontok
      const addedPlayer = snapshot.val();
      if(playing === 0)
      {
        //console.log(players);
        console.log(playerId);
        if(isHost===true)
        {
          if(!addedPlayer.host)
          {
            var enter = new Audio('./audio/enter.mp3');
            enter.play();
            playerNames.push(addedPlayer.uname);
            playerUIDs.push(addedPlayer.id);
            console.log(addedPlayer.id);
            console.log(playerUIDs);

            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_removed", (snapshot) => {
      // csomópont eltünt :c
      if(playing === 0)
      {
        if(isHost===true)
        {
          var index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }
          var index = playerNames.indexOf(snapshot.val().id);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();
        }
      }
    })



    // buffer feltöltődés
    allPacketsRef.on("child_added", (snapshot) => {
        if(isHost && playing === 1)
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

      players[playerId].CO += curChoice.aOption.CO;
      players[playerId].Happyness += curChoice.aOption.Happyness;
      players[playerId].Wealthyness += curChoice.aOption.Wealthyness;
    }
    else
    {
      getContinentFromProfile(_world, players[playerId].profile).CO += curChoice.bOption.CO;
      getContinentFromProfile(_world, players[playerId].profile).Happyness += curChoice.bOption.Happyness;
      getContinentFromProfile(_world, players[playerId].profile).Temperature += curChoice.bOption.Temperature;
      getContinentFromProfile(_world, players[playerId].profile).Wealthyness += curChoice.bOption.Wealthyness;

      players[playerId].CO += curChoice.bOption.CO;
      players[playerId].Happyness += curChoice.bOption.Happyness;
      players[playerId].Wealthyness += curChoice.bOption.Wealthyness;
    }
    playerRef.set(players[playerId]);
    SendToBuffer(_world);
    if(playing === 1)
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
          document.querySelector(".countdown").style.fontSize = "50px";
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
          document.querySelector(".countdown").style.fontSize = "72px";
          document.querySelector(".countdown").innerText = timeleft;
        }
      }
      timeleft -= 1;
    }, 1000);
  }

  function waitForCountdown()
  {
    //console.log(countdownFinished);
    if(countdownFinished === false) {
      //console.log("várok");
      window.setTimeout(waitForCountdown, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      /* do something*/
      switch (waitType) {
        case "game":
          playing = 1;
          worldContainer.playing = playing;
          world.set(worldContainer);
          game();
          break;
        case "endgame":
          console.log("VÉGE");
          playing = 2;
          worldContainer.playing = playing;
          world.set(worldContainer);
          if(isHost === true)
          {
            endState();
            playingmusic = false;
            playRandomLobby();
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

  var state = 0;

  function resetChart() {
    document.getElementById("co2pie").remove(); // this is my <canvas> element
    document.body.innerHTML += '<canvas id="co2pie" style="width:700; height:700; position: absolute; max-width: 1351px; max-height: 675px;"></canvas>';
  };

  function endState()
  {
    resetChart();
    document.getElementById("button-host").style.display = "";
    document.getElementById("button-host").innerText = "Következő...";
    document.getElementById("button-host").onclick = function() {endState()};
    document.querySelector(".character-name").innerText = "";

    switch(state)
    {
      case 0:
        var barColors = ["red","green","blue","yellow","purple","brown"];
        var xValues = ["É. Amerika","D. Amerika","Európa","Afrika","Ázsia","Ausztrália"];
        var yValues = [worldContainer.NAmerica.CO,worldContainer.SAmerica.CO,worldContainer.Europe.CO,worldContainer.Africa.CO,worldContainer.Asia.CO,worldContainer.Australia.CO,];
        console.log(yValues);
        console.log(xValues);
        var ctx = document.getElementById("co2pie").getContext('2d');
        new Chart(ctx, {
          type: "pie",
          data: {
            labels: xValues,
            datasets: [{
              backgroundColor: barColors,
              data: yValues
            }]
          },
          options: {
            title: {
              display: true,
              text: "Átlagos CO2 Kibocsátás Országonként",
              fontColor: '#000000',
              fontSize: 32
            },
            legend: {
              display: true,
              labels: {
                fontSize: 20
              }
            }
          }
        });
        document.getElementById("co2pie").style.zIndex = "4";
        break;

      case 1:
        var barColors = ["red","green","blue","yellow","purple","brown"];
        var xValues = ["É. Amerika","D. Amerika","Európa","Afrika","Ázsia","Ausztrália"];
        var yValues = [worldContainer.NAmerica.CO,worldContainer.SAmerica.CO,worldContainer.Europe.CO,worldContainer.Africa.CO,worldContainer.Asia.CO,worldContainer.Australia.CO,];
        var yValuesTwo = [worldContainer.NAmerica.Wealthyness,worldContainer.SAmerica.Wealthyness,worldContainer.Europe.Wealthyness,worldContainer.Africa.Wealthyness,worldContainer.Asia.Wealthyness,worldContainer.Australia.Wealthyness,];
        var yValuesThree = [worldContainer.NAmerica.Happyness,worldContainer.SAmerica.Happyness,worldContainer.Europe.Happyness,worldContainer.Africa.Happyness,worldContainer.Asia.Happyness,worldContainer.Australia.Happyness,];
        console.log(yValues);
        console.log(xValues);
        var ctx = document.getElementById("co2pie").getContext('2d');
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: xValues,
            datasets: [
              {
                label: "Jókedv",
                backgroundColor: barColors[4],
                data: yValuesThree
              },
              {
                label: "CO2",
                backgroundColor: barColors[0],
                data: yValues
              },
              {
                label: "Költekezés",
                backgroundColor: barColors[1],
                data: yValuesTwo
              }
            ]
          },
          options: {
            barValueSpacing: 15,
            title: {
              display: true,
              text: "Adatok Összehasonlítása",
              fontColor: '#000000',
              fontSize: 32
            },
            legend: {
              display: true,
              labels: {
                fontSize: 20
              }
            }
          }
        });
        document.getElementById("co2pie").style.zIndex = "4";
        break;

      case 2:
        var playss = [];

        for (var i = 0; i < playerUIDs.length; i++) {
          if(playerUIDs[i] != undefined)
          {
            console.log(i);
            console.log(playerUIDs[i]);
            console.log(worldContainer.profiles);
            playss[i] = players[playerUIDs[i]];

          }
        }
        objects = playss;
        var coValues = objects.map(function(o) { return o.CO; });
        coValues = Array.from(objects, o => o.CO);
        var coMax = Math.max(...coValues);
        var maxXObjects = objects.filter(function(o) { return o.CO === coMax; });

        var weValues = objects.map(function(o) { return o.Wealthyness; });
        weValues = Array.from(objects, o => o.Wealthyness);
        var weMax = Math.max(...weValues);
        var maxWealthObjects = objects.filter(function(o) { return o.Wealthyness === weMax; });

        var haValues = objects.map(function(o) { return o.Happyness; });
        haValues = Array.from(objects, o => o.Happyness);
        var haMin = Math.min(...haValues);
        var minHappyObjects = objects.filter(function(o) { return o.Happyness === haMin; });

        var haValues = objects.map(function(o) { return o.Happyness; });
        haValues = Array.from(objects, o => o.Happyness);
        var haMax = Math.max(...haValues);
        var maxHappyObjects = objects.filter(function(o) { return o.Happyness === haMax; });

        console.log(maxXObjects);
        var mostcoplayer = maxXObjects[0].uname;
        var mostcoplayerprofile = maxXObjects[0].profile.name;
        var mostwealthplayer = maxWealthObjects[0].uname;
        var mostwealthplayerprofile = maxWealthObjects[0].profile.name;
        var leasthappyplayer = minHappyObjects[0].uname;
        var leasthappyplayerprofile = minHappyObjects[0].profile.name;
        var mosthappyplayer = maxHappyObjects[0].uname;
        var mosthappyplayerprofile = maxHappyObjects[0].profile.name;
        document.querySelector(".character-name").innerText = "Legtöbb CO2 kibocsátó: \n"+mostcoplayer+" ("+mostcoplayerprofile+" szerepében)"+"\n\n"+
                                                              "Legnagyobb költekező: \n"+mostwealthplayer+" ("+mostwealthplayerprofile+" szerepében)"+"\n\n"+
                                                              "Legboldogabb életvitel: \n"+mosthappyplayer+" ("+mosthappyplayerprofile+" szerepében)"+"\n\n"+
                                                              "Legszomorúbb életvitel: \n"+leasthappyplayer+" ("+leasthappyplayerprofile+" szerepében)";
        break;
    }

    document.getElementById("clientui").style.display = "none";
    document.querySelector(".countdown").style.fontSize = "40px";
    document.querySelector(".countdown").innerText = "A játék véget ért...";
    state++;
    if(state > 2)
      state = 0;

    /*worldContainer.playing = playing;
    world.set(worldContainer);
    document.getElementById("button-host").style.display = "";
    document.querySelector(".gamedata").style.display = "none";
    document.querySelector(".countdown").style.fontSize = "40px";
    document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
    if(isHost === true)
    {
      playingmusic = false;
      playRandomLobby();
      document.getElementById("qr").style.display = "";
      writeNames();
    }*/
  }

  function startGame()
  {
    //console.log(players.length);
    playing = 1;
    world.set({
      profiles: profiles,
      year: 2022,
      playing: 0,
      showinfo: false,
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
    for (var i = 0; i < playerUIDs.length; i++) {
      if(playerUIDs[i] != undefined)
      {
        console.log(i);
        console.log(playerUIDs[i]);
        console.log(worldContainer.profiles);
        players[playerUIDs[i]].profile = worldContainer.profiles[0];
        worldContainer.profiles.splice(0,1);

        var setPlayer = firebase.database().ref(`players/${playerUIDs[i]}`);
        console.log("set "+playerUIDs[i]+" id's profile to: "+players[playerUIDs[i]].profile);
        setPlayer.set(players[playerUIDs[i]]);
        world.set(worldContainer);
      }
    }
    document.getElementById("button-host").style.display = "none";
    document.getElementById("qr").style.display = "none";
    countdown(5);
    waitType="game";
    waitForCountdown();
  }

  // --játék--
  function game()
  {
    if(isHost === true)
    {
      lobby.pause();
      lobby.currentTime = 0;
      game = new Audio('./audio/kongbong.mp3');
      game.play();
      allPacketsRef.remove();
      countdown(60);
      waitType="endgame";
      countdownFinished = false;

      waitForCountdown();

      //worldContainer.showinfo = true;
      //world.set(worldContainer);

      document.querySelector(".countdown").innerText = "START!";
      document.querySelector(".character-name").innerText = "Nézz a készülékedre!";
      document.getElementById("button-host").style.display = "none";
      document.querySelector(".gamedata").style.display = "";
    }
    else {
      console.log(players[playerId].profile.class);
      switch(players[playerId].profile.class)
      {
        case 0:
          // draw question from class 0
          fetch("./gamedata/choices_0.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 1:
          // draw question from class 1
          fetch("./gamedata/choices_1.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 2:
          // draw question from class 1
          fetch("./gamedata/choices_2.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 3:
          // draw question from class 1
          fetch("./gamedata/choices_3.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 4:
          // draw question from class 1
          fetch("./gamedata/choices_4.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 5:
          // draw question from class 1
          fetch("./gamedata/choices_5.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 6:
          // draw question from class 1
          fetch("./gamedata/choices_6.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        case 7:
          // draw question from class 1
          fetch("./gamedata/choices_7.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
        default:
          fetch("./gamedata/choices.json")
          .then(res => res.json())
          .then(data => choices = data)
          .then(() => console.log(choices))
          .then(() => showChoice());
          break;
      }

      document.querySelector(".playerinfo").innerText = players[playerId].profile.name+"\n"+players[playerId].profile.description;
      document.getElementById("clientui").style.display = "";
      document.querySelector(".character-name").style.display = "none";
      document.getElementById("nongameplay").style.display = "none";
      document.querySelector(".gamedata").style.display = "none";
    }
  }

  function showChoice()
  {
    if(choices.length >= 1)
    {
      curChoice = randomFromArray(choices);
      var index = choices.indexOf(curChoice);
      if (index > -1) {
        choices.splice(index, 1);
      }

      document.getElementById("question").innerText = curChoice.text;
      document.getElementById("a-button").innerText = curChoice.aText;
      document.getElementById("b-button").innerText = curChoice.bText;
    }
    else
    {
      document.getElementById("clientui").style.display = "none";
      document.getElementById("nongameplay").style.display = "";
      document.querySelector(".character-name").style.display = "";
      document.querySelector(".character-name").innerText = "Dőlj hátra!\nElfogytak a kérdések számodra...";
    }

    /*console.log(choices);

    do
    {
      curChoice = randomFromArray(choices);
    } while(curChoice.minBudget <= players[playerId].profile.budget && players[playerId].profile.budget <= curChoice.minBudget+3)

    document.getElementById("question").innerText = curChoice.text;
    document.getElementById("a-button").innerText = curChoice.aText;
    document.getElementById("b-button").innerText = curChoice.bText;*/

    //showChoice();
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
    {
      //lis[i].innerHTML = numlis[i];
      new_ul.appendChild(lis[i]);
    }

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
          profile: profiles[0],
          CO: 0,
          Happyness: 0,
          Wealthyness: 0
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

})();
