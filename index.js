class GPLUI extends Screen {
    onCreate() {
        this.setMode(1);
        var answerbox = Utils.inflate({type: "div"}),
            defcfg = {cc: "us", pt: "http", upt: 99, dwn: 512, flg: "allowsHttps"},
            cfg = {}, ctx = this;

        answerbox.appendView(new TextView("title", "GetProxyList.com UI 2.0"));
        this.ab = answerbox;
        this.appendView(this.ab);

        if(!localStorage.gpl_settings) localStorage.gpl_settings = JSON.stringify(defcfg);

        try {
            cfg = JSON.parse(localStorage.gpl_settings);
        } catch(e) {
            cfg = defcfg
        }
        
        var blocks = {
            location: new TextInputView().setTitle("Enter country code (XX):").fromString(cfg.cc),
            proto: new TextInputView().setTitle("Enter protocol (HTTP/SOCKS5):").fromString(cfg.pt),
            minuptime: new TextInputView().setTitle("Enter min uptime (%):").fromString(cfg.upt),
            mindwspeed: new TextInputView().setTitle("Min speed (KBps):").fromString(cfg.dwn),
            flags: new TextInputView().setTitle("Flags:").fromString(cfg.flg)
        };

        this.appendView(new Button().setText("Get proxy").setOnClickListener(function(){
            ctx.doMagic();
        }));

        this.appendView(new Button().setText("Preview URL").setOnClickListener(function(){
            ctx.preview();
        }));

        this.appendView(new Button().setText("Show log").setOnClickListener(function(){
            ctx.showlog();
        }));

        this.blocks = blocks;
        this.log = "No logs!";

        for(var a in blocks) this.appendView(blocks[a]);
    }

    doMagic() {
        var url = this.buildURL(), ctx = this,
            xhr = new XMLHttpRequest();

        xhr.open("GET", url);
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4) {
                ctx.log = "Do request complete! Status "+xhr.status+"<br/>";
                ctx.log += "<pre style='font-size:12px;max-width:300px;overflow:auto'>"+xhr.responseText+"</pre>"
                var data = JSON.parse(xhr.responseText);
                ctx.ab.innerHTML = "";
                if(data.error) {
                    ctx.log += "Server error! Finish!";
                    ctx.ab.appendView(new TextView("title", data.error))
                    return;
                }

                ctx.ab.appendView(new TextView("title", data.ip+":"+data.port));
                ctx.saveCfg();
            }
        };
        xhr.send();
    }

    saveCfg() {
        var bl = this.blocks,
            strs = {};

        for(var a in bl) strs[a] = bl[a].toString();

        localStorage.gpl_settings = JSON.stringify({
            cc: strs.location, pt: strs.proto,
            upt: strs.minuptime, dwn: strs.mindwspeed,
            flg: strs.flags
        });
    }

    buildURL() {
        var bl = this.blocks, url = "https://api.getproxylist.com/proxy?",
            strs = {};

        for(var a in bl) strs[a] = bl[a].toString();

        if(strs.location) url += "country="+strs.location+"&";
        if(strs.proto) url += "protocol="+strs.proto+"&";
        if(strs.minuptime) url += "minUptime="+strs.minuptime+"&";
        if(strs.mindwspeed) url += "minDownloadSpeed="+strs.mindwspeed+"&";

        if(strs.flags) for(var a in strs.flags.split()) 
            url += strs.flags.split()[a]+"=true&";

        url = url.substr(0,url.length-1);

        console.log(url);
        return url;
    }

    preview() {
        var d = new Dialog().setMessage(this.buildURL())
            .addButton(new Button().setText("Ok").setOnClickListener(function(){
                d.hide();
            })).show();
    }

    showlog() {
        var d = new Dialog().setMessage(this.log)
            .addButton(new Button().setText("Ok").setOnClickListener(function(){
                d.hide();
            })).show();
    }
}

new GPLUI().start();