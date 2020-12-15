on('ready',()=>{
    log(""+Campaign().get("playerpageid"));
    const getPageForPlayer = (playerid) => {
        let player = getObj('player',playerid);
        if(playerIsGM(playerid)){
            return player.get('lastpage');
        }

        let psp = Campaign().get('playerspecificpages');
        if(psp[playerid]){
            return psp[playerid];
        }

        return Campaign().get("playerpageid");
    };

    on("change:campaign:playerpageid",function(){
        var currentPage = Campaign().get("playerpageid")
        UpdateT(currentPage);
    });

    on("chat:message",(msg)=>{
      var split = msg.content.split("{{");
      if(split.length < 3){
          return;
      }
      
      if(split[1] !== "level=relion}} "  && split[1] !== "level=relion}}  " && split[9] !== "spelllevel=relion}} " && split[10] !== "spelllevel=relion}} "){
          return;
      }
      pc = msg.who;
      if(!GetCharacter(pc)){
          sendChat('Corruption',`/w ${msg.who} <code>You have to send relions as a character</code>`);
          sendChat('Corruption',`/w gm ${msg.who} tried to cast a relion with out having his character as the message sender`);
          return;
      }
       
      var c = GetCharCorruption(pc);
      if(c <= 0){
          sendChat('Corruption',`/w ${msg.who} <code>You don't have enough corruption to cast this</code>`);
          sendChat('Corruption',`/w gm ${msg.who} tried to cast a relion with <code>${c}</code>`);
          return
      }
       
      SetCharCorrupion(pc,c-1);
            
            playerPageID = getPageForPlayer(msg.playerid);
            UpdateTokens(pc,playerPageID);
            UpdatePortraits(pc);
       
       
    });



    on('chat:message',(msg)=>{
        if('api' !== msg.type || !playerIsGM(msg.playerid)) {
            return;
        } 
        const cmdName = "!UpdateImages";
        const cmdName2 = "!Cr";
        const msgTxt = msg.content;

        if (msgTxt.indexOf(cmdName) === 0) {
            playerPageID = getPageForPlayer(msg.playerid);
            UpdateT(playerPageID);
            UpdateP();
            
        }
        
        
        if (msgTxt.indexOf(cmdName2) === 0) {
            playerPageID = getPageForPlayer(msg.playerid);
            var content = msg.content.split("--");
            if(content.length === 4){
               
            var func = content[1];    
            var pc = content[2];
            var c = GetCharCorruption(pc);
            var newC = parseInt(content[3]);
            
            switch(func){
                case "Add":
                    c += newC;
                    
                    break;
                case "Remove":
                    c -= newC;
                    break;
                case "Set":
                    c = newC;
                    break;
                case "Store":
                    var replace = false;
                    if(newC === 1)
                        replace = true;
                    SetData(pc,replace);
                    return;
                    break;
            }
            if(c > 150){
                c = 150
            }
            SetCharCorrupion(pc,c);
            
            playerPageID = getPageForPlayer(msg.playerid);
            UpdateTokens(pc,playerPageID);
            UpdatePortraits(pc);
            }
        }
    });
    
     function SetCharCorrupion(pc, Corruption){
        var CharID = GetCharID(pc);
        if(Corruption < 0)
            Corruption = 0;
        var charCorruption = findObjs({
            name: "Corruption",
            _characterid: CharID,
        });
        _.each(charCorruption, function(atrCr){
            atrCr.set("current", Corruption);
        });
    };
    function GetCharCorruption(pc) {
    var CharID = GetCharID(pc)
     var results = "";
    var charSpeed = findObjs({
        name: "Corruption",
        _characterid: CharID,
    });
    _.each(charSpeed, function(atrSpd){
        results =  atrSpd.get("current");
    });
    
    if (results == NaN) {
        results = "";
    }
    
    return results;
};
    
    function UpdateT(playerPageID){
        var data = loadData();
        
         var content = data.split("|");
         for(let i = 0; i < content.length;i++){
              UpdateTokens(content[i],playerPageID);
         }
    }
    
    function UpdateP(){
        var data = loadData();
        
         var content = data.split("|");
        _.each(content,function(c){
            UpdatePortraits(c);
        })
    }
    
    function UpdatePortraits(pc){
        var character = GetCharacter(pc);
        if(!character)
            return;
        var img = GetPortraitImage(pc);
        
        character.set('avatar',getCleanImgsrc(img));
    }
    
    function GetCharacter(pc){
        const char = findObjs({                              
                    name: pc,
                    _type: "character"
                });
        return char[0];
    }
    
    function GetTokens(token_name,playerPageID){
        const tokens = findObjs({                              
            _pageid: playerPageID,
            _type: "graphic",                          
            _name: token_name.trim()
        });

        if(tokens.length){
            return tokens;
        } else {
            return null;
        }
    }
    
    function UpdateTokens (pc,playerPageID){
        var token_name = GetTokenName(pc);
        const tokens = GetTokens(token_name,playerPageID);
        if(tokens != null){
            const img = GetImage(tokens[0],pc);
            for(var i =0; i < tokens.length; i++){
                setTokenImgUrl(tokens[i],0,img);
            }
        }
        
        
    }
    
    function GetTokenName(pc){
        var CharID = GetCharID(pc)
        if(!CharID)
         return "no character";
        var results = "";
        var tokenName = findObjs({
            name: "TokenName",
            _characterid: CharID,
        });
        _.each(tokenName, function(atrName){
            results =  atrName.get("current");
        });
    
        if (results == NaN) {
            results = "";
        }
        log(""+results);
        
        return results;
    }
    
    function GetImage(token,pc){
        var corruption = GetCharCorruption(pc);
        return getCharacterTokenImage(pc,getStage(corruption));
    }
    
    function GetPortraitImage(pc){
        var corruption = GetCharCorruption(pc);
        return getCharacterPortraitImage(pc,getStage(corruption));
    }
    
    function getStage(corruption){
        var imgNumber = 0;
        
        for(var i = 6; i > -1; i--){
            if(corruption > 0){
                corruption -= 25;
                imgNumber++;
            }else{
                break;
            }
        }
        return imgNumber;
    }
    
    function getCharacterTokenImage(pc,imgNumber){
         var CharID = GetCharID(pc);
         if(!CharID)
            return null
         var attr = "Corruption_token_" + imgNumber;
     var results = "";
    var charImg = findObjs({
        name: attr,
        _characterid: CharID,
    });
    _.each(charImg, function(atrSpd){
        results =  atrSpd.get("current");
    });
    
    if (results == NaN) {
        results = "";
    }
    return results;
    }
    
    function getCharacterPortraitImage(pc,imgNumber){
        var CharID = GetCharID(pc);
         if(!CharID)
            return null;
         var attr = "Corruption_portrait_" + imgNumber;
     var results = "";
    var charImg = findObjs({
        name: attr,
        _characterid: CharID,
    });
    _.each(charImg, function(atrSpd){
        results =  atrSpd.get("current");
    });
    
    if (results == NaN) {
        results = "";
    }
    return results;
    }
    
    function GetCharID(pc){
        var char = GetCharacter(pc);
        if(char){
            return char.get("_id",function(id){
                return id;
            })
        } else {
            return null;
        }
    }
    
    
    
    function setTokenImgUrl(o, nextSide, nextURL) {
        o.set({
            currentSide: nextSide,
            imgsrc: getCleanImgsrc(nextURL)
        });		
    }
    
    function getCleanImgsrc (imgsrc) {
       var parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)(.*)$/);
       if(parts) {
          return parts[1]+'thumb'+parts[3];
       }
       return;
    };
   function loadData(){
       //replace with a token of your own that you never touch
       var token = findObjs({
                name:"textLocation",
                type:"graphic",
                pageid:"-M5l6gLf2nCnIBvuDnRI"
            });
            
        return token[0].get("gmnotes",function(g){
            return g;
        }) ;
   }
   
   function SetData(data,replace = false){
       var string = "";
       
       if(!replace){
           string = loadData();
       }
       string += data;
       //replace with a token of your own that you never touch
        var token = findObjs({
                name:"textLocation",
                type:"graphic",
                pageid:"-M5l6gLf2nCnIBvuDnRI"
            });
            
        token[0].set("gmnotes",string);    
   }
    
    log("-=> Corruption Loaded (!UpdateImages) [Last Edited December 15th 2020] <=-");
});
    