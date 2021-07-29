
// 身份确认

const sha1 = require("sha1");
const config = require("../config/config");
const {getUserSendData, parseXMLData, formatjsData} = require("./tools");

const reply = require("./reply");

module.exports = (w_api) =>{
    return async (req, res, next) => {
        const {signature, echostr, timestamp, nonce} = req.query;
        const {token} = config;

        const sha1ed_str = sha1([timestamp, nonce, token].sort().join(''));
        
        if(req.method === 'GET'){
            if(sha1ed_str === signature){
                res.send(echostr);
                console.log("success!");
            }else{
                res.end("erro");
                console.log("error");
            }
        }else if(req.method === 'POST'){
            if(sha1ed_str !== signature){
                res.end("error");
                
            }
            const xml_data = await getUserSendData(req);
            //console.log(xml_data);
            
            const js_data = await parseXMLData(xml_data);
            //console.log(js_data);

            const message = formatjsData(js_data);
            //console.log(message);

            const reply_mess = await reply(w_api, message);
            //console.log(reply_mess);
            res.send(reply_mess);
            
        }else{
            res.end("error");
        }
    }
}