//META{"name":"nyaaPlugin"}*//

// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/Sorter.plugin.js
// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/ReorderServers.plugin.js

var nyaaPlugin = function () {};
nyaaPlugin.prototype.load = function () {
    // ...
};
nyaaPlugin.prototype.start = function () {
    BetterAPI();
    var self = this;
    
    this.serverBuckets;
    try{
        this.serverBuckets = JSON.parse(localStorage.buckets);
    }catch(e){ }
    if(!this.serverBuckets) this.serverBuckets = {};
    
    var bucketNames = Object.keys(this.serverBuckets);
    if(bucketNames.length == 0){
        this.serverBuckets["bucket"] = {};
        this.serverBuckets["bucket"].servers = [];
        bucketNames = Object.keys(this.serverBuckets);
    }
    for(var i = 0; i < bucketNames.length; ++i){
        this.addBucket(bucketNames[i]);
    }
    
    
    window.addEventListener('keydown', function(e){
        if(e.ctrlKey && e.which == 71){
            //self.displaySearchbar()
            
            self.addServerPrompt();
        }
    });
    
    setTimeout(function(){
        // Give it a second to make sure all the server are loaded on the side...
        var bucketNames = Object.keys(self.serverBuckets);
        for(var i=0; i < bucketNames.length; ++i){
            var bucketName = bucketNames[i];
            var servers = self.serverBuckets[bucketName].servers;
            for(var s = 0; s < servers.length; ++s){
                self.addServer(servers[s].id, servers[s].name, bucketName);
            }
        }
    }, localStorage.bucketTimeout || 10000);
};

nyaaPlugin.prototype.addBucket = function(bucketName){
    var self = this;
    
    var bucketButton = $("<div style='border: 1px solid red;'>" + bucketName + "</div>")
        .css({
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.5)',
            'border-radius': '5px',
            cursor: 'pointer',
            'padding': '5px',
            'margin-bottom': '10px',
            'font-size': '0.65em',
        });
    var bucket = $("<div>" + bucketName + "! <span style='float: right;'>Open server and press Ctrl+G to add.</span><br/></div>")
        .css({
            'border-radius': '5px',
            'box-shadow': '0px 3px 6px rgba(0,0,0,0.3)',
            'background': 'rgba(0,0,0,0.8)',
            'display': 'none',
            'position': 'absolute',
            'left': '120px',
            'z-index': '10',
            'padding': '20px',
            'width': '850px',
            'max-width': 'calc(100% - 200px)',
            'color': 'white',
            'overflow-y': 'auto',
            'max-height': '70%',
        });
    
    $(".guilds .guild-separator").after(bucketButton);
    $(".guilds .guild-separator").after(bucket);
    bucketButton.mousedown(function(){
       if(bucket.css('display') == "none"){
           bucket.css("display", "block");
       }else{
           bucket.css("display", "none");
       }
    });
    if(!self.serverBuckets[bucketName]){
        self.serverBuckets[bucketName] = {};
        self.serverBuckets[bucketName].servers = [];
    }
    this.serverBuckets[bucketName].$elem = bucket;
    this.serverBuckets[bucketName].$button = bucketButton;
    self.saveBuckets();
}

nyaaPlugin.prototype.addServerPrompt = function(){
    var self = this;
    var currentServerId = BetterAPI.getCurrentServerID();
    var currentServerName = BetterAPI.getCurrentServerName();
    
    var addPrompt = $("<div>Add to folder:</div>")
        .css({
            'border-radius': '5px',
            'box-shadow': '0px 3px 6px rgba(0,0,0,0.3)',
            'background': 'rgba(0,0,0,0.8)',
            'position': 'absolute',
            'left': '50%',
            'top': '50%',
            'transform': 'translate(-50%, -50%)',
            'z-index': '15',
            'padding': '20px',
            'color': 'white',
            'overflow-y': 'auto',
            'max-height': '70%',
            'width': '300px',
        });
    var bucketNames = Object.keys(this.serverBuckets);
    for(var i = 0; i < bucketNames.length; ++i){
        (function(bucketName){
            var bucketPrompt = $("<div>" + bucketName + "</div>")
                .css({
                    'padding': '10px',
                    'background': 'rgba(32,32,32,0.8)',
                    'width': '100%',
                    'cursor': 'pointer',
                    'box-sizing': 'border-box',
                })
                .hover(function(e){
                    $(this).css('background', e.type === "mouseenter" ? 'rgba(64,64,64,0.8)' : 'rgba(32,32,32,0.8)');
                })
                .click(function(){
                    self.addServer(currentServerId, currentServerName, bucketName);
                    addPrompt.remove();
                });
            addPrompt.append(bucketPrompt);
        })(bucketNames[i]);
    }
    
    var newServerPrompt = $("<div style='margin-top: 15px;'>Create new folder:</div>");
    var newServerInput = $("<input type='text' placeholder='name' style='width: 100%; padding: 3px; box-sizing: border-box;'/>")
        .keyup(function(e){
            if(e.which == 13){
                var bucketName = newServerInput.val();
                if(!self.serverBuckets[bucketName]) self.addBucket(bucketName);
                self.addServer(currentServerId, currentServerName, bucketName);
                addPrompt.remove();
                e.preventDefault();
            }
        });
    newServerPrompt.append(newServerInput);
    addPrompt.append(newServerPrompt);
    
    addPrompt.append($("<div style='margin-top: 15px; cursor: pointer; font-weight: bold;'>Cancel</div>").mouseup(function(){ addPrompt.remove(); }));
    
    $("body").append(addPrompt);
    //this.addServer(currentServerId, currentServerName, "bucket");
}

