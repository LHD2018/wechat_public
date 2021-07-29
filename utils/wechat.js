const rp = require("request-promise-native");
const request = require("request");

const { writeFile, readFile, createReadStream, createWriteStream, unlinkSync } = require("fs");

const { appId, appsecret } = require("../config/config");

const menu_btn = require("../config/menu_btn");
const { resolve } = require("path");


class Wechat {

    getAccess_token() {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appsecret}`;

        return new Promise((resolve, reject) => {
            rp({ method: 'GET', url, json: true })
                .then(res => {
                    console.log(res);
                    res.expires_in = Date.now() + (res.expires_in - 300) * 1000;
                    resolve(res);
                })
                .catch(err => {
                    console.log(err);
                    reject("getAccess_token error" + err);
                })
        })

    }

    saveAccess_token(at_data) {
        at_data = JSON.stringify(at_data);
        return new Promise((resolve, reject) => {
            writeFile("./config/access_token.txt", at_data, err => {
                if (!err) {
                    console.log("file saved success!");
                    resolve();
                } else {
                    console.log("file saved error" + err);
                    reject(err);
                }
            })
        })
    }

    readAccess_token() {

        return new Promise((resolve, reject) => {
            readFile("./config/access_token.txt", (err, data) => {
                if (!err) {
                    console.log("file read success!");
                    data = JSON.parse(data);
                    resolve(data);
                } else {
                    console.log("file read error" + err);
                    reject(err);
                }
            })
        })
    }

    isValid(data) {
        if (!data || !data.access_token || !data.expires_in) {
            return false
        }

        return data.expires_in > Date.now();
    }

    fetchAccess_token() {
        if (this.access_token && this.expires_in && this.isValid(this)) {
            return Promise.resolve({
                access_token: this.access_token,
                expires_in: this.expires_in
            })
        }

        return this.readAccess_token()
            .then(async res => {
                if (this.isValid(res)) {
                    return Promise.resolve(res);
                } else {
                    const res = await this.getAccess_token()
                    await this.saveAccess_token(res);
                    return Promise.resolve(res);
                }
            })
            .catch(async err => {
                const res = await this.getAccess_token()
                await this.saveAccess_token(res);
                return Promise.resolve(res);
            })
            .then(async res => {
                this.access_token = res.access_token;
                this.expires_in = res.expires_in;
                return Promise.resolve(res);
            })
    }

    createMenu(menu_btn) {
        return new Promise(async(resolve, reject) => {
            try {
                const data = await this.fetchAccess_token();

                const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${data.access_token}`;

                const result = await rp({ method: 'POST', url, json: true, body: menu_btn });
                resolve(result);

            } catch (error) {
                reject("create memu" + error);
            }
        })
    }

    deleteMenu() {
        return new Promise(async(resolve, reject) => {
            try {
                const data = await this.fetchAccess_token();

                const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${data.access_token}`;

                const result = rp({ method: 'GET', url, json: true });

                resolve(result);

            } catch (error) {
                reject("delete menu:" + error);
            }
        })
    }

    uploadTmpFile(type, file_name) {
        const file_path = resolve(__dirname, "../media", file_name);
        //console.log(file_path);
        return new Promise(async(resolve, reject) => {
            try {
                const data = await this.fetchAccess_token();

                const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${data.access_token}&type=${type}`;

                const form_data = {
                    media: createReadStream(file_path)
                }

                const result = await rp({ url: url, method: 'POST', formData: form_data, json: true });
                //console.log(result);
                //unlinkSync(file_path);
                resolve(result);

            } catch (error) {
                reject("upload media:" + error);
            }
        })
    }

    getPicFromNet(url, file_name) {
        return new Promise(async(resolve, reject) => {
            request(url).pipe(createWriteStream(`./media/${file_name}`))
                .once('close', resolve)
        })
    }

    uploadForeverFile(type, file_name) {
        const file_path = resolve(__dirname, "../media", file_name);
        return new Promise(async(resolve, reject) => {
            try {
                const data = await this.fetchAccess_token();
                const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${data.access_token}&type=${type}`;

                const form_data = {
                    media: createReadStream(file_path)
                }
                const result = await rp({ url: url, method: 'POST', formData: form_data, json: true });
                console.log(result);
                const file_data = JSON.stringify(result);
                await writeFile("./config/forever_file.txt", file_data, err => {
                    if (!err) {
                        console.log("file saved success!");
                        resolve();
                    } else {
                        console.log("file saved error" + err);
                        reject(err);
                    }
                })


            } catch (error) {
                reject(error)

            }
        })
    }

}

// (async() => {

//     const w = new Wechat();

//     w.uploadForeverFile("image", "lhd.jpg");

//     // const del_res = await w.deleteMenu();
//     // console.log(del_res);

//     // const create_res = await w.createMenu(menu_btn);
//     // console.log(create_res);



// })()

module.exports = Wechat;