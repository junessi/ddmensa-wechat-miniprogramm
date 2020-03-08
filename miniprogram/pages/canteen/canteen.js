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
          // get meals on specified date
          wx.vrequest({
            url: app.globalData.apiBaseUrl + "/canteens/" + options.canteenId + "/days/" + options.today + "/meals",
            success: function (res) {
              var meals = res.data;
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
