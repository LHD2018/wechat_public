const rp = require("request-promise-native");

const { sub_text, tuling_apikey } = require("../config/config");


var postReq = function(url) {
    return new Promise((resolve, reject) => {
        rp({ method: 'POST', url, json: true })
            .then(res => {
                console.log(res);

                resolve(res);
            })
            .catch(err => {
                console.log("postRqt error" + err);
                reject("postRqt error" + err);
            })
    })
};

var getReq = function(url) {
    return new Promise((resolve, reject) => {
        rp({ method: 'GET', url, json: true })
            .then(res => {
                console.log(res);

                resolve(res);
            })
            .catch(err => {
                console.log("getRqt error" + err);
                reject("getRqt error" + err);
            })
    })
};

module.exports = async function(w_api, message) {


    let option = {
        ToUserName: message.FromUserName,
        FromUserName: message.ToUserName,
        CreateTime: Date.now(),
        MsgType: 'text'
    }

    let content = '不明白您的意思，请再说一次。。。';


    try {
        if (message.MsgType === 'event') {

            if (message.Event === 'subscribe') {
                content = sub_text;
            } else if (message.Event === 'CLICK') {
                if (message.EventKey === 'fight_pic_key') {
                    // 斗图
                    const get_pic_url = 'https://doutu.lccyy.com/t/doutu/all';
                    const _data = await getReq(get_pic_url);
                    //console.log(result.items[0].url);
                    const pic_url = _data.items[0].url;
                    const file_name = message.FromUserName + '.jpg';
                    await w_api.getPicFromNet(pic_url, file_name);
                    const result = await w_api.uploadTmpFile('image', file_name);
                    console.log(result);
                    option.MsgType = 'image';
                    option.MediaId = result.media_id;

                } else if (message.EventKey === 'sentence_key') {
                    const sentence_url = 'https://v1.hitokoto.cn/';
                    const result = await getReq(sentence_url);
                    if (result.from_who === null || result.from_who === result.from) {
                        result.from_who = '佚名';
                    }
                    content = result.hitokoto + "\n  ————《" + result.from + "》" + result.from_who;
                } else if (message.EventKey === 'help_key') {
                    content = sub_text;
                }
            }
        } else if (message.MsgType === 'location') {

            content = "纬度：" + message.Location_Y + "\n经度：" + message.Location_X;

        } else {
            let info = '';
            if (message.MsgType === 'text') {
                info = message.Content;
            } else if (message.MsgType === 'voice') {
                // 处理语音
                info = message.Recognition;
            }
            info = encodeURI(info);
            const tuling_url = `http://www.tuling123.com/openapi/api?key=${tuling_apikey}&info=${info}`;

            const result = await postReq(tuling_url);
            content = result.text;
        }

    } catch (error) {
        throw error;
    }

    option.Content = content;

    let reply_msg = `<xml>
    <ToUserName><![CDATA[${option.ToUserName}]]></ToUserName>
    <FromUserName><![CDATA[${option.FromUserName}]]></FromUserName>
    <CreateTime>${option.CreateTime}</CreateTime>
    <MsgType><![CDATA[${option.MsgType}]]></MsgType>`;


    if (option.MsgType === 'text') {
        reply_msg += `<Content><![CDATA[${option.Content}]]></Content>`;
    } else if (option.MsgType === 'image') {
        reply_msg += `<Image>
                        <MediaId><![CDATA[${option.MediaId}]]></MediaId>
                    </Image>`;
    }

    reply_msg += '</xml>';

    //console.log(reply_msg);
    return reply_msg;

};