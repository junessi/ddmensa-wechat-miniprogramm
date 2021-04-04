//index.js

const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    takeSession: false,
    requestResult: '',
    loadingCanteens: true,
    loggingIn: false
  },

  onLoad: function() {
    var thisPage = this;

    this.checkLoginStatus();

    wx.request({
      url: app.globalData.apiBaseUrl + '/canteens',
      success: function(res) {
        var date = new Date();
        var y = date.getFullYear(); // year
        var m = date.getMonth() + 1; // month
        if (m < 10) {
          m = "0" + m;
        }
        var d = date.getDate(); // day
        if (d < 10) {
          d = "0" + d;
        }

        // save canteen list
        thisPage.saveAllCanteens(res.data);

        thisPage.setData({
          today: y + "-" + m + "-" + d,
          canteens: thisPage.getAllCanteens(),
          stickCanteenButtons: [{
            type: "primary",
            text: "置顶食堂"
          }],
          unstickCanteenButtons: [{
            type: "warn",
            text: "取消置顶"
          }],
          loadingCanteens: false
        });
      }
    });
  },

  getAllCanteens: function() {
    return wx.getStorageSync("canteens");
  },

  getFavoriteCanteenIndex: function(canteenId) {
    var allCanteens = this.getAllCanteens();
    if (allCanteens && allCanteens["favorite"]) {
      for (var i in allCanteens["favorite"]) {
        if (allCanteens["favorite"][i].id == canteenId) {
          return i;
        }
      }
    }

    return -1;
  },

  getNormalCanteenIndex: function(canteenId) {
    var allCanteens = this.getAllCanteens();
    if (allCanteens && allCanteens["normal"]) {
      for (var i in allCanteens["normal"]) {
        if (allCanteens["normal"][i].id == canteenId) {
          return i;
        }
      }
    }

    return -1;
  },

  saveAllCanteens: function(canteens) {
    if (!wx.getStorageSync("canteens")) {
      var canteenData = {
        "favorite": [],
        "normal": this.sortCanteens(canteens)
      };    
  
      this.setStorageSync("canteens", canteenData);
    }

    return canteenData;
  },

  savefavoriteCanteen: function(e) {
    var canteenId = e.detail.slideItemData;
    var iFavorite = this.getFavoriteCanteenIndex(canteenId);
    var iNormal = this.getNormalCanteenIndex(canteenId);
    if ((iFavorite < 0) && (iNormal >= 0)) {
      var allCanteens = this.getAllCanteens();
      var fCanteens = allCanteens["favorite"];
      var nCanteens = allCanteens["normal"];
      fCanteens.push(allCanteens["normal"][iNormal]);
      nCanteens.splice(iNormal, 1);

      // sort canteens
      this.sortCanteens(fCanteens);
      this.sortCanteens(nCanteens);

      this.setStorageSync("canteens", allCanteens);
      this.setData({
        canteens: allCanteens
      });
    }
  },

  removefavoriteCanteen: function(e) {
    var canteenId = e.detail.slideItemData;
    var iFavorite = this.getFavoriteCanteenIndex(canteenId);
    var iNormal = this.getNormalCanteenIndex(canteenId);
    if ((iFavorite >= 0) && (iNormal < 0)) {
      var allCanteens = this.getAllCanteens();
      var fCanteens = allCanteens["favorite"];
      var nCanteens = allCanteens["normal"];
      nCanteens.push(allCanteens["favorite"][iFavorite]);
      fCanteens.splice(iFavorite, 1);

      // sort canteens
      this.sortCanteens(fCanteens);
      this.sortCanteens(nCanteens);

      this.setStorageSync("canteens", allCanteens);
      this.setData({
        canteens: allCanteens
      });
    }
  },

  sortCanteens: function(canteens) {
    return canteens.sort((a, b) => a.name.localeCompare(b.name));
  },

  promisify: function(fn) {
    // promisify() 返回的是一个函数，
    // 这个函数跟传入的 fn（即 wx.abcd） 签名相同（或兼容）
    return async function(args) {
    //                    ^^^^ 接受一个单一参数对象
        return new Promise((resolve, reject) => {
    //             ^^^^^^^^^^^ 返回一个 Promise 对象
            fn({
    //      ^^ ^ 调用原函数并使用改造过的新的参数对象
                ...(args || {}),
    //          ^^^^^^^^        这个新参数对象得有原本传入的参数，
    //                      ^^  当然得兼容没有传入参数的情况
                success: res => resolve(res),
    //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^  注入 success 回调，resovle 它
                fail: err => reject(err)
    //          ^^^^^^^^^^^^^^^^^^^^^^^^ 注入 fail 回调，reject 它
            });
        });
    };
  },

  async getLoginCode() {
    var loginCode = "";
    try {
      const promisifiedWxLogin = this.promisify(wx.login);
      const res = await promisifiedWxLogin();
      loginCode = res.code;
    }
    catch (e) {
      console.log("wx.login: 获取登录码失败");
    }

    return loginCode;

    /* before refactor
    return new Promise((resolve, reject) => {
      wx.login({
        success: function(res) {
          if (res.code) {
            resolve(res.code);
          } else {
            console.log("login: 获取登录码失败");
            resolve("");
          }
        }
      });
    });
    */
  },

  async getAppUserInfo(code) {
    try {
      const promisifiedWxCheckSession = this.promisify(wx.checkSession);
      await promisifiedWxCheckSession();
    }
    catch (e) {
      console.log("login: 密钥仍有效，无需重新获取。");
    }

    var appUserInfo = {};
    try {
      const promisifiedWxRequest = this.promisify(wx.request);
      var userInfo = wx.getStorageSync('userInfo');
      appUserInfo = await promisifiedWxRequest({
        url: app.globalData.apiBaseUrl + '/wechat/user/login',
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          "code": code,
          "rawData": userInfo["rawData"],
          "signature": userInfo["signature"]
        }
      });

    }
    catch (e) {
      console.log("Failed to fetch appUserInfo: " + e);
    }

    return appUserInfo;

    /* before refactor
    return new Promise((resolve, reject) => {
      wx.checkSession({
        success: function() {
          var userInfo = wx.getStorageSync('userInfo');
          wx.request({
            url: app.globalData.apiBaseUrl + '/wechat/user/login',
            method: "POST",
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            data: {
              "code": code,
              "rawData": userInfo["rawData"],
              "signature": userInfo["signature"]
            },
            success: function(res) {
              resolve(res);
            }
          });
        },
        fail: function () {
          console.log("login: 密钥仍有效，无需重新获取。");
          resolve({});
        }
      })
    });
    */
  },

  async getUserInfo() {
    const promisifiedWxGetUserInfo = this.promisify(wx.getUserInfo);
    const res = await promisifiedWxGetUserInfo();
    var userInfo = res.userInfo;
    userInfo.rawData = res.rawData;
    userInfo.signature = res.signature;
    return userInfo;

    /*
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: function(res) {
          var userInfo = res.userInfo;
          userInfo.rawData = res.rawData;
          userInfo.signature = res.signature;
          resolve(userInfo);
        }
      })
    });
    */
  },

  async login(e) {
    if (!e.detail.userInfo) {
      console.log("用户拒绝授权获取用户信息");
      return;
    }

    this.setData({
      loggingIn: true
    });
    var appUserInfo = null;
    var code = await this.getLoginCode();
    console.log("login: 登录码: " + code);

    var userId = 0;
    var token = "";
    var userInfo = await this.getUserInfo();

    this.setStorage({
      key: 'userInfo',
      data: userInfo
    });

    if (code) {
      appUserInfo = await this.getAppUserInfo(code);
      console.log("login: AppUserInfo: ");
      console.log(appUserInfo);

      if (appUserInfo) {
        // appUserInfo不为空，重新获取从服务器返回的用户ID。
        userId = appUserInfo.data.user.id;
        token = appUserInfo.data.user.token;
      }
      else {
        // appUserInfo 为空则说明本地用户信息仍然有效。
        userId = wx.getStorageSync("userId");
      }
    }

    console.log("userId: " + userId);
    console.log("token: " + token);
    console.log(userInfo);

    this.setStorage({
      key: 'userId',
      data: userId
    });

    this.setStorage({
      key: 'token',
      data: token
    });

    this.setData({
      loggedIn: true,
      userInfo: userInfo,
      loggingIn: false
    });
  },

  checkLoginStatus: function(e) {
    var loggedIn = false;
    var userInfo = wx.getStorageSync("userInfo");

    if (userInfo) {
      loggedIn = true;
    }

    this.setData({
      loggedIn: loggedIn,
      userInfo: userInfo
    })
  },

  logout: function(e) {
    var thisPage = this;
    wx.showModal({
      title: '提示',
      content: '您确定要退出登录吗？',
      success: function(e) {
        if (e.confirm) {
          // 删除用户登录信息
          wx.removeStorage({
            key: 'userInfo'
          })

          // 删除用户id
          wx.removeStorage({
            key: 'userId'
          })

          // 删除用户token
          wx.removeStorage({
            key: 'token'
          })

          // 修改登录状态
          thisPage.setData({
            loggedIn: false
          });
        }
      }
    });
  },

  /**
   * 二次封装setStorage()
   * 已知bug，见: https://developers.weixin.qq.com/community/develop/doc/00082c237aca00815c2897ba951400?_at=1567987200123
   **/
  setStorage: function(data) {
    if (("key" in data) && ("value" in data)) {
      this.setStorage(data["key"], data["value"]);
    }
  },

  setStorage: function(key, value) {
    try {
      wx.setStorage(key, value);
    }
    catch {
      wx.setStorage(key, value);
    }
  },

  /**
   * 二次封装setStorageSync()
   * 已知bug，见: https://developers.weixin.qq.com/community/develop/doc/00082c237aca00815c2897ba951400?_at=1567987200123
   **/

  setStorageSync: function(data) {
    if (("key" in data) && ("value" in data)) {
      this.setStorageSync(data["key"], data["value"]);
    }
  },

  setStorageSync: function(key, value) {
    try {
      wx.setStorageSync(key, value);
    }
    catch {
      wx.setStorageSync(key, value);
    }
  }

})