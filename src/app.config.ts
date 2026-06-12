export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/products/index',
    'pages/dashboard/index',
    'pages/data/index',
    'pages/entry/index',
    'pages/product-detail/index',
    'pages/calendar/index',
    'pages/credit/index',
    'pages/inventory/index',
    'pages/export/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF7A45',
    navigationBarTitleText: '摊主记账',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF7F3'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF7A45',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '记账'
      },
      {
        pagePath: 'pages/products/index',
        text: '商品'
      },
      {
        pagePath: 'pages/dashboard/index',
        text: '看板'
      },
      {
        pagePath: 'pages/data/index',
        text: '数据'
      }
    ]
  }
})
