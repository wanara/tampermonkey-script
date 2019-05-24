// ==UserScript==
// @name         petitlyrics-catcher
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  a script try to get lyrics in petitlyrics page!
// @author       wanara
// @match        https://petitlyrics.com/lyrics/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var lyrics_id = document.querySelector("meta[property='dable:item_id']").getAttribute('content');
    console.log(lyrics_id);
    //
    var script = document.createElement('script');
    script.text = '$.post("/com/get_lyrics.ajax",{lyrics_id:'+ lyrics_id
        +'},function(data){var len = data.length;var obj = [];'
        +'for(var i=0; i<len; i++){obj[i] = Base64.decode(data[i].lyrics)}obj.forEach(function(item){console.log(item)});})';
    document.body.appendChild(script);
})();