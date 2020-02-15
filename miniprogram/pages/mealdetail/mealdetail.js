Page({
  onLoad: function (options) {
    var thisPage = this
    wx.vrequest({
      url: 'http://juhu.info/redirect/studentenwerk_openmensa_api/openmensa/v2/canteens/' + options.canteenid + "/days/" + options.date + "/meals/" + options.mealid,
      success: function (res) {
        thisPage.setData({
          mealdetail: JSON.parse(res.data)
        })
      }
    })
  }
})
