const app = getApp()

Page({
  onLoad: function (options) {
    var thisPage = this;

    console.log(options.canteenName);
    wx.setNavigationBarTitle({title: options.canteenName});

    this.setData({
      dateIndex: 0,
      dates: [],
      dates_closed: [],
      selectedDate: "",
      canteenId: options.canteenId,
      showMealInfoDialog: false,
      mealinfo: [],
      isFirstDate: false,
      isLastDate: false,
      isCanteenClosed: false,
      loadingDates: true,
      loadingMeals: true
    });

    // get dates of canteen
    wx.vrequest({
      url: app.globalData.apiBaseUrl + "/canteens/" + options.canteenId + "/days",
      success: function (res) {
        var dates = res.data;
        var dates_closed = [];
        var index = 0;
        for (var i in dates) {
          dates_closed.push(dates[i].date + (dates[i].closed ? " (closed)" : ""));

          if (dates[i].date == options.today) {
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
          var meals = [];
          var userId = wx.getStorageSync("userId");

          // get meals on specified date
          wx.vrequest({
            url: app.globalData.apiBaseUrl + "/canteens/" + options.canteenId + "/days/" + options.today + "/meals",
            data: {"wechat_uid": userId},
            success: function (res) {
              meals = res.data;
              thisPage.pricesModifier(meals);
              thisPage.setData({
                meals: meals,
                loadingDates: false,
                loadingMeals: false
              })
            }
          });
        }
      }
    })
  },

  showMealInfo: function (e) {
    this.setData({
      showMealInfoDialog: true,
      mealinfo: e.currentTarget.dataset.mealinfo
    })
  },

  likeMeal: function(e) {
    var thisPage = this;
    var mealId = e.currentTarget.dataset.mealId;
    var mealIndex = e.currentTarget.dataset.mealIndex;
    var userId = wx.getStorageSync("userId");
    var canteenId = this.data.canteenId;
    var today = this.data.dates[this.data.dateIndex].date;

    wx.vrequest({
      url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + today + "/meals/" + mealId,
      data: {"action": "like", "wechat_uid": userId},
      success: function (res) {
        var result = res.data;
        var itemLikes = "meals[" + mealIndex + "].likes";
        var itemLiked = "meals[" + mealIndex + "].liked";
        var liked = result["liked"];
        var likesCount = result["likes"];
        thisPage.setData({
          [itemLikes]: likesCount,
          [itemLiked]: liked
        })
      }
    });
  },

  dislikeMeal: function(e) {
    var thisPage = this;
    var mealId = e.currentTarget.dataset.mealId;
    var mealIndex = e.currentTarget.dataset.mealIndex;
    var userId = wx.getStorageSync("userId");
    var canteenId = this.data.canteenId;
    var today = this.data.dates[this.data.dateIndex].date;

    wx.vrequest({
      url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + today + "/meals/" + mealId,
      data: {"action": "dislike", "wechat_uid": userId},
      success: function (res) {
        var result = res.data;
        var itemLikes = "meals[" + mealIndex + "].likes";
        var itemLiked = "meals[" + mealIndex + "].liked";
        var liked = result["liked"];
        var likesCount = result["likes"];
        thisPage.setData({
          [itemLikes]: likesCount,
          [itemLiked]: liked
        })
      }
    });
  },

  dateSelected: function (e) {
    this.gotoDate(parseInt(e.detail.value));
  },

  dateBack: function (e) {
    this.gotoDate(parseInt(this.data.dateIndex) - 1);
  },

  dateNext: function (e) {
    this.gotoDate(parseInt(this.data.dateIndex) + 1);
  },

  gotoDate: function(dateIndex) {
    var dates = this.data.dates;
    var selectedDate = dates[dateIndex].date;
    var dates_closed = this.data.dates_closed;

    console.log("goto date: " + selectedDate);
    if (dates[dateIndex].closed == false) {
      var thisPage = this;
      var canteenId = this.data.canteenId;
      wx.vrequest({
        url: app.globalData.apiBaseUrl + "/canteens/" + canteenId + "/days/" + selectedDate + "/meals",
        success: function (res) {
          var meals = JSON.parse(res.data);

          thisPage.pricesModifier(meals);

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

  pricesModifier: function(meals) {
    for (var i in meals) {
      var prices = meals[i].prices;
      var arr = [];
      for (var j in prices) {
        arr.push(Number(prices[j]).toFixed(2) + " €");
      }
      meals[i].prices = "" + arr.join(" / ")
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
  }

});