nyaaPlugin.prototype.addServer = function(currentServerId, currentServerName, bucketName){
    //alert(BetterAPI.getCurrentTextChannelName() + "\n" + BetterAPI.getCurrentTextChannelID() + "\n" + BetterAPI.getCurrentServerName() + "\n" + BetterAPI.getCurrentServerID());
    var self = this;
    
    $('.guilds > .guild').each(function(i, el) {
        var id = self.getGID(el);
        if(!id) return;
        var serverId = id.replace(/^[^\$]*\$/, "");
        
        if(serverId == currentServerId){
            
            var container = $("<div><br/>" + currentServerName + "</div>")
                .css({
                    'display': 'inline-block',
                    'margin': '10px',
                    'color': 'white',
                    'text-align': 'center',
                    'font-size': '0.6em',
                    'width': '70px',
                })
            var removeButton = $("<div>x</div>")
                .css({
                    'color': 'red',
                    'cursor': 'pointer',
                    'font-weight': 'bold',
                    'display': 'inline-block',
                    'margin-left': '6px',
                });
            removeButton.mousedown(function(){
                self.removeServer(currentServerId, bucketName);
            });
            container.append(removeButton);
            
            container.prepend($(this));
            $(this).css({
                'display': 'inline-block',
            });
            self.serverBuckets[bucketName].$elem.append(container); // todo: by bucket name.
            
            if(!self.serverBuckets[bucketName]){
                // TODO: have to create the bucket and button for this if it doesn't exist yet!!
                self.serverBuckets[bucketName] = {};
                //self.serverBuckets[bucketName].$elem = bucket;
                self.serverBuckets[bucketName].servers = [];
            }
            self.serverBuckets[bucketName].servers.push({
                id: currentServerId,
                name: currentServerName
            });
            self.saveBuckets();
            
            return false;
        }
       
    });
}

nyaaPlugin.prototype.removeServer = function(serverId, bucketName){
    var self = this;
    try{
        var servers = self.serverBuckets[bucketName].servers;
        for(var i=0; i < servers.length; ++i){
            if(servers[i].id == serverId){
                self.serverBuckets[bucketName].servers.splice(i, 1);
                
                this.serverBuckets[bucketName].$elem.find('li').each(function(i, el){
                    var id = self.getGID(el);
                    if(!id) return;
                    var thisServerId = id.replace(/^[^\$]*\$/, "");
                    if(serverId == thisServerId){
                        var p = $(this).parent();
                        $(".guilds").append($(this)); // todo... this adds to the end of the list, not where it was before ;-;
                        p.remove();
                        $(this).css({
                            'display': 'block',
                        });
                    }
                });
            }
        }
    }catch(e){
        console.log("Remove failed:", e, e.message);
        return false;
    }
    self.saveBuckets();
}

nyaaPlugin.prototype.saveBuckets = function(){
    localStorage.buckets = JSON.stringify(this.serverBuckets);
}

nyaaPlugin.prototype.stop = function () {
    //$(document).off("dblclick.dce");
};

nyaaPlugin.prototype.unload = function () {
};

nyaaPlugin.prototype.getGID = function(el) {
	/*if (!el || !el.getAttribute('data-reactid')) return;
	return el.getAttribute('data-reactid').split('$')[1];*/
	if(!el) return;
	var channelLink = $(el).find('a.avatar-small').attr('href');
	if(!channelLink) return;
	return channelLink.substring(channelLink.lastIndexOf('/') + 1);
};


nyaaPlugin.prototype.getSettingsPanel = function () {
    return "";
};

nyaaPlugin.prototype.getName = function () {
    return "NyaaPlugin";
};
nyaaPlugin.prototype.getDescription = function () {
    return "Some helpful stuff for lots of servers";
};
nyaaPlugin.prototype.getVersion = function () {
    return "0.1.3";
};
nyaaPlugin.prototype.getAuthor = function () {
    return "tablekat";
};
