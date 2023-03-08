// ==UserScript==
// @name         OPQBot Sender
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  一个主要用于把推（色）文（图）发到Q群的脚本，借助的机器人框架为OPQBot。
// @author       tan
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @match        https://twitter.com/**/status/**
// @match        https://store.line.me/stickershop/product/**
// @icon         https://abs.twimg.com/responsive-web/client-web/icon-svg.168b89d5.svg
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       context-menu
// @connect      api.twitter.com
// @connect      stickershop.line-scdn.net
// @connect      127.0.0.1
// ==/UserScript==

(function() {
    'use strict';
    console.log("========debug========");

        GM_config.init(
    {
        'id': 'opqConfig', // The id used for this instance of GM_config
        'title' : '请填写Bot的相关配置',
        'fields': // Fields object
        {
            'opqHost': // This is the id of the field
            {
                'label': 'OPQ Host', // Appears next to field
                'type': 'text', // Makes this setting a text field
                'default': 'http://127.0.0.1:8888' // Default value if user doesn't change it
            },
            'qq':
            {
                'label': 'QQ号码(Bot)',
                'type': 'int'
            },
            'group':
            {
                'label': 'Q群号码(Bot所在的群)',
                'type': 'int'
            },
            'timeout':
            {
                'label': '超时时间(s)',
                'type': 'int',
                'min' : 15,
                'max' : 120,
                'default' : 30
            },
            'configFlag':
            {
              'type': 'hidden',
              'default': '-1'
            }
        }
    });

    const opq_host = GM_config.get('opqHost');
    const bot_qq = GM_config.get('qq');
    const group_number = GM_config.get('group');
    const timeout = 120; //GM_config.get('timeout')

    const bot_msg_api = `${opq_host}/v1/LuaApiCaller?qq=${bot_qq}&funcname=SendMsg&timeout=${timeout}`
    const template_json = {// send msg to group
        "toUser":parseInt(group_number),
        "sendToType":2,
        "sendMsgType":"PicMsg",
        "content":"",
        "picUrl":""
    }
    const wait = (ms, data) => new Promise( resolve => setTimeout(resolve, ms, data));

    const host = window.location.host;
    const path = window.location.pathname;

    switch (host) {
        case "store.line.me":
            lineSender();
            break;
        case "twitter.com":
            twitterSender();
            break;
        default:
            break;
    }

    function lineSender(){
        const stickerItem = document.querySelectorAll(".FnStickerPreviewItem");
        let i = 0;

        for(let item of stickerItem){

            const sticker = JSON.parse(item.getAttribute("data-preview"));
            const gif_img = sticker.animationUrl;
            template_json.picUrl=(gif_img===""?sticker.staticUrl:gif_img);
            console.log(sticker);
            wait(5*1000*i, JSON.stringify(template_json)).then((data) => {
            // wait(5*1000*i, sticker).then((data) => {
                // download(data.staticUrl, data.id+".png");

                GM_xmlhttpRequest ({// send msg to opqbot
                    method: "POST",
                    url: bot_msg_api,
                    data: data,
                    onload: function(response) {
                        console.log(response.responseText);
                    }
                });
            });

            i++;

        }
    }

    function twitterSender(){
        const graphql_api = "https://twitter.com/i/api/graphql";
        const query_id = "1aom9udy3DU8exs9Y8zhUA";
        const operation_name = "TweetResultByRestId";
        const auth = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

        const tweet_id = path.split("/")[3];
        const params = {
            "tweetId": tweet_id,
            "withTweetQuoteCount": true,
            "includePromotedContent": true,
            "withBirdwatchNotes": false,
            "withVoice": true,
            "withCommunity": true,
            "withSuperFollowsUserFields": true,
            "withUserResults": true,
            "withBirdwatchPivots": false,
            "withDownvotePerspective": false,
            "withReactionsMetadata": false,
            "withReactionsPerspective": false,
            "withSuperFollowsTweetFields": true
        }

        const append = "?variables=" + encodeURIComponent(JSON.stringify(params));
        const tweet_rest_api = [graphql_api, query_id, operation_name].join("/");

        let headers = {
            "Authorization" : auth
        };

        document.cookie.split(/\s*;\s*/).forEach(function(pair) {
            if(pair.indexOf('ct0') == 0){//get x-scrf-token
                const arr = pair.split(/\s*=\s*/);
                headers["x-csrf-token"] = decodeURIComponent(arr.splice(1).join('='));
            }
        });

        const opt = {// request graphql_api to get tweet data
            method: "GET",
            headers: headers
        };

        request(tweet_rest_api + append, opt)
            .then(response => {
                const obj = JSON.parse(response.responseText);
                return tweetToOpqJson(obj);
            })
            .then(queue => {
                for(let i = 0; i < queue.length; i++){
                    wait(5*1000*i, queue[i]).then((data) => {
                        GM_xmlhttpRequest ({// request graphql_api to get tweet data
                            method: "POST",
                            url: bot_msg_api,
                            data: data,
                            onload: function(response) {
                                console.log(response.responseText);
                            }
                        });
                    });

                }
            })//opq send

    }


    function tweetToOpqJson(obj){

        const msg_queue = [];
         //get json data
         const result = obj.data.tweetResult.result;
         const tweeter_info = result.core.user_results.result.legacy;
         const tweet_info = result.legacy;

         //tweeter
         console.log("======================");
         const user_name = tweeter_info.name;
         const user_id = tweeter_info.screen_name;
         const user_info = `tweet by ${user_name}(@${user_id})`

         //tweet content
         const full_text = tweet_info.full_text;
         const create_date = new Date(tweet_info.created_at).toLocaleString();

         let is_first = true;
         template_json.content = [full_text, user_info, create_date].join("\n");//init first message

         //media
         for(let item of tweet_info.entities.media){
             if(item.type == "photo"){
                 const media_url_https = item.media_url_https;
                 const split_index = media_url_https.lastIndexOf(".");
                 const img_type = media_url_https.substring(split_index + 1);

                 template_json.picUrl = media_url_https.substring(0, split_index) + `?format=${img_type}&name=orig`;
                 msg_queue.push(JSON.stringify(template_json));
                 console.log(JSON.stringify(template_json, null, '  '));

                 if(is_first) template_json.content = "";//empty content
             }
         }

         return msg_queue;

    }

    //https://gist.github.com/denniskupec/5b294d3e4c160831e3731f5845131ebe
    function request(url, opt={}) {
        Object.assign(opt, {
            url,
            timeout: 2000,
            responseType: 'json'
        })

        return new Promise((resolve, reject) => {

            opt.onerror = opt.ontimeout = reject
            opt.onload = resolve

            GM_xmlhttpRequest(opt)
        })
    }

    function download(url, name){
        fetch(url).then(res => res.blob().then(blob => {
            var a = document.createElement('a');
            var url = window.URL.createObjectURL(blob);
            var filename = name;
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        }))
    }

})();