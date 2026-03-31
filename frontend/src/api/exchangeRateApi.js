import axiosClient from './axiosClient'
const exchangeRateApi = {
  getRates: () => axiosClient.get('/exchange-rates'),
  convert: (params) => axiosClient.get('/exchange-rates/convert', { params }),
}
export default exchangeRateApi
