// ==UserScript==
// @name         petitlyrics-catcher
// @namespace    https://raw.githubusercontent.com/wanara/tampermonkey-script/master/petitlyrics-catcher.js
// @version      1.0
// @description  a script to get lyrics in petitlyrics page, copy by a icon on the right side of "☆Bookmark this page"!
// @author       wanara
// @match        https://petitlyrics.com/lyrics/*
// @match        https://utaten.com/lyric/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const head= document.getElementsByTagName('head')[0];
    // copyright https://clibo.tw/commissions/37cGV6#google_vignette
    const imgurl = "https://assets.clibo.tw/images/commissions/37cGV6-2X3n.jpg?v=009c76c0c3bfb326e7083bfbd9af1911";
    const width = "40";
    const height = "40";
    var getLyric = null;
    //---
    var img = document.createElement("img");
    img.src = imgurl;
    img.width = width;
    img.height = height;
    img.style = "cursor: pointer";
    img.title = "Copy lyrics.";
    if(window.location.hostname == "petitlyrics.com"){
        const lyrics_meta = document.querySelector("meta[property='dable:item_id']");
        var lyrics_id = lyrics_meta && lyrics_meta.getAttribute('content');
        var lists = null;
        if(lyrics_id == null){//check if lyrics can be displayed --- example:"https://petitlyrics.com/lyrics/2771167"
            var pathclip = window.location.pathname.split("/");
            if(pathclip.length > 2) lyrics_id = pathclip[2];
            var bfrm1c = document.querySelector("div.bfrm1c div");
            img.width = 20;
            img.height = 20;
            img.id = "clipboard";
            bfrm1c.appendChild(img);
        }else{
            lists = document.querySelector("#social");
            var li = document.createElement('li');
            li.id = "clipboard";
            li.appendChild(img);
            lists.appendChild(li);//add a button to copy
        }
        if(!isNaN(lyrics_id) && lyrics_id > 0){
            getLyric = () => {
                console.log(Date.now());
                //insert a script to get lyrics accroding to website
                var script = document.createElement('script');
                script.text = [
                    'var arr = [];',
                    '$.post(',
                    '  "/com/get_lyrics.ajax", {',
                    '    lyrics_id: ' + lyrics_id,
                    '  },',
                    '  function(data) {',
                    '      var len = data.length;',
                    '      for(var i=0; i<len; i++) arr.push(Base64.decode(data[i].lyrics));',
                    '      var clipboard = new ClipboardJS("#clipboard", {',
                    '          text: function() {',
                    '              return arr.join("\\n");',
                    '         }',
                    '      });',
                    '      clipboard.on("success", function(e) {',
                    '          console.log(e);',
                    '      });',
                    '      clipboard.on("error", function(e) {',
                    '          console.log(e);',
                    '      });',
                    '    }',
                    '  );'
                ].join('\n');
                head.appendChild(script);
            }
        }
    }
    if(window.location.hostname == "utaten.com"){
        const link = document.querySelector("ul.lyricLink");
        var point = document.createElement("li");
        point.id = "clipboard";
        point.appendChild(img);
        link.appendChild(point);
        getLyric = () => {
            console.log(Date.now());
            //insert a script to convert lyrics
            var script = document.createElement('script');
            script.text = [
                'var arr = [];',
                'var line = "";',
                'var child = document.querySelector(".hiragana").childNodes;',
                'for(let i=0, len=child.length;i < len; i++){',
                '   const nodename = child[i].nodeName;',
                '   if(nodename == "BR"){arr.push(line); line = "";}',
                '   else if(nodename == "SPAN"){line += child[i].querySelector(".rb").innerText}',
                '   else if(line == ""){line = child[i].nodeValue.trimLeft()}',
                '   else{line += child[i].nodeValue}',
                '}',
                'var clipboard = new ClipboardJS("#clipboard", {',
                '   text: function() {',
                '        return arr.join("\\n");',
                '   }',
                '});',
                'clipboard.on("success", function(e) {',
                '    console.log(e);',
                '});',
                'clipboard.on("error", function(e) {',
                '    console.log(e);',
                '});'
            ].join('\n');
            head.appendChild(script);
        }
    }
    //require clipboard.js in the page
    var clipboard= document.createElement('script');
    clipboard.type = 'text/javascript';
    clipboard.src = 'https://cdn.bootcss.com/clipboard.js/2.0.4/clipboard.min.js';
    head.appendChild(clipboard);
    console.log(Date.now());
    //execute getLyric after loading
    clipboard.addEventListener('load', getLyric);

})();
