const app = getApp()

Page({
  onLoad: function (options) {
    var thisPage = this;

    console.log(options.canteenId + ": " + options.canteenName);
    wx.setNavigationBarTitle({title: options.canteenName});

    this.setData({
      dateIndex: 0,
      dates: [],
      dates_closed: [],
      selectedDate: "",
      canteenId: options.canteenId,
      canteenName: options.canteenName,
      today: options.today,
      showMealInfoDialog: false,
      mealinfo: [],
      cachedMealIds: [],
      isFirstDate: false,
      isLastDate: false,
      isCanteenClosed: false,
      loadingDates: true,
      loadingMeals: true
    });

    this.getCachedMealIds();
  },

  getDatesOfCanteen: function() {
    var thisPage = this;
    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + this.data.canteenId + "/days",
      success: function (res) {
        var dates = res.data;
        var dates_closed = [];
        var index = 0;
        for (var i in dates) {
          dates_closed.push(dates[i].date + (dates[i].closed ? " (closed)" : ""));

          if (dates[i].date == thisPage.data.today) {
            index = i;
          }
        }

        thisPage.setData({
          dateIndex: index,
          selectedDate: dates_closed[index],
          dates: dates,
          dates_closed: dates_closed,
          isFirstDate: index == 0,
          isLastDate: index == (dates.length - 1),
          isCanteenClosed: dates[index].closed,
          loadingDates: false,
          loadingMeals: !dates[index].closed
        });

        if (dates[index].closed == false) {
          thisPage.gotoDate(index);
        }
      }
    });
  },
  
  showMealInfo: function (e) {
    this.setData({
      showMealInfoDialog: true,
      mealinfo: e.currentTarget.dataset.mealinfo
    })
  },

  likeMeal: function(e) {
    if (!app.isLoggedIn()) {
      // We should return if user is not logged in.
      this.alertUnloggedIn();
      return;
    }

    var thisPage = this;
    var mealId = e.currentTarget.dataset.mealId;
    var mealIndex = e.currentTarget.dataset.mealIndex;
    var userId = wx.getStorageSync("userId");
    var token = wx.getStorageSync("token");
    var canteenId = this.data.canteenId;
    var today = this.data.dates[this.data.dateIndex].date;
    var itemLikes = "meals[" + mealIndex + "].likes";
    var itemLiked = "meals[" + mealIndex + "].liked";

    this.setData({
      [itemLiked]: true
    });

    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + today + "/meals/" + mealId + "/",
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        "action": "like",
        "wechat_uid": userId,
        "token": token
    },
    success: function (res) {
        var result = res.data;
        if (result["status"] == 200) {
          var liked = result["liked"];
          var likesCount = result["likes"];
          thisPage.setData({
            [itemLikes]: likesCount,
            [itemLiked]: liked
          });
        }
        else {
          thisPage.setData({
            [itemLiked]: false
          });      
        }
      }
    });
  },

  dislikeMeal: function(e) {
    if (!app.isLoggedIn()) {
      // We should return if user is not logged in.
      this.alertUnloggedIn();
      return;
    }

    var thisPage = this;
    var mealId = e.currentTarget.dataset.mealId;
    var mealIndex = e.currentTarget.dataset.mealIndex;
    var userId = wx.getStorageSync("userId");
    var token = wx.getStorageSync("token");
    var canteenId = this.data.canteenId;
    var today = this.data.dates[this.data.dateIndex].date;

    var itemLikes = "meals[" + mealIndex + "].likes";
    var itemLiked = "meals[" + mealIndex + "].liked";

    this.setData({
      [itemLiked]: false
    });

    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + today + "/meals/" + mealId + "/",
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        "action": "dislike",
        "wechat_uid": userId,
        "token": token
      },
      success: function (res) {
        var result = res.data;
        if (result["status"] == 200) {
          var liked = result["liked"];
          var likesCount = result["likes"];
          thisPage.setData({
            [itemLikes]: likesCount,
            [itemLiked]: liked
          });
        }
        else {
          thisPage.setData({
            [itemLiked]: true
          });      
        }
      }
    });
  },

  promisify: function(fn) {
    return async function(args) {
        return new Promise((resolve, reject) => {
            fn({
                ...(args || {}),
                success: res => resolve(res),
                fail: err => reject(err)
            });
        });
    };
  },

  async getCachedMealIds() {
    var thisPage = this;
    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + this.data.canteenId + "/cached_meals/" + this.data.today,
      success: function (res) {
        thisPage.data.cachedMealIds = res.data.cached_meals;
        console.log("Cached meal ids: " + thisPage.data.cachedMealIds);
        thisPage.getDatesOfCanteen();
      }
    });
  },

  dateSelected: function (e) {
    var thisPage = this;
    const dateIndex = parseInt(e.detail.value);
    const date = this.data.dates[dateIndex].date;
    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + this.data.canteenId + "/cached_meals/" + date,
      success: function (res) {
        thisPage.data.cachedMealIds = res.data.cached_meals;
        console.log("Cached meal ids: " + thisPage.data.cachedMealIds);
        thisPage.gotoDate(dateIndex);
      }
    });
  },

  dateBack: function (e) {
    var thisPage = this;
    const date = this.data.dates[parseInt(this.data.dateIndex) - 1].date;
    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + this.data.canteenId + "/cached_meals/" + date,
      success: function (res) {
        thisPage.data.cachedMealIds = res.data.cached_meals;
        console.log("Cached meal ids: " + thisPage.data.cachedMealIds);
        thisPage.gotoDate(parseInt(thisPage.data.dateIndex) - 1);
      }
    });
  },

  dateNext: function (e) {
    var thisPage = this;
    const date = this.data.dates[parseInt(this.data.dateIndex) + 1].date;
    wx.request({
      url: app.globalData.apiBaseUrl + "/canteens/" + this.data.canteenId + "/cached_meals/" + date,
      success: function (res) {
        thisPage.data.cachedMealIds = res.data.cached_meals;
        console.log("Cached meal ids: " + thisPage.data.cachedMealIds);
        thisPage.gotoDate(parseInt(thisPage.data.dateIndex) + 1);
      }
    });
  },

  gotoDate: function(dateIndex) {
    var dates = this.data.dates;
    var selectedDate = dates[dateIndex].date;
    var dates_closed = this.data.dates_closed;
    this.setData({
      "today" : selectedDate
    });

    console.log("goto date: " + selectedDate);
    if (dates[dateIndex].closed == false) {
      var thisPage = this;
      var canteenId = this.data.canteenId;
      var userId = wx.getStorageSync("userId");
      var token = wx.getStorageSync("token");

      wx.request({
        url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + selectedDate + "/meals/",
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          "wechat_uid": userId,
          "token": token
        },
        success: function (res) {
          var meals = []; // no meal by default

          if (res && ("data" in res)) {
            meals = res.data;
          }

          thisPage.mealsPreprocessor(meals);
          thisPage.setData({
            meals: meals,
            isFirstDate: dateIndex == 0,
            isLastDate: dateIndex == (dates.length - 1),
            loadingDates: false,
            loadingMeals: false
          })
        }
      })
    }
    this.setData({
      dateIndex: dateIndex,
      isCanteenClosed: dates[dateIndex].closed,
      selectedDate: dates_closed[dateIndex],
      loadingDates: false,
      loadingMeals: !dates[dateIndex].closed
    });
  },

  mealsPreprocessor: function(meals) {
    for (var i in meals) {
      // beautify prices
      var prices = meals[i].prices;
      var arr = [];
      for (var j in prices) {
        arr.push(Number(prices[j]).toFixed(2) + " €");
      }
      meals[i].prices = "" + arr.join(" / ")

      // set "sold out" flag
      meals[i].soldout = !this.data.cachedMealIds.includes(meals[i].id);
    }
  },

  previewMealImage: function(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.imgUrl],
      current: '',
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },

  refreshMeals: function() {
    this.gotoDate(parseInt(this.data.dateIndex));
  }
});
