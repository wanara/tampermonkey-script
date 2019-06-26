// ==UserScript==
// @name         petitlyrics-catcher
// @namespace    https://raw.githubusercontent.com/wanara/tampermonkey-script/master/petitlyrics-catcher.js
// @version      0.2
// @description  a script to get lyrics in petitlyrics page, copy by a icon on the right side of "☆Bookmark this page"!
// @author       wanara
// @match        https://petitlyrics.com/lyrics/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var lyrics_id = document.querySelector("meta[property='dable:item_id']").getAttribute('content');
    //add a button to copy
    var lists = document.querySelector("#social");
    var li = document.createElement('li');
    li.innerHTML = '<span class="ui-icon ui-icon-copy" id="clipboard" style="cursor: pointer;"></span>';
    lists.appendChild(li);
    var head= document.getElementsByTagName('head')[0];
    var getLyric = () => {
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
    //require clipboard.js in the page
    var clipboard= document.createElement('script');
    clipboard.type = 'text/javascript';
    clipboard.src = 'https://cdn.bootcss.com/clipboard.js/2.0.4/clipboard.min.js';
    head.appendChild(clipboard);
    console.log(Date.now());
    //execute getLyric after loading
    clipboard.addEventListener('load', getLyric);
})();
