
const {parseString} = require("xml2js");
const rp = require("request-promise-native");


module.exports = {

    getUserSendData(req){
        return new Promise((resolve, reject) => {
            let xml_data = "";
            req.on("data", data => {
                xml_data += data.toString();
            })
            .on("end", () => {
                resolve(xml_data);
            })
        })
    },

    parseXMLData(xml_data){
        return new Promise((resolve, reject) => {
            parseString(xml_data, {trim: true}, (err, data) => {
                if(!err){
                    resolve(data);
                }else{
                    reject("parseXMLData error" + err);
                }
            })
        })
    },

    formatjsData(js_data){
        let data = {};
        js_data = js_data.xml;

        if(typeof js_data === 'object'){
            for(let key in js_data){
                let value = js_data[key];
        
                if(Array.isArray(value) && value.length > 0){
                    data[key] = value[0];
                }
            }
        }
        return data;
    }
}