Page({
  onLoad: function (options) {
    var thisPage = this
    wx.vrequest({
      url: 'http://juhu.info/redirect/studentenwerk_openmensa_api/openmensa/v2/canteens/' + options.canteenid + "/days/" + options.date + "/meals",
      success: function (res) {
        thisPage.setData({
          canteenid: options.canteenid,
          date: options.date,
          meals: JSON.parse(res.data),
        })
      }
    })
  }
})
