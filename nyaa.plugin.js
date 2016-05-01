//META{"name":"nyaaPlugin"}*//

// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/search.plugin.js
// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/customRoleColour.plugin.js
// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/serverhide.plugin.js
// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/Sorter.plugin.js
// https://github.com/Bluscream/BetterDiscord-Plugins-and-Themes/blob/master/src/plugins/ReorderServers.plugin.js
// https://raw.githubusercontent.com/Bluscream/BetterDiscord-Plugins-and-Themes/master/src/plugins/0_websock.plugin.js

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
    }catch(e){
        this.serverBuckets = {};
        this.serverBuckets["bucket"] = {};
        this.serverBuckets["bucket"].servers = [];
    }
    
    var bucketButton = $("<div style='border: 1px solid red;'>bucket</div>")
        .css({
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.5)',
            'border-radius': '5px',
            cursor: 'pointer',
            'padding': '5px',
            'margin-bottom': '10px',
        });
    var bucket = $("<div>Bucket! - Open server and pres Ctrl+G to add.<br/></div>")
        .css({
            'border-radius': '5px',
            'box-shadow': '0px 3px 6px rgba(0,0,0,0.3)',
            'background': 'rgba(0,0,0,0.8)',
            'display': 'none',
            'position': 'absolute',
            'left': '120px',
            'z-index': '10',
            'padding': '20px',
            'max-width': '600px',
            'color': 'white',
        });
    
    $(".guilds .guilds-separator").after(bucketButton);
    $(".guilds .guilds-separator").after(bucket);
    bucketButton.mousedown(function(){
       if(bucket.css('display') == "none"){
           bucket.css("display", "block");
       }else{
           bucket.css("display", "none");
       }
    });
    this.serverBuckets["bucket"].$elem = bucket;
    this.serverBuckets["bucket"].$button = bucketButton;
    self.saveBuckets();
    
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
    }, 5000);
};

nyaaPlugin.prototype.addServerPrompt = function(){
    var currentServerId = BetterAPI.getCurrentServerID();
    var currentServerName = BetterAPI.getCurrentServerName();
    
    //var addPrompt = $("<div>")
    this.addServer(currentServerId, currentServerName, "bucket");
}

nyaaPlugin.prototype.addServer = function(currentServerId, currentServerName, bucketName){
    //alert(BetterAPI.getCurrentTextChannelName() + "\n" + BetterAPI.getCurrentTextChannelID() + "\n" + BetterAPI.getCurrentServerName() + "\n" + BetterAPI.getCurrentServerID());
    var self = this;
    
    $('.guilds > li').each(function(i, el) {
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
            console.log(servers[i].id, '==', serverId, ' for remove');
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
                            'display': 'list-item',
                        });
                    }
                });
                
                break;
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
	if (!el || !el.getAttribute('data-reactid')) return;
	return el.getAttribute('data-reactid').split('$')[1];
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
    return "0.1.0";
};
nyaaPlugin.prototype.getAuthor = function () {
    return "tablekat";
};